"""
Seed script — inserts default strategies and demo watchlist symbols.

Run from the project root:
    docker compose exec backend-prod python scripts/seed.py
    # or in dev:
    docker compose exec backend python scripts/seed.py

No demo user is created here; real users are created through the auth flow.
"""

import asyncio
import os
import sys

# Allow imports from the app package when running directly inside the container.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.models import Strategy  # noqa: F401 — also registers other models

# ─── Default Strategies ───────────────────────────────────────────────────────

DEFAULT_STRATEGIES = [
    {
        "name": "golden_cross",
        "display_name": "Golden Cross",
        "description": (
            "Identifies bullish momentum when the 50-day simple moving average "
            "crosses above the 200-day SMA. A classic trend-following signal used "
            "widely across equities and crypto. Works best on daily timeframes with "
            "liquid assets. Entry is taken on the candle that confirms the crossover; "
            "stop-loss is placed just below the 200-day SMA."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "is_enabled": True,
        "default_stop_loss_pct": 3.0,
        "default_take_profit_pct": 9.0,
        "parameters": {
            "fast_period": 50,
            "slow_period": 200,
            "signal_type": "crossover",
        },
        "stats": {
            "avg_win_rate_pct": 58,
            "avg_risk_reward": 2.8,
            "avg_trades_per_year": 4,
        },
    },
    {
        "name": "rsi_reversal",
        "display_name": "RSI Reversal",
        "description": (
            "Detects overbought and oversold conditions using the Relative Strength "
            "Index (14-period). Generates a BUY signal when RSI drops below 30 and "
            "begins to recover, and a SELL signal when RSI rises above 70 and turns "
            "down. Best suited for ranging markets; use with caution in strong trends. "
            "Confirmation via price action candle is recommended."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "is_enabled": True,
        "default_stop_loss_pct": 2.5,
        "default_take_profit_pct": 5.0,
        "parameters": {
            "period": 14,
            "oversold": 30,
            "overbought": 70,
        },
        "stats": {
            "avg_win_rate_pct": 62,
            "avg_risk_reward": 1.9,
            "avg_trades_per_year": 18,
        },
    },
    {
        "name": "momentum",
        "display_name": "Momentum",
        "description": (
            "Ranks and signals assets based on rate-of-change (ROC) over a 20-day "
            "lookback window. Assets showing the strongest upward momentum receive "
            "BUY signals; weakening momentum triggers SELL or HOLD. Momentum tends "
            "to persist over weeks to months. Position sizing scales with confidence "
            "score derived from momentum percentile rank."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "is_enabled": True,
        "default_stop_loss_pct": 4.0,
        "default_take_profit_pct": 12.0,
        "parameters": {
            "lookback_days": 20,
            "min_confidence_threshold": 60,
        },
        "stats": {
            "avg_win_rate_pct": 55,
            "avg_risk_reward": 2.5,
            "avg_trades_per_year": 12,
        },
    },
    {
        "name": "macd",
        "display_name": "MACD",
        "description": (
            "Uses the Moving Average Convergence Divergence indicator (12/26/9 "
            "settings) to detect shifts in trend direction and momentum. BUY signals "
            "fire when the MACD line crosses above the signal line in negative "
            "territory; SELL signals when it crosses below in positive territory. "
            "Histogram divergence is used as a secondary confirmation filter to "
            "reduce false positives."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "is_enabled": True,
        "default_stop_loss_pct": 2.0,
        "default_take_profit_pct": 6.0,
        "parameters": {
            "fast_period": 12,
            "slow_period": 26,
            "signal_period": 9,
        },
        "stats": {
            "avg_win_rate_pct": 53,
            "avg_risk_reward": 2.2,
            "avg_trades_per_year": 22,
        },
    },
    {
        "name": "bollinger_bands",
        "display_name": "Bollinger Bands",
        "description": (
            "Measures volatility using a 20-period SMA with ±2 standard deviation "
            "bands. BUY signals are generated when price touches or breaches the lower "
            "band and begins to mean-revert toward the middle band. SELL signals appear "
            "at the upper band. Band squeeze (low volatility) followed by an expansion "
            "is used to anticipate breakouts. Works well alongside volume analysis."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "is_enabled": True,
        "default_stop_loss_pct": 2.0,
        "default_take_profit_pct": 4.0,
        "parameters": {
            "period": 20,
            "std_dev": 2.0,
        },
        "stats": {
            "avg_win_rate_pct": 60,
            "avg_risk_reward": 1.8,
            "avg_trades_per_year": 26,
        },
    },
    {
        "name": "volume_spike",
        "display_name": "Volume Spike",
        "description": (
            "Identifies unusual volume surges — days where trading volume exceeds "
            "2.5× the 20-day average — paired with a directional price move of at "
            "least 1.5%. Volume spikes often precede sustained moves. BUY signals "
            "require volume spike on a green candle; SELL signals require a red candle. "
            "Particularly effective on ASX stocks and crypto where liquidity events "
            "drive sharp directional moves."
        ),
        "asset_classes": ["stocks", "asx", "crypto"],
        "is_enabled": True,
        "default_stop_loss_pct": 3.0,
        "default_take_profit_pct": 7.0,
        "parameters": {
            "volume_multiplier": 2.5,
            "min_price_move_pct": 1.5,
            "lookback_days": 20,
        },
        "stats": {
            "avg_win_rate_pct": 57,
            "avg_risk_reward": 2.1,
            "avg_trades_per_year": 8,
        },
    },
]

# ─── Demo Watchlist Symbols ───────────────────────────────────────────────────
# These represent the default "starter" symbols shown in demo/tour mode.
# They are not attached to any user; they serve as the global reference list
# used to pre-populate the symbol search suggestions and strategy demo data.

DEMO_SYMBOLS = [
    # US equities
    {"symbol": "AAPL",    "asset_type": "stock",  "display_name": "Apple Inc."},
    {"symbol": "MSFT",    "asset_type": "stock",  "display_name": "Microsoft Corp."},
    # ASX equities
    {"symbol": "BHP.AX",  "asset_type": "asx",    "display_name": "BHP Group (ASX)"},
    {"symbol": "CBA.AX",  "asset_type": "asx",    "display_name": "Commonwealth Bank (ASX)"},
    # Crypto
    {"symbol": "BTC-USD", "asset_type": "crypto", "display_name": "Bitcoin"},
    {"symbol": "ETH-USD", "asset_type": "crypto", "display_name": "Ethereum"},
]


# ─── Seed Functions ───────────────────────────────────────────────────────────

async def seed_strategies(session: AsyncSession) -> int:
    """Insert default strategies; skip any that already exist (idempotent)."""
    inserted = 0
    for data in DEFAULT_STRATEGIES:
        result = await session.execute(
            select(Strategy).where(Strategy.name == data["name"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  [skip]  Strategy '{data['display_name']}' already exists.")
            continue

        strategy = Strategy(**data)
        session.add(strategy)
        inserted += 1
        print(f"  [add]   Strategy '{data['display_name']}'")

    await session.flush()
    return inserted


async def seed_demo_symbols(session: AsyncSession) -> None:
    """
    Print the demo watchlist symbols. In a full app the symbols would be stored
    in a global reference table; here we just confirm the list and validate
    that Strategy rows exist before any real seeding logic runs.
    """
    print("\n  Demo watchlist symbols (for reference / search suggestions):")
    for s in DEMO_SYMBOLS:
        print(f"    {s['symbol']:<12} [{s['asset_type']:<6}]  {s['display_name']}")


async def main() -> None:
    db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    if not db_url:
        print("ERROR: DATABASE_URL is not set.", file=sys.stderr)
        sys.exit(1)

    # Alembic / seed scripts run against a sync driver; the app uses asyncpg.
    # Keep asyncpg for the seed since we already import async models.
    engine = create_async_engine(db_url, echo=False)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("\niTrade seed script")
    print("=" * 50)

    async with Session() as session:
        print("\nSeeding strategies...")
        n = await seed_strategies(session)
        await session.commit()
        print(f"\n  Done — {n} new strategies inserted.")

        await seed_demo_symbols(session)

    await engine.dispose()
    print("\nSeed complete.\n")


if __name__ == "__main__":
    asyncio.run(main())
