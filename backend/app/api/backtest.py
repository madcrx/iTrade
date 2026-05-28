from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.portfolio import BacktestResult
from app.schemas.portfolio import BacktestRequest, BacktestResultResponse
from app.services.backtester import run_backtest

router = APIRouter(prefix="/backtest", tags=["backtest"])


@router.post("", response_model=BacktestResultResponse, status_code=status.HTTP_201_CREATED)
async def run_backtest_endpoint(
    request: BacktestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Run a backtest for the given symbol + strategy + period.

    Returns performance metrics including total return, Sharpe ratio,
    max drawdown, win rate, and the full equity curve.
    """
    try:
        results = await run_backtest(
            symbol=request.symbol.upper(),
            strategy_name=request.strategy,
            period=request.period,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    bt_result = BacktestResult(
        user_id=current_user.id,
        symbol=request.symbol.upper(),
        strategy=request.strategy,
        period=request.period,
        results=results,
    )
    db.add(bt_result)
    await db.flush()
    await db.refresh(bt_result)
    return bt_result


@router.get("/results", response_model=list[BacktestResultResponse])
async def get_backtest_results(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all saved backtest results for the current user."""
    result = await db.execute(
        select(BacktestResult)
        .where(BacktestResult.user_id == current_user.id)
        .order_by(desc(BacktestResult.created_at))
    )
    return result.scalars().all()


@router.get("/results/{result_id}", response_model=BacktestResultResponse)
async def get_backtest_result(
    result_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific saved backtest result."""
    result = await db.execute(
        select(BacktestResult).where(
            BacktestResult.id == result_id,
            BacktestResult.user_id == current_user.id,
        )
    )
    bt_result = result.scalar_one_or_none()
    if bt_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backtest result not found.",
        )
    return bt_result
