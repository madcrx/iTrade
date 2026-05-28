from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PortfolioTradeCreate(BaseModel):
    symbol: str
    action: str  # BUY or SELL
    price: float
    quantity: float
    trade_date: datetime
    signal_id: Optional[int] = None
    notes: Optional[str] = None
    broker: Optional[str] = None


class PortfolioTradeResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    action: str
    price: float
    quantity: float
    trade_date: datetime
    signal_id: Optional[int] = None
    notes: Optional[str] = None
    broker: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PortfolioPerformance(BaseModel):
    total_invested: float
    current_value: float
    total_return_pct: float
    total_pnl: float
    win_rate: float
    total_trades: int
    open_positions: list[dict]
    closed_positions: list[dict]


class BacktestRequest(BaseModel):
    symbol: str
    strategy: str
    period: str = "1y"  # 1mo, 3mo, 6mo, 1y, 2y, 5y


class BacktestResultResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    strategy: str
    period: str
    results: dict
    created_at: datetime

    model_config = {"from_attributes": True}
