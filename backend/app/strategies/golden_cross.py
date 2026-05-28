from typing import Optional
import pandas as pd
import pandas_ta as ta

from app.strategies.base import BaseStrategy, BacktestResult, SignalResult


class GoldenCrossStrategy(BaseStrategy):
    """
    Golden Cross / Death Cross — 50-day SMA crosses above/below 200-day SMA.

    Golden Cross (BUY)  : SMA50 crosses above SMA200 (bullish trend change).
    Death  Cross (SELL) : SMA50 crosses below SMA200 (bearish trend change).
    """

    name = "golden_cross"
    display_name = "Golden Cross / Death Cross"
    description = (
        "Identifies trend changes using the 50-day and 200-day Simple Moving Average "
        "crossover. A Golden Cross (SMA50 > SMA200) signals a bullish regime; a "
        "Death Cross (SMA50 < SMA200) signals a bearish regime."
    )
    asset_classes = ["stocks", "asx", "crypto"]
    default_stop_loss_pct = 3.0
    default_take_profit_pct = 8.0

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        if len(df) < 201:
            return None

        close = df["Close"]
        sma50 = ta.sma(close, length=50)
        sma200 = ta.sma(close, length=200)

        if sma50 is None or sma200 is None or len(sma50) < 2:
            return None

        prev_50 = float(sma50.iloc[-2])
        curr_50 = float(sma50.iloc[-1])
        prev_200 = float(sma200.iloc[-2])
        curr_200 = float(sma200.iloc[-1])
        price = float(close.iloc[-1])

        golden_cross = prev_50 <= prev_200 and curr_50 > curr_200
        death_cross = prev_50 >= prev_200 and curr_50 < curr_200

        # Gap between averages as confidence proxy (larger gap = more conviction)
        gap_pct = abs(curr_50 - curr_200) / curr_200 * 100
        confidence = min(50 + gap_pct * 5, 90)

        if golden_cross:
            reasoning = (
                f"Golden Cross detected on {symbol}: the 50-day SMA (${curr_50:.2f}) "
                f"just crossed above the 200-day SMA (${curr_200:.2f}). This classic "
                f"bullish signal indicates a potential long-term uptrend. The gap between "
                f"the averages is {gap_pct:.2f}%, suggesting momentum is building."
            )
            return SignalResult(
                symbol=symbol,
                strategy_name=self.name,
                action="BUY",
                price=price,
                confidence=round(confidence, 1),
                reasoning=reasoning,
                stop_loss_pct=self.default_stop_loss_pct,
                take_profit_pct=self.default_take_profit_pct,
                indicator_values={
                    "sma50": round(curr_50, 4),
                    "sma200": round(curr_200, 4),
                    "gap_pct": round(gap_pct, 4),
                    "prev_sma50": round(prev_50, 4),
                    "prev_sma200": round(prev_200, 4),
                },
            )

        if death_cross:
            reasoning = (
                f"Death Cross detected on {symbol}: the 50-day SMA (${curr_50:.2f}) "
                f"just crossed below the 200-day SMA (${curr_200:.2f}). This bearish "
                f"signal indicates a potential long-term downtrend. The gap is "
                f"{gap_pct:.2f}% and widening, suggesting selling pressure."
            )
            return SignalResult(
                symbol=symbol,
                strategy_name=self.name,
                action="SELL",
                price=price,
                confidence=round(confidence, 1),
                reasoning=reasoning,
                stop_loss_pct=self.default_stop_loss_pct,
                take_profit_pct=self.default_take_profit_pct,
                indicator_values={
                    "sma50": round(curr_50, 4),
                    "sma200": round(curr_200, 4),
                    "gap_pct": round(gap_pct, 4),
                    "prev_sma50": round(prev_50, 4),
                    "prev_sma200": round(prev_200, 4),
                },
            )

        return None  # No crossover today

    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        if len(df) < 201:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        close = df["Close"].copy()
        sma50 = ta.sma(close, length=50)
        sma200 = ta.sma(close, length=200)

        signals = pd.Series(0, index=df.index)
        for i in range(201, len(df)):
            if sma50.iloc[i - 1] <= sma200.iloc[i - 1] and sma50.iloc[i] > sma200.iloc[i]:
                signals.iloc[i] = 1   # Golden Cross → BUY
            elif sma50.iloc[i - 1] >= sma200.iloc[i - 1] and sma50.iloc[i] < sma200.iloc[i]:
                signals.iloc[i] = -1  # Death Cross → SELL

        trades = []
        in_trade = False
        entry_price = 0.0
        entry_date = None

        for i in range(len(signals)):
            if not in_trade and signals.iloc[i] == 1:
                in_trade = True
                entry_price = float(close.iloc[i])
                entry_date = df.index[i]
            elif in_trade and (signals.iloc[i] == -1 or i == len(signals) - 1):
                exit_price = float(close.iloc[i])
                exit_date = df.index[i]
                ret_pct = (exit_price - entry_price) / entry_price * 100
                duration = (exit_date - entry_date).days
                trades.append({
                    "entry_date": entry_date,
                    "exit_date": exit_date,
                    "entry_price": entry_price,
                    "exit_price": exit_price,
                    "return_pct": ret_pct,
                    "duration_days": duration,
                })
                in_trade = False

        if not trades:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        total_return = sum(t["return_pct"] for t in trades)
        win_rate = len([t for t in trades if t["return_pct"] > 0]) / len(trades) * 100
        avg_duration = sum(t["duration_days"] for t in trades) / len(trades)
        returns_series = pd.Series([t["return_pct"] / 100 for t in trades])
        sharpe = self._calc_sharpe(returns_series)
        equity_curve = self._build_equity_curve(trades)
        equity_series = pd.Series([p["value"] for p in equity_curve])
        max_dd = self._calc_max_drawdown(equity_series) if len(equity_series) > 1 else 0.0

        return BacktestResult(
            total_return_pct=round(total_return, 2),
            sharpe_ratio=sharpe,
            max_drawdown_pct=max_dd,
            win_rate=round(win_rate, 1),
            total_trades=len(trades),
            avg_trade_duration_days=round(avg_duration, 1),
            equity_curve=equity_curve,
            trades=trades,
        )
