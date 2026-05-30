"""
Signal Engine — orchestrates signal generation for one or many symbols.

Each strategy is run against the symbol's historical data; results are
persisted to the database as Signal rows.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.signal import Signal
from app.models.watchlist import WatchlistItem
from app.models.user import User
from app.services.market_data import get_history
from app.strategies import ALL_STRATEGIES, STRATEGY_MAP
from app.strategies.base import SignalResult

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Core signal generation
# ---------------------------------------------------------------------------

async def generate_signals(
    symbol: str,
    strategies: Optional[list[str]] = None,
    db: Optional[AsyncSession] = None,
    user_id: Optional[int] = None,
    persist: bool = True,
) -> list[Signal]:
    """
    Run the requested strategies (or all if None) against `symbol`.

    If `db` and `user_id` are provided the resulting signals are persisted.
    Returns the list of Signal ORM objects (unsaved if db is None).
    """
    # Which strategies to run?
    if strategies:
        strategy_instances = [
            STRATEGY_MAP[name] for name in strategies if name in STRATEGY_MAP
        ]
    else:
        strategy_instances = ALL_STRATEGIES

    if not strategy_instances:
        return []

    # Fetch enough history for the most demanding strategy (200 SMA needs 201 bars)
    try:
        df = await get_history(symbol, period="2y", interval="1d")
    except Exception as e:
        logger.warning("Could not fetch history for %s: %s", symbol, e)
        return []

    if df is None or df.empty or len(df) < 30:
        return []

    current_price = float(df["Close"].iloc[-1])
    signals: list[Signal] = []

    for strategy in strategy_instances:
        try:
            result: Optional[SignalResult] = strategy.generate_signal(df, symbol)
        except Exception as e:
            logger.warning("Strategy %s failed for %s: %s", strategy.name, symbol, e)
            continue

        if result is None:
            continue

        signal = Signal(
            user_id=user_id or 0,
            symbol=result.symbol,
            strategy=result.strategy_name,
            action=result.action,
            price=result.price,
            confidence=result.confidence,
            reasoning=result.reasoning,
            indicator_values=result.indicator_values,
            stop_loss=result.stop_loss,
            take_profit=result.take_profit,
            stop_loss_pct=result.stop_loss_pct,
            take_profit_pct=result.take_profit_pct,
            acted_on=False,
        )
        signals.append(signal)

    if persist and db is not None and user_id is not None:
        for signal in signals:
            db.add(signal)
        try:
            await db.flush()
        except Exception as e:
            logger.error("Failed to persist signals: %s", e)
            await db.rollback()

    return signals


# ---------------------------------------------------------------------------
# Bulk: generate signals for every symbol on the user's watchlist
# ---------------------------------------------------------------------------

async def run_all_watchlist_signals(
    user_id: int,
    db: AsyncSession,
    strategies: Optional[list[str]] = None,
) -> list[Signal]:
    """
    Generate signals for every symbol in the user's watchlist.
    Runs symbols concurrently (up to MAX_CONCURRENT at a time).
    """
    result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.user_id == user_id)
    )
    watchlist_items = result.scalars().all()

    if not watchlist_items:
        return []

    MAX_CONCURRENT = 5
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    async def _generate_for_symbol(item: WatchlistItem) -> list[Signal]:
        async with semaphore:
            # persist=False — DB writes happen sequentially below to avoid
            # concurrent-flush errors on a shared async session.
            return await generate_signals(
                symbol=item.symbol,
                strategies=strategies,
                db=None,
                user_id=user_id,
                persist=False,
            )

    tasks = [_generate_for_symbol(item) for item in watchlist_items]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_signals: list[Signal] = []
    for r in results:
        if isinstance(r, list):
            all_signals.extend(r)
        elif isinstance(r, Exception):
            logger.warning("Signal generation error: %s", r)

    # Persist all signals once, serially, on the single shared session.
    if all_signals:
        for signal in all_signals:
            signal.user_id = user_id
            db.add(signal)
        try:
            await db.flush()
        except Exception as e:
            logger.error("Failed to persist watchlist signals: %s", e)
            await db.rollback()

    return all_signals


# ---------------------------------------------------------------------------
# Seed strategy data
# ---------------------------------------------------------------------------

STRATEGY_SEEDS = [
    {
        "name": "ensemble",
        "display_name": "AI Ensemble (Confluence)",
        "description": (
            "The flagship high-conviction strategy. Runs all other strategies and only "
            "fires when at least two agree on the same direction, with confidence scaled "
            "by the number of confirming strategies. Surfaces the best available trades "
            "while filtering out weak single-indicator noise."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "default_stop_loss_pct": 3.0,
        "default_take_profit_pct": 7.0,
        "parameters": {"min_agreement": 2, "confluence_bonus": 6.0},
    },
    {
        "name": "golden_cross",
        "display_name": "Golden Cross / Death Cross",
        "description": (
            "Identifies trend changes using the 50-day and 200-day Simple Moving Average "
            "crossover. A Golden Cross (SMA50 > SMA200) signals a bullish regime; a "
            "Death Cross (SMA50 < SMA200) signals a bearish regime."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "default_stop_loss_pct": 3.0,
        "default_take_profit_pct": 8.0,
        "parameters": {"fast_period": 50, "slow_period": 200},
    },
    {
        "name": "rsi_reversal",
        "display_name": "RSI Mean Reversion",
        "description": (
            "Uses the 14-period Relative Strength Index to identify overbought and oversold "
            "conditions. Buy when RSI recovers from below 30; sell when RSI rolls from above 70."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "default_stop_loss_pct": 2.0,
        "default_take_profit_pct": 4.0,
        "parameters": {"rsi_period": 14, "oversold": 30, "overbought": 70},
    },
    {
        "name": "momentum",
        "display_name": "ROC Momentum",
        "description": (
            "Measures price momentum using the 20-day Rate of Change (ROC). Generates buy "
            "signals when momentum is strongly positive (ROC > +5%) and sell signals when "
            "strongly negative (ROC < -5%)."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "default_stop_loss_pct": 2.5,
        "default_take_profit_pct": 6.0,
        "parameters": {"roc_period": 20, "buy_threshold": 5.0, "sell_threshold": -5.0},
    },
    {
        "name": "macd_crossover",
        "display_name": "MACD Signal Crossover",
        "description": (
            "Identifies momentum shifts using MACD (12, 26, 9). Generates buy signals when "
            "the MACD line crosses above its signal line and sell signals on a downside cross."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "default_stop_loss_pct": 2.0,
        "default_take_profit_pct": 5.0,
        "parameters": {"fast": 12, "slow": 26, "signal": 9},
    },
    {
        "name": "bollinger_bands",
        "display_name": "Bollinger Band Mean Reversion",
        "description": (
            "Generates buy signals when price closes below the lower Bollinger Band "
            "(20-period, 2σ) and sell signals above the upper band, betting on reversion."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "default_stop_loss_pct": 2.0,
        "default_take_profit_pct": 4.0,
        "parameters": {"bb_period": 20, "bb_std": 2.0},
    },
    {
        "name": "volume_spike",
        "display_name": "Volume Spike",
        "description": (
            "Detects unusual volume (≥2× 20-day average) combined with a significant price "
            "move. High volume + rising price → BUY (accumulation); high volume + falling → SELL."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "default_stop_loss_pct": 2.5,
        "default_take_profit_pct": 5.0,
        "parameters": {"volume_multiplier": 2.0, "volume_period": 20, "price_threshold_pct": 1.0},
    },
    {
        "name": "ml_classifier",
        "display_name": "ML Random Forest Classifier",
        "description": (
            "A Random Forest model trained on 8 technical indicators to predict whether price "
            "will rise >2%, fall >2%, or stay flat over the next 5 days."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "default_stop_loss_pct": 2.5,
        "default_take_profit_pct": 5.0,
        "parameters": {
            "n_estimators": 100,
            "forward_days": 5,
            "buy_threshold": 2.0,
            "sell_threshold": -2.0,
        },
    },
]


async def seed_strategies(db: AsyncSession) -> None:
    """Insert default strategies if they don't exist. Called on startup."""
    from app.models.strategy import Strategy
    from sqlalchemy import select

    for seed in STRATEGY_SEEDS:
        result = await db.execute(
            select(Strategy).where(Strategy.name == seed["name"])
        )
        existing = result.scalar_one_or_none()
        if existing is None:
            strategy = Strategy(
                name=seed["name"],
                display_name=seed["display_name"],
                description=seed["description"],
                asset_classes=seed["asset_classes"],
                is_enabled=True,
                default_stop_loss_pct=seed["default_stop_loss_pct"],
                default_take_profit_pct=seed["default_take_profit_pct"],
                parameters=seed["parameters"],
            )
            db.add(strategy)
    await db.commit()
    logger.info("Strategies seeded successfully.")
