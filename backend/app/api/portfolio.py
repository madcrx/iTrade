"""
Portfolio API — manual trade log + P&L performance analytics.

iTrade is a signals-only tool; this module lets users log trades they
placed manually (in their own broker apps) so they can track performance
against the signals.
"""

from __future__ import annotations

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.portfolio import PortfolioTrade
from app.schemas.portfolio import (
    PortfolioTradeCreate,
    PortfolioTradeResponse,
    PortfolioPerformance,
)
from app.services.market_data import get_quote

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.get("", response_model=list[PortfolioTradeResponse])
async def get_portfolio(
    symbol: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the user's manually logged trades."""
    query = select(PortfolioTrade).where(PortfolioTrade.user_id == current_user.id)
    if symbol:
        query = query.where(PortfolioTrade.symbol == symbol.upper())
    if action:
        query = query.where(PortfolioTrade.action == action.upper())
    query = query.order_by(desc(PortfolioTrade.trade_date)).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/trade", response_model=PortfolioTradeResponse, status_code=status.HTTP_201_CREATED)
async def log_trade(
    trade_data: PortfolioTradeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log a manually placed trade."""
    if trade_data.action.upper() not in {"BUY", "SELL"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="action must be BUY or SELL.",
        )
    trade = PortfolioTrade(
        user_id=current_user.id,
        symbol=trade_data.symbol.upper(),
        action=trade_data.action.upper(),
        price=trade_data.price,
        quantity=trade_data.quantity,
        trade_date=trade_data.trade_date,
        signal_id=trade_data.signal_id,
        notes=trade_data.notes,
        broker=trade_data.broker,
    )
    db.add(trade)
    await db.flush()
    await db.refresh(trade)
    return trade


@router.get("/trade/{trade_id}", response_model=PortfolioTradeResponse)
async def get_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PortfolioTrade).where(
            PortfolioTrade.id == trade_id,
            PortfolioTrade.user_id == current_user.id,
        )
    )
    trade = result.scalar_one_or_none()
    if trade is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found.")
    return trade


@router.delete("/trade/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a logged trade."""
    result = await db.execute(
        select(PortfolioTrade).where(
            PortfolioTrade.id == trade_id,
            PortfolioTrade.user_id == current_user.id,
        )
    )
    trade = result.scalar_one_or_none()
    if trade is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found.")
    await db.delete(trade)


# ---------------------------------------------------------------------------
# Performance analytics
# ---------------------------------------------------------------------------

@router.get("/performance", response_model=PortfolioPerformance)
async def get_performance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Calculate portfolio P&L, win rate, and open/closed positions.

    Open positions  : BUY trades not yet matched to a SELL.
    Closed positions: matched BUY/SELL pairs.
    """
    result = await db.execute(
        select(PortfolioTrade)
        .where(PortfolioTrade.user_id == current_user.id)
        .order_by(PortfolioTrade.trade_date)
    )
    trades = result.scalars().all()

    if not trades:
        return PortfolioPerformance(
            total_invested=0.0,
            current_value=0.0,
            total_return_pct=0.0,
            total_pnl=0.0,
            win_rate=0.0,
            total_trades=0,
            open_positions=[],
            closed_positions=[],
        )

    # Group trades by symbol
    positions: dict[str, list[PortfolioTrade]] = {}
    for trade in trades:
        positions.setdefault(trade.symbol, []).append(trade)

    open_positions: list[dict] = []
    closed_positions: list[dict] = []
    total_invested = 0.0
    total_current = 0.0
    wins = 0
    losses = 0

    for symbol, sym_trades in positions.items():
        buy_queue: list[PortfolioTrade] = []
        for trade in sym_trades:
            if trade.action == "BUY":
                buy_queue.append(trade)
                total_invested += trade.price * trade.quantity
            elif trade.action == "SELL" and buy_queue:
                buy_trade = buy_queue.pop(0)  # FIFO matching
                cost = buy_trade.price * buy_trade.quantity
                proceeds = trade.price * min(trade.quantity, buy_trade.quantity)
                pnl = proceeds - cost
                ret_pct = pnl / cost * 100 if cost else 0.0
                closed_positions.append({
                    "symbol": symbol,
                    "buy_price": buy_trade.price,
                    "sell_price": trade.price,
                    "quantity": buy_trade.quantity,
                    "pnl": round(pnl, 2),
                    "return_pct": round(ret_pct, 2),
                    "buy_date": buy_trade.trade_date.isoformat(),
                    "sell_date": trade.trade_date.isoformat(),
                })
                if pnl > 0:
                    wins += 1
                else:
                    losses += 1

        # Remaining buys are open
        for open_buy in buy_queue:
            open_positions.append({
                "symbol": symbol,
                "buy_price": open_buy.price,
                "quantity": open_buy.quantity,
                "cost_basis": round(open_buy.price * open_buy.quantity, 2),
                "buy_date": open_buy.trade_date.isoformat(),
                "current_price": None,  # populated below
                "unrealised_pnl": None,
                "unrealised_pct": None,
            })

    # Fetch current prices for open positions (best effort)
    for pos in open_positions:
        try:
            quote = await get_quote(pos["symbol"])
            current_price = quote["price"]
            pos["current_price"] = current_price
            cost = pos["buy_price"] * pos["quantity"]
            current_val = current_price * pos["quantity"]
            total_current += current_val
            pnl = current_val - cost
            pos["unrealised_pnl"] = round(pnl, 2)
            pos["unrealised_pct"] = round(pnl / cost * 100, 2) if cost else 0.0
        except Exception:
            total_current += pos["cost_basis"]

    total_trades = len(closed_positions)
    win_rate = wins / total_trades * 100 if total_trades > 0 else 0.0
    closed_pnl = sum(p["pnl"] for p in closed_positions)
    open_pnl = sum(p.get("unrealised_pnl") or 0 for p in open_positions)
    total_pnl = closed_pnl + open_pnl
    return_pct = total_pnl / total_invested * 100 if total_invested > 0 else 0.0

    return PortfolioPerformance(
        total_invested=round(total_invested, 2),
        current_value=round(total_invested + total_pnl, 2),
        total_return_pct=round(return_pct, 2),
        total_pnl=round(total_pnl, 2),
        win_rate=round(win_rate, 1),
        total_trades=total_trades,
        open_positions=open_positions,
        closed_positions=closed_positions,
    )
