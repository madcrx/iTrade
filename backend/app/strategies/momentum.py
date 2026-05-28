from typing import Optional
import pandas as pd
import pandas_ta as ta

from app.strategies.base import BaseStrategy, BacktestResult, SignalResult


class MomentumStrategy(BaseStrategy):
    """
    Rate-of-Change (ROC) Momentum strategy.

    BUY  when 20-day ROC crosses above a positive threshold (strong upward momentum).
    SELL when 20-day ROC crosses below a negative threshold (strong downward momentum).
    """

    name = "momentum"
    display_name = "ROC Momentum"
    description = (
        "Measures price momentum using the 20-day Rate of Change (ROC). Generates "
        "buy signals when momentum is strongly positive (ROC > +5%) and sell signals "
        "when momentum is strongly negative (ROC < -5%), riding the trend."
    )
    asset_classes = ["stocks", "asx", "crypto"]
    default_stop_loss_pct = 2.5
    default_take_profit_pct = 6.0

    ROC_PERIOD = 20
    BUY_THRESHOLD = 5.0   # ROC > +5% → momentum BUY
    SELL_THRESHOLD = -5.0  # ROC < -5% → momentum SELL

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        if len(df) < self.ROC_PERIOD + 2:
            return None

        close = df["Close"]
        roc = ta.roc(close, length=self.ROC_PERIOD)

        if roc is None or len(roc) < 2:
            return None

        prev_roc = float(roc.iloc[-2])
        curr_roc = float(roc.iloc[-1])
        price = float(close.iloc[-1])

        bullish_cross = prev_roc <= self.BUY_THRESHOLD and curr_roc > self.BUY_THRESHOLD
        bearish_cross = prev_roc >= self.SELL_THRESHOLD and curr_roc < self.SELL_THRESHOLD

        if bullish_cross:
            confidence = min(55 + abs(curr_roc) * 2, 88)
            reasoning = (
                f"Bullish Momentum on {symbol}: the 20-day Rate of Change just crossed "
                f"above +{self.BUY_THRESHOLD}%, reading {curr_roc:.2f}% (was {prev_roc:.2f}%). "
                f"Strong positive ROC indicates buyers are in control and price has "
                f"accelerated upward over the past month. Current price ${price:.2f}."
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
                    "roc_20": round(curr_roc, 4),
                    "prev_roc_20": round(prev_roc, 4),
                    "buy_threshold": self.BUY_THRESHOLD,
                    "sell_threshold": self.SELL_THRESHOLD,
                },
            )

        if bearish_cross:
            confidence = min(55 + abs(curr_roc) * 2, 88)
            reasoning = (
                f"Bearish Momentum on {symbol}: the 20-day Rate of Change just crossed "
                f"below {self.SELL_THRESHOLD}%, reading {curr_roc:.2f}% (was {prev_roc:.2f}%). "
                f"Strongly negative ROC indicates sellers are dominating and price has "
                f"accelerated downward. Current price ${price:.2f}."
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
                    "roc_20": round(curr_roc, 4),
                    "prev_roc_20": round(prev_roc, 4),
                    "buy_threshold": self.BUY_THRESHOLD,
                    "sell_threshold": self.SELL_THRESHOLD,
                },
            )

        return None

    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        if len(df) < self.ROC_PERIOD + 2:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        close = df["Close"].copy()
        roc = ta.roc(close, length=self.ROC_PERIOD)

        trades = []
        in_trade = False
        entry_price = 0.0
        entry_date = None
        trade_direction = None

        for i in range(1, len(df)):
            prev = float(roc.iloc[i - 1]) if not pd.isna(roc.iloc[i - 1]) else 0
            curr = float(roc.iloc[i]) if not pd.isna(roc.iloc[i]) else 0

            if not in_trade:
                if prev <= self.BUY_THRESHOLD and curr > self.BUY_THRESHOLD:
                    in_trade = True
                    entry_price = float(close.iloc[i])
                    entry_date = df.index[i]
                    trade_direction = "long"
                elif prev >= self.SELL_THRESHOLD and curr < self.SELL_THRESHOLD:
                    in_trade = True
                    entry_price = float(close.iloc[i])
                    entry_date = df.index[i]
                    trade_direction = "short"
            else:
                duration = (df.index[i] - entry_date).days
                exit_long = trade_direction == "long" and curr < 0
                exit_short = trade_direction == "short" and curr > 0
                time_exit = duration >= 20

                if exit_long or exit_short or time_exit:
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
        sharpe = self._calc_sharpe(pd.Series([t["return_pct"] / 100 for t in trades]))
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
