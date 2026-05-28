from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import pandas as pd


@dataclass
class SignalResult:
    """Represents a generated trading signal."""
    symbol: str
    strategy_name: str
    action: str  # BUY / SELL / HOLD
    price: float
    confidence: float  # 0–100
    reasoning: str
    stop_loss_pct: float
    take_profit_pct: float
    indicator_values: dict = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)

    @property
    def stop_loss(self) -> float:
        if self.action == "BUY":
            return round(self.price * (1 - self.stop_loss_pct / 100), 4)
        else:
            return round(self.price * (1 + self.stop_loss_pct / 100), 4)

    @property
    def take_profit(self) -> float:
        if self.action == "BUY":
            return round(self.price * (1 + self.take_profit_pct / 100), 4)
        else:
            return round(self.price * (1 - self.take_profit_pct / 100), 4)


@dataclass
class BacktestResult:
    """Backtest performance metrics."""
    total_return_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    win_rate: float
    total_trades: int
    avg_trade_duration_days: float
    equity_curve: list[dict]  # [{date, value}, ...]
    trades: list[dict] = field(default_factory=list)


class BaseStrategy(ABC):
    """Abstract base class all strategies must implement."""

    name: str = "base"
    display_name: str = "Base Strategy"
    description: str = ""
    asset_classes: list[str] = ["stocks", "crypto", "asx"]
    default_stop_loss_pct: float = 2.0
    default_take_profit_pct: float = 4.0

    @abstractmethod
    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        """
        Analyse the OHLCV DataFrame and return a SignalResult or None if no
        actionable signal (HOLD).  df must have at least columns:
        Open, High, Low, Close, Volume with a DatetimeIndex.
        """

    @abstractmethod
    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        """Run the strategy over historical data and return metrics."""

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------

    def _calc_sharpe(self, returns: pd.Series, risk_free_rate: float = 0.02) -> float:
        """Annualised Sharpe ratio from a daily return series."""
        if returns.std() == 0:
            return 0.0
        excess = returns - risk_free_rate / 252
        return round(float(excess.mean() / excess.std() * (252 ** 0.5)), 3)

    def _calc_max_drawdown(self, equity: pd.Series) -> float:
        """Maximum drawdown as a positive percentage."""
        peak = equity.cummax()
        dd = (equity - peak) / peak
        return round(float(dd.min() * -100), 2)

    def _build_equity_curve(self, trade_log: list[dict], initial: float = 10_000) -> list[dict]:
        """
        Build an equity curve from a list of completed trade dicts, each with
        keys: entry_date, exit_date, return_pct.
        """
        if not trade_log:
            return []
        curve = []
        value = initial
        for t in trade_log:
            value *= 1 + t["return_pct"] / 100
            curve.append({"date": str(t["exit_date"])[:10], "value": round(value, 2)})
        return curve
