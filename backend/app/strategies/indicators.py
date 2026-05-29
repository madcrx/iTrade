"""
Lightweight technical-indicator functions.

Drop-in replacement for the subset of ``pandas_ta`` used by the strategy
engine. pandas-ta no longer ships an installable release for Python 3.11
(PyPI only serves 0.4.x betas that require Python >=3.12), so these pure
pandas/numpy implementations keep the platform dependency-free.

Each function mirrors the call signature, return type, and — for the
multi-column indicators (macd, bbands) — the exact column-naming scheme
that pandas_ta produces, so the existing strategy code works unchanged.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def sma(close: pd.Series, length: int = 20) -> pd.Series:
    """Simple moving average."""
    return close.rolling(window=length, min_periods=length).mean()


def rsi(close: pd.Series, length: int = 14) -> pd.Series:
    """Relative Strength Index using Wilder's smoothing (matches pandas_ta)."""
    delta = close.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)
    avg_gain = gain.ewm(alpha=1.0 / length, min_periods=length, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / length, min_periods=length, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100.0 - (100.0 / (1.0 + rs))


def roc(close: pd.Series, length: int = 10) -> pd.Series:
    """Rate of change as a percentage."""
    return (close.diff(length) / close.shift(length)) * 100.0


def atr(high: pd.Series, low: pd.Series, close: pd.Series, length: int = 14) -> pd.Series:
    """Average True Range using Wilder's smoothing (matches pandas_ta)."""
    prev_close = close.shift(1)
    true_range = pd.concat(
        [
            (high - low),
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return true_range.ewm(alpha=1.0 / length, min_periods=length, adjust=False).mean()


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    """
    Moving Average Convergence Divergence.

    Returns a DataFrame with the same columns pandas_ta produces:
    ``MACD_{fast}_{slow}_{signal}``, ``MACDh_...`` (histogram), ``MACDs_...`` (signal).
    """
    fast_ema = close.ewm(span=fast, adjust=False).mean()
    slow_ema = close.ewm(span=slow, adjust=False).mean()
    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line

    suffix = f"{fast}_{slow}_{signal}"
    return pd.DataFrame(
        {
            f"MACD_{suffix}": macd_line,
            f"MACDh_{suffix}": histogram,
            f"MACDs_{suffix}": signal_line,
        }
    )


def bbands(close: pd.Series, length: int = 20, std: float = 2.0) -> pd.DataFrame:
    """
    Bollinger Bands.

    Returns a DataFrame with the same columns pandas_ta produces:
    ``BBL_{length}_{std}`` (lower), ``BBM_...`` (middle/SMA), ``BBU_...`` (upper).
    """
    mid = close.rolling(window=length, min_periods=length).mean()
    deviation = close.rolling(window=length, min_periods=length).std(ddof=0)
    lower = mid - std * deviation
    upper = mid + std * deviation

    suffix = f"{length}_{std}"
    return pd.DataFrame(
        {
            f"BBL_{suffix}": lower,
            f"BBM_{suffix}": mid,
            f"BBU_{suffix}": upper,
        }
    )
