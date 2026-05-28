"""
Market data service.

Primary source  : yfinance
Fallback source : Alpha Vantage (when ALPHA_VANTAGE_API_KEY is set)
Caching         : in-memory dict with TTL (QUOTE_CACHE_TTL / HISTORY_CACHE_TTL)
"""

import asyncio
import time
import re
from typing import Optional
from datetime import datetime

import httpx
import pandas as pd
import yfinance as yf

from app.core.config import settings

# ---------------------------------------------------------------------------
# Simple in-memory TTL cache
# ---------------------------------------------------------------------------

class _TTLCache:
    def __init__(self):
        self._store: dict[str, tuple[float, object]] = {}

    def get(self, key: str) -> Optional[object]:
        if key not in self._store:
            return None
        expires_at, value = self._store[key]
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: object, ttl: int):
        self._store[key] = (time.monotonic() + ttl, value)

    def invalidate(self, key: str):
        self._store.pop(key, None)


_cache = _TTLCache()

# ---------------------------------------------------------------------------
# Asset type detection
# ---------------------------------------------------------------------------

CRYPTO_SYMBOLS = {
    "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "DOT",
    "MATIC", "AVAX", "LTC", "LINK", "UNI", "ATOM", "XLM",
}

CRYPTO_SUFFIXES = {"-USD", "-USDT", "USDT", "-AUD"}


def get_asset_type(symbol: str) -> str:
    """
    Returns one of: 'asx', 'crypto', 'stock'.

    ASX  : symbol ends with .AX
    Crypto: symbol (stripped of suffix) is in CRYPTO_SYMBOLS, or matches
            a known crypto suffix pattern.
    Stock: everything else (US equities, etc.)
    """
    upper = symbol.upper()

    if upper.endswith(".AX"):
        return "asx"

    base = re.sub(r"[-/]?(USD|USDT|AUD|EUR|BTC)$", "", upper)
    if base in CRYPTO_SYMBOLS:
        return "crypto"
    for suffix in CRYPTO_SUFFIXES:
        if upper.endswith(suffix.upper()):
            return "crypto"

    return "stock"


# ---------------------------------------------------------------------------
# Quote — current price
# ---------------------------------------------------------------------------

async def get_quote(symbol: str) -> dict:
    """
    Return a dict with: symbol, name, price, change, change_pct, volume,
    market_cap, asset_type, currency, timestamp.
    """
    cache_key = f"quote:{symbol}"
    cached = _cache.get(cache_key)
    if cached:
        return cached

    result = await _fetch_quote_yfinance(symbol)
    if result is None:
        result = await _fetch_quote_alpha_vantage(symbol)
    if result is None:
        raise ValueError(f"Could not fetch quote for {symbol}")

    _cache.set(cache_key, result, settings.QUOTE_CACHE_TTL)
    return result


