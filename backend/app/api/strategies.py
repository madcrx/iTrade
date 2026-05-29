from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.strategy import Strategy

router = APIRouter(prefix="/strategies", tags=["strategies"])


class StrategyToggle(BaseModel):
    is_enabled: bool


class StrategyResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: str
    asset_classes: list[str]
    is_enabled: bool
    default_stop_loss_pct: float
    default_take_profit_pct: float
    parameters: Optional[dict] = None
    stats: Optional[dict] = None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[StrategyResponse])
async def list_strategies(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List all available strategies with their descriptions."""
    result = await db.execute(
        select(Strategy).order_by(Strategy.id)
    )
    return result.scalars().all()


@router.get("/{name}", response_model=StrategyResponse)
async def get_strategy(
    name: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get detail for a specific strategy by name."""
    result = await db.execute(
        select(Strategy).where(Strategy.name == name)
    )
    strategy = result.scalar_one_or_none()
    if strategy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy '{name}' not found.",
        )
    return strategy


@router.patch("/{name}", response_model=StrategyResponse)
async def toggle_strategy(
    name: str,
    body: StrategyToggle,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Enable or disable a strategy."""
    result = await db.execute(
        select(Strategy).where(Strategy.name == name)
    )
    strategy = result.scalar_one_or_none()
    if strategy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy '{name}' not found.",
        )
    strategy.is_enabled = body.is_enabled
    await db.flush()
    await db.refresh(strategy)
    return strategy
