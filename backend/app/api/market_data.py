from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.market_data import get_quote, get_history, search_symbols
from app.services.sentiment import get_news_sentiment

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/quote/{symbol}")
async def quote(
    symbol: str,
    _: User = Depends(get_current_user),
):
    """Get the current quote for a symbol (price, change, volume, etc.)."""
    try:
        return await get_quote(symbol.upper())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/history/{symbol}")
async def history(
    symbol: str,
    period: str = Query("1y", description="Period: 1d 5d 1mo 3mo 6mo 1y 2y 5y"),
    interval: str = Query("1d", description="Interval: 1m 5m 15m 1h 1d 1wk 1mo"),
    _: User = Depends(get_current_user),
):
    """
    Get historical OHLCV data for a symbol.

    Returns a list of candle objects sorted oldest to newest.
    """
    try:
        df = await get_history(symbol.upper(), period=period, interval=interval)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    if df is None or df.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No historical data available for {symbol}.",
        )

    candles = []
    for ts, row in df.iterrows():
        candles.append({
            "date": str(ts)[:10],
            "open": round(float(row["Open"]), 4),
            "high": round(float(row["High"]), 4),
            "low": round(float(row["Low"]), 4),
            "close": round(float(row["Close"]), 4),
            "volume": int(row["Volume"]),
        })
    return {"symbol": symbol.upper(), "period": period, "interval": interval, "candles": candles}


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    _: User = Depends(get_current_user),
):
    """Search for stocks and crypto by symbol or company name."""
    results = await search_symbols(q)
    return {"query": q, "results": results}


@router.get("/sentiment/{symbol}")
async def sentiment(
    symbol: str,
    _: User = Depends(get_current_user),
):
    """Get news sentiment for a symbol using Finnhub data."""
    return await get_news_sentiment(symbol.upper())
