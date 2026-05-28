"""
Backtester service.

Runs any registered strategy over historical OHLCV data and returns a
structured BacktestResult dict suitable for storage/API responses.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.services.market_data import get_history
from app.strategies import STRATEGY_MAP
from app.strategies.base import BacktestResult

logger = logging.getLogger(__name__)


async def run_backtest(
    symbol: str,
    strategy_name: str,
    period: str = "1y",
) -> dict:
    """
    Fetch historical data and run the strategy's backtest method.

    Returns a dict version of BacktestResult (suitable for JSON / DB storage).
    Raises ValueError if strategy is unknown or data cannot be fetched.
    """
    if strategy_name not in STRATEGY_MAP:
        raise ValueError(
            f"Unknown strategy '{strategy_name}'. "
            f"Available: {list(STRATEGY_MAP.keys())}"
        )

    strategy = STRATEGY_MAP[strategy_name]

    # Normalise period: map short codes to yfinance-compatible strings
    period_map = {
        "1mo": "1mo",
        "3mo": "3mo",
        "6mo": "6mo",
        "1y": "1y",
        "2y": "2y",
        "5y": "5y",
        "10y": "10y",
    }
    yf_period = period_map.get(period, "1y")

    df = await get_history(symbol, period=yf_period, interval="1d")
    if df is None or df.empty:
        raise ValueError(f"No historical data available for {symbol}")

    try:
        result: BacktestResult = strategy.backtest(df)
    except Exception as e:
        logger.error("Backtest error for %s/%s: %s", symbol, strategy_name, e)
        raise ValueError(f"Backtest failed: {e}") from e

    return _result_to_dict(result, symbol, strategy_name, period)


def _result_to_dict(
    result: BacktestResult,
    symbol: str,
    strategy: str,
    period: str,
) -> dict:
    """Serialise BacktestResult to a plain dict for JSON/DB storage."""
    trades_serialised = []
    for t in result.trades:
        trades_serialised.append({
            "entry_date": str(t.get("entry_date", ""))[:10],
            "exit_date": str(t.get("exit_date", ""))[:10],
            "entry_price": round(float(t.get("entry_price", 0)), 4),
            "exit_price": round(float(t.get("exit_price", 0)), 4),
            "return_pct": round(float(t.get("return_pct", 0)), 4),
            "duration_days": int(t.get("duration_days", 0)),
        })

    return {
        "symbol": symbol,
        "strategy": strategy,
        "period": period,
        "total_return_pct": result.total_return_pct,
        "sharpe_ratio": result.sharpe_ratio,
        "max_drawdown_pct": result.max_drawdown_pct,
        "win_rate": result.win_rate,
        "total_trades": result.total_trades,
        "avg_trade_duration_days": result.avg_trade_duration_days,
        "equity_curve": result.equity_curve,
        "trades": trades_serialised,
    }
