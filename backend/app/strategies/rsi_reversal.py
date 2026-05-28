from typing import Optional
import pandas as pd
import pandas_ta as ta

from app.strategies.base import BaseStrategy, BacktestResult, SignalResult


class RSIReversalStrategy(BaseStrategy):
    """
    RSI Mean-Reversion strategy.

    BUY  when RSI crosses UP through the oversold threshold (default 30).
    SELL when RSI crosses DOWN through the overbought threshold (default 70).
    """

    name = "rsi_reversal"
    display_name = "RSI Mean Reversion"
    description = (
        "Uses the 14-period Relative Strength Index to identify overbought and oversold "
        "conditions. Generates buy signals when RSI recovers from below 30 and sell signals "
        "when RSI falls from above 70, betting on price mean reversion."
    )
    asset_classes = ["stocks", "asx", "crypto"]
    default_stop_loss_pct = 2.0
    default_take_profit_pct = 4.0

    OVERSOLD = 30
    OVERBOUGHT = 70
    RSI_PERIOD = 14

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        if len(df) < self.RSI_PERIOD + 2:
            return None

        close = df["Close"]
        rsi = ta.rsi(close, length=self.RSI_PERIOD)
        if rsi is None or len(rsi) < 2:
            return None

        prev_rsi = float(rsi.iloc[-2])
        curr_rsi = float(rsi.iloc[-1])
        price = float(close.iloc[-1])

        oversold_cross = prev_rsi < self.OVERSOLD and curr_rsi >= self.OVERSOLD
        overbought_cross = prev_rsi > self.OVERBOUGHT and curr_rsi <= self.OVERBOUGHT

        if oversold_cross:
            depth = self.OVERSOLD - min(prev_rsi, self.OVERSOLD)
            confidence = min(55 + depth * 2, 85)
            reasoning = (
                f"RSI Oversold Reversal on {symbol}: RSI crossed UP from {prev_rsi:.1f} to "
                f"{curr_rsi:.1f}, recovering through the oversold threshold of {self.OVERSOLD}. "
                f"When RSI dips below 30 and then recovers, it historically signals that "
                f"selling pressure has exhausted and buyers are regaining control. "
                f"Current price ${price:.2f}."
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
                    "rsi": round(curr_rsi, 2),
                    "prev_rsi": round(prev_rsi, 2),
                    "oversold_level": self.OVERSOLD,
                    "overbought_level": self.OVERBOUGHT,
                },
            )

        if overbought_cross:
            height = max(prev_rsi, self.OVERBOUGHT) - self.OVERBOUGHT
            confidence = min(55 + height * 2, 85)
            reasoning = (
                f"RSI Overbought Reversal on {symbol}: RSI crossed DOWN from {prev_rsi:.1f} to "
                f"{curr_rsi:.1f}, falling back through the overbought threshold of {self.OVERBOUGHT}. "
                f"When RSI peaks above 70 and rolls over, it signals that buying momentum has "
                f"weakened and a retracement is likely. Current price ${price:.2f}."
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
                    "rsi": round(curr_rsi, 2),
                    "prev_rsi": round(prev_rsi, 2),
                    "oversold_level": self.OVERSOLD,
                    "overbought_level": self.OVERBOUGHT,
                },
            )

        return None

    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        if len(df) < self.RSI_PERIOD + 2:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        close = df["Close"].copy()
        rsi = ta.rsi(close, length=self.RSI_PERIOD)

        trades = []
        in_trade = False
        entry_price = 0.0
        entry_date = None
        trade_direction = None

        for i in range(1, len(df)):
            prev = float(rsi.iloc[i - 1]) if not pd.isna(rsi.iloc[i - 1]) else 50
            curr = float(rsi.iloc[i]) if not pd.isna(rsi.iloc[i]) else 50

            if not in_trade:
                if prev < self.OVERSOLD and curr >= self.OVERSOLD:
                    in_trade = True
                    entry_price = float(close.iloc[i])
                    entry_date = df.index[i]
                    trade_direction = "long"
                elif prev > self.OVERBOUGHT and curr <= self.OVERBOUGHT:
                    in_trade = True
                    entry_price = float(close.iloc[i])
                    entry_date = df.index[i]
                    trade_direction = "short"
            else:
                # Exit after 10 days or on opposite signal
                duration = (df.index[i] - entry_date).days
                opposite_long = trade_direction == "short" and prev < self.OVERSOLD and curr >= self.OVERSOLD
                opposite_short = trade_direction == "long" and prev > self.OVERBOUGHT and curr <= self.OVERBOUGHT
                time_exit = duration >= 10

                if time_exit or opposite_long or opposite_short:
                    exit_price = float(close.iloc[i])
                    if trade_direction == "long":
                        ret_pct = (exit_price - entry_price) / entry_price * 100
                    else:
                        ret_pct = (entry_price - exit_price) / entry_price * 100

                    trades.append({
                        "entry_date": entry_date,
                        "exit_date": df.index[i],
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
