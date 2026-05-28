from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SignalResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    strategy: str
    action: str
    price: float
    confidence: float
    reasoning: str
    indicator_values: Optional[dict] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    stop_loss_pct: Optional[float] = None
    take_profit_pct: Optional[float] = None
    acted_on: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SignalGenerateRequest(BaseModel):
    symbols: list[str]
    strategies: Optional[list[str]] = None  # None = all enabled strategies


class SignalMarkActed(BaseModel):
    acted_on: bool = True
