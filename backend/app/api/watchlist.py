import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.watchlist import WatchlistItem
from app.models.signal import Signal
from app.schemas.watchlist import WatchlistItemCreate
from app.services.market_data import get_asset_type, get_quote

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


ASSET_CLASS_MAP = {"asx": "ASX_STOCK", "crypto": "CRYPTO", "stock": "US_STOCK", "etf": "ETF"}


class StrategiesUpdate(BaseModel):
    enabled_strategies: list[str]


async def _enrich(item: WatchlistItem, active_count: int) -> dict:
    price = 0.0
    change = 0.0
    change_pct = 0.0
    name = item.display_name or item.symbol
    try:
        quote = await get_quote(item.symbol)
        price = float(quote.get("price") or 0)
        change = float(quote.get("change") or 0)
        change_pct = float(quote.get("change_pct") or 0)
        if quote.get("name"):
            name = quote["name"]
    except Exception as e:
        logger.debug("Quote failed for %s: %s", item.symbol, e)

    return {
        "id": item.id,
        "symbol": item.symbol,
        "asset_name": name,
        "asset_class": ASSET_CLASS_MAP.get(item.asset_type, "US_STOCK"),
        "current_price": price,
        "daily_change": change,
        "daily_change_pct": change_pct,
        "active_signals": active_count,
        "enabled_strategies": item.enabled_strategies or [],
        "added_at": item.added_at.isoformat() if item.added_at else "",
    }


@router.get("")
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all watchlist items enriched with live quotes and active-signal counts."""
    result = await db.execute(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.added_at.desc())
    )
    items = result.scalars().all()
    if not items:
        return []

    # Count active (last 24h) signals per symbol in one query
    cutoff = datetime.utcnow() - timedelta(hours=24)
    counts_result = await db.execute(
        select(Signal.symbol, func.count(Signal.id))
        .where(
            Signal.user_id == current_user.id,
            Signal.created_at >= cutoff,
        )
        .group_by(Signal.symbol)
    )
    counts = {sym: n for sym, n in counts_result.all()}

    enriched = await asyncio.gather(
        *[_enrich(item, counts.get(item.symbol, 0)) for item in items]
    )
    return enriched


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    item_data: WatchlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = item_data.symbol.upper().strip()

    result = await db.execute(
        select(WatchlistItem).where(
            and_(
                WatchlistItem.user_id == current_user.id,
                WatchlistItem.symbol == symbol,
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{symbol} is already on your watchlist.",
        )

    asset_type = get_asset_type(symbol)
    item = WatchlistItem(
        user_id=current_user.id,
        symbol=symbol,
        asset_type=asset_type,
        display_name=item_data.display_name,
        enabled_strategies=[],
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return await _enrich(item, 0)


@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = symbol.upper()
    result = await db.execute(
        select(WatchlistItem).where(
            and_(
                WatchlistItem.user_id == current_user.id,
                WatchlistItem.symbol == symbol,
            )
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{symbol} is not on your watchlist.",
        )
    await db.delete(item)


@router.patch("/{symbol}/strategies")
async def update_strategies(
    symbol: str,
    payload: StrategiesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = symbol.upper()
    result = await db.execute(
        select(WatchlistItem).where(
            and_(
                WatchlistItem.user_id == current_user.id,
                WatchlistItem.symbol == symbol,
            )
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{symbol} is not on your watchlist.",
        )
    item.enabled_strategies = payload.enabled_strategies
    await db.flush()
    await db.refresh(item)
    return await _enrich(item, 0)
