from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.watchlist import WatchlistItem
from app.schemas.watchlist import WatchlistItemCreate, WatchlistItemResponse
from app.services.market_data import get_asset_type

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistItemResponse])
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all watchlist items for the current user."""
    result = await db.execute(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.added_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    item_data: WatchlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a symbol to the watchlist. Duplicate symbols are rejected."""
    symbol = item_data.symbol.upper().strip()

    # Reject duplicates
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
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a symbol from the watchlist."""
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
