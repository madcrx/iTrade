from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class WatchlistItemCreate(BaseModel):
    symbol: str
    display_name: Optional[str] = None


class WatchlistItemResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    asset_type: str
    display_name: Optional[str] = None
    added_at: datetime

    model_config = {"from_attributes": True}
