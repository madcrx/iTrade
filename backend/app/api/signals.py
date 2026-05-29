from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.signal import Signal
from app.models.watchlist import WatchlistItem
from app.models.strategy import Strategy
from app.schemas.signal import SignalResponse, SignalGenerateRequest, SignalMarkActed
from app.services.signal_engine import generate_signals, run_all_watchlist_signals

router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("/stats/dashboard")
async def dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Summary counters for the dashboard header."""
    today = datetime.now(timezone.utc).date()

    signals_today = await db.scalar(
        select(func.count(Signal.id)).where(
            Signal.user_id == current_user.id,
            func.date(Signal.created_at) == today,
        )
    )
    active_signals = await db.scalar(
        select(func.count(Signal.id)).where(
            Signal.user_id == current_user.id,
            Signal.acted_on.is_(False),
        )
    )
    watchlist_count = await db.scalar(
        select(func.count(WatchlistItem.id)).where(
            WatchlistItem.user_id == current_user.id
        )
    )
    active_strategies = await db.scalar(
        select(func.count(Strategy.id)).where(Strategy.is_enabled.is_(True))
    )

    return {
        "signals_today": signals_today or 0,
        "active_signals": active_signals or 0,
        "watchlist_count": watchlist_count or 0,
        "active_strategies": active_strategies or 0,
        "paper_value": 0.0,
        "paper_pnl": 0.0,
        "paper_pnl_pct": 0.0,
    }


@router.get("", response_model=list[SignalResponse])
async def list_signals(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List recent signals for the current user's watchlist (most recent first)."""
    result = await db.execute(
        select(Signal)
        .where(Signal.user_id == current_user.id)
        .order_by(desc(Signal.created_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/history", response_model=list[SignalResponse])
async def signal_history(
    symbol: Optional[str] = Query(None),
    strategy: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full signal history with optional filters."""
    query = select(Signal).where(Signal.user_id == current_user.id)
    if symbol:
        query = query.where(Signal.symbol == symbol.upper())
    if strategy:
        query = query.where(Signal.strategy == strategy)
    if action:
        query = query.where(Signal.action == action.upper())
    query = query.order_by(desc(Signal.created_at)).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{symbol}", response_model=list[SignalResponse])
async def signals_for_symbol(
    symbol: str,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the most recent signals for a specific symbol."""
    result = await db.execute(
        select(Signal)
        .where(Signal.user_id == current_user.id, Signal.symbol == symbol.upper())
        .order_by(desc(Signal.created_at))
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/generate", response_model=list[SignalResponse])
async def generate(
    request: SignalGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger on-demand signal generation for the given symbols.
    Pass strategies=null to run all enabled strategies.
    """
    if not request.symbols:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one symbol must be provided.",
        )

    all_signals: list[Signal] = []
    for symbol in request.symbols:
        signals = await generate_signals(
            symbol=symbol.upper(),
            strategies=request.strategies,
            db=db,
            user_id=current_user.id,
        )
        all_signals.extend(signals)

    return all_signals


@router.post("/generate/watchlist", response_model=list[SignalResponse])
async def generate_for_watchlist(
    strategies: Optional[list[str]] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate signals for every symbol on the user's watchlist."""
    signals = await run_all_watchlist_signals(
        user_id=current_user.id,
        db=db,
        strategies=strategies,
    )
    return signals


@router.patch("/{signal_id}/acted", response_model=SignalResponse)
async def mark_signal_acted(
    signal_id: int,
    body: SignalMarkActed,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a signal as acted on (or un-acted)."""
    result = await db.execute(
        select(Signal).where(
            Signal.id == signal_id,
            Signal.user_id == current_user.id,
        )
    )
    signal = result.scalar_one_or_none()
    if signal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signal not found.")
    signal.acted_on = body.acted_on
    await db.flush()
    await db.refresh(signal)
    return signal