async def _fetch_quote_yfinance(symbol: str) -> Optional[dict]:
    loop = asyncio.get_event_loop()
    try:
        ticker = await loop.run_in_executor(None, lambda: yf.Ticker(symbol))
        info = await loop.run_in_executor(None, lambda: ticker.fast_info)
        hist = await loop.run_in_executor(
            None, lambda: ticker.history(period="2d", interval="1d")
        )
        if hist is None or len(hist) == 0:
            return None

        price = float(hist["Close"].iloc[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else price
        change = price - prev_close
        change_pct = (change / prev_close * 100) if prev_close else 0.0
        volume = int(hist["Volume"].iloc[-1])

        symbol_info = {}
        try:
            full_info = await loop.run_in_executor(None, lambda: ticker.info)
            symbol_info = full_info or {}
        except Exception:
            pass

        return {
            "symbol": symbol,
            "name": symbol_info.get("longName") or symbol_info.get("shortName") or symbol,
            "price": round(price, 4),
            "change": round(change, 4),
            "change_pct": round(change_pct, 4),
            "volume": volume,
            "market_cap": symbol_info.get("marketCap"),
            "asset_type": get_asset_type(symbol),
            "currency": symbol_info.get("currency", "USD"),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception:
        return None


async def _fetch_quote_alpha_vantage(symbol: str) -> Optional[dict]:
    if not settings.ALPHA_VANTAGE_API_KEY:
        return None
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": settings.ALPHA_VANTAGE_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            data = resp.json()
        quote = data.get("Global Quote", {})
        if not quote:
            return None
        price = float(quote.get("05. price", 0))
        change = float(quote.get("09. change", 0))
        change_pct_str = quote.get("10. change percent", "0%").replace("%", "")
        change_pct = float(change_pct_str)
        volume = int(quote.get("06. volume", 0))
        return {
            "symbol": symbol,
            "name": symbol,
            "price": round(price, 4),
            "change": round(change, 4),
            "change_pct": round(change_pct, 4),
            "volume": volume,
            "market_cap": None,
            "asset_type": get_asset_type(symbol),
            "currency": "USD",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Historical OHLCV
# ---------------------------------------------------------------------------

VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}
VALID_INTERVALS = {
    "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h",
    "1d", "5d", "1wk", "1mo", "3mo",
}


async def get_history(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
) -> pd.DataFrame:
    """
    Return an OHLCV DataFrame with DatetimeIndex.
    Columns: Open, High, Low, Close, Volume
    """
    if period not in VALID_PERIODS:
        period = "1y"
    if interval not in VALID_INTERVALS:
        interval = "1d"

    cache_key = f"history:{symbol}:{period}:{interval}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    df = await _fetch_history_yfinance(symbol, period, interval)
    if df is None or df.empty:
        df = await _fetch_history_alpha_vantage(symbol, period, interval)
    if df is None or df.empty:
        raise ValueError(f"Could not fetch history for {symbol}")

    _cache.set(cache_key, df, settings.HISTORY_CACHE_TTL)
    return df


async def _fetch_history_yfinance(
    symbol: str, period: str, interval: str
) -> Optional[pd.DataFrame]:
    loop = asyncio.get_event_loop()
    try:
        ticker = await loop.run_in_executor(None, lambda: yf.Ticker(symbol))
        df = await loop.run_in_executor(
            None,
            lambda: ticker.history(period=period, interval=interval, auto_adjust=True),
        )
        if df is None or df.empty:
            return None
        # Ensure standard column names
        df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.index = pd.DatetimeIndex(df.index).tz_localize(None)
        return df
    except Exception:
        return None


async def _fetch_history_alpha_vantage(
    symbol: str, period: str, interval: str
) -> Optional[pd.DataFrame]:
    if not settings.ALPHA_VANTAGE_API_KEY:
        return None

    # Map to AV function
    if interval in {"1d", "5d"}:
        function = "TIME_SERIES_DAILY_ADJUSTED"
        time_key = "Time Series (Daily)"
        output_size = "full" if period in {"2y", "5y", "10y", "max"} else "compact"
        params = {
            "function": function,
            "symbol": symbol,
            "outputsize": output_size,
            "apikey": settings.ALPHA_VANTAGE_API_KEY,
        }
    else:
        return None  # AV intraday not supported here

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get("https://www.alphavantage.co/query", params=params)
            data = resp.json()

        ts_data = data.get(time_key, {})
        if not ts_data:
            return None

        records = []
        for date_str, vals in ts_data.items():
            records.append({
                "Date": pd.to_datetime(date_str),
                "Open": float(vals.get("1. open", 0)),
                "High": float(vals.get("2. high", 0)),
                "Low": float(vals.get("3. low", 0)),
                "Close": float(vals.get("5. adjusted close", vals.get("4. close", 0))),
                "Volume": int(vals.get("6. volume", 0)),
            })

        df = pd.DataFrame(records).set_index("Date").sort_index()
        return df
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Symbol search
# ---------------------------------------------------------------------------

async def search_symbols(query: str) -> list[dict]:
    """Search for stocks/crypto by name or ticker. Returns list of matches."""
    cache_key = f"search:{query.lower()}"
    cached = _cache.get(cache_key)
    if cached:
        return cached

    results = []

    # Try yfinance search
    yf_results = await _search_yfinance(query)
    results.extend(yf_results)

    # Try AV if we have key and need more results
    if len(results) < 5 and settings.ALPHA_VANTAGE_API_KEY:
        av_results = await _search_alpha_vantage(query)
        seen_symbols = {r["symbol"] for r in results}
        for r in av_results:
            if r["symbol"] not in seen_symbols:
                results.append(r)
                seen_symbols.add(r["symbol"])

    _cache.set(cache_key, results, settings.QUOTE_CACHE_TTL)
    return results[:20]


async def _search_yfinance(query: str) -> list[dict]:
    loop = asyncio.get_event_loop()
    try:
        # yfinance has a search function in newer versions
        results = await loop.run_in_executor(None, lambda: yf.Search(query))
        quotes = getattr(results, "quotes", [])
        output = []
        for q in quotes:
            if isinstance(q, dict):
                output.append({
                    "symbol": q.get("symbol", ""),
                    "name": q.get("longname") or q.get("shortname") or q.get("symbol", ""),
                    "exchange": q.get("exchange", ""),
                    "asset_type": get_asset_type(q.get("symbol", "")),
                    "type": q.get("quoteType", "EQUITY"),
                })
        return output
    except Exception:
        return []


async def _search_alpha_vantage(query: str) -> list[dict]:
    if not settings.ALPHA_VANTAGE_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://www.alphavantage.co/query",
                params={
                    "function": "SYMBOL_SEARCH",
                    "keywords": query,
                    "apikey": settings.ALPHA_VANTAGE_API_KEY,
                },
            )
            data = resp.json()
        matches = data.get("bestMatches", [])
        output = []
        for m in matches:
            symbol = m.get("1. symbol", "")
            output.append({
                "symbol": symbol,
                "name": m.get("2. name", symbol),
                "exchange": m.get("4. region", ""),
                "asset_type": get_asset_type(symbol),
                "type": m.get("3. type", "Equity"),
            })
        return output
    except Exception:
        return []
