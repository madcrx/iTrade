from typing import Optional
import pandas as pd
import pandas_ta as ta

from app.strategies.base import BaseStrategy, BacktestResult, SignalResult


class MACDCrossoverStrategy(BaseStrategy):
    """
    MACD Signal-Line Crossover strategy.

    BUY  when the MACD line crosses above the signal line (bullish momentum).
    SELL when the MACD line crosses below the signal line (bearish momentum).

    Uses standard parameters: fast=12, slow=26, signal=9.
    """

    name = "macd_crossover"
    display_name = "MACD Signal Crossover"
    description = (
        "Identifies momentum shifts using the MACD (Moving Average Convergence "
        "Divergence) indicator. Generates buy signals when the MACD line crosses above "
        "its signal line, and sell signals on a crossover to the downside."
    )
    asset_classes = ["stocks", "asx", "crypto"]
    default_stop_loss_pct = 2.0
    default_take_profit_pct = 5.0

    FAST = 12
    SLOW = 26
    SIGNAL = 9

    def _compute_macd(self, close: pd.Series):
        """Return (macd_line, signal_line, histogram) series."""
        result = ta.macd(close, fast=self.FAST, slow=self.SLOW, signal=self.SIGNAL)
        if result is None or result.empty:
            return None, None, None
        macd_col = f"MACD_{self.FAST}_{self.SLOW}_{self.SIGNAL}"
        sig_col = f"MACDs_{self.FAST}_{self.SLOW}_{self.SIGNAL}"
        hist_col = f"MACDh_{self.FAST}_{self.SLOW}_{self.SIGNAL}"
        return result[macd_col], result[sig_col], result[hist_col]

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        min_bars = self.SLOW + self.SIGNAL + 2
        if len(df) < min_bars:
            return None

        macd, signal, hist = self._compute_macd(df["Close"])
        if macd is None or len(macd.dropna()) < 2:
            return None

        price = float(df["Close"].iloc[-1])
        prev_macd = float(macd.iloc[-2])
        curr_macd = float(macd.iloc[-1])
        prev_sig = float(signal.iloc[-2])
        curr_sig = float(signal.iloc[-1])
        curr_hist = float(hist.iloc[-1])

        bullish_cross = prev_macd <= prev_sig and curr_macd > curr_sig
        bearish_cross = prev_macd >= prev_sig and curr_macd < curr_sig

        histogram_strength = abs(curr_hist)
        confidence = min(50 + histogram_strength * 500, 88)

        if bullish_cross:
            reasoning = (
                f"MACD Bullish Crossover on {symbol}: the MACD line ({curr_macd:.4f}) "
                f"just crossed above the signal line ({curr_sig:.4f}). The histogram "
                f"turned positive ({curr_hist:.4f}), confirming increasing bullish momentum. "
                f"This signal suggests upward price pressure is building. Price: ${price:.2f}."
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
                    "macd": round(curr_macd, 6),
                    "macd_signal": round(curr_sig, 6),
                    "macd_histogram": round(curr_hist, 6),
                    "prev_macd": round(prev_macd, 6),
                    "prev_signal": round(prev_sig, 6),
                },
            )

        if bearish_cross:
            reasoning = (
                f"MACD Bearish Crossover on {symbol}: the MACD line ({curr_macd:.4f}) "
                f"just crossed below the signal line ({curr_sig:.4f}). The histogram "
                f"turned negative ({curr_hist:.4f}), confirming increasing bearish momentum. "
                f"This suggests downward price pressure is building. Price: ${price:.2f}."
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
                    "macd": round(curr_macd, 6),
                    "macd_signal": round(curr_sig, 6),
                    "macd_histogram": round(curr_hist, 6),
                    "prev_macd": round(prev_macd, 6),
                    "prev_signal": round(prev_sig, 6),
                },
            )

        return None

    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        min_bars = self.SLOW + self.SIGNAL + 2
        if len(df) < min_bars:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        close = df["Close"].copy()
        macd, signal, _ = self._compute_macd(close)

        trades = []
        in_trade = False
        entry_price = 0.0
        entry_date = None

        for i in range(1, len(df)):
            if pd.isna(macd.iloc[i]) or pd.isna(signal.iloc[i]):
                continue
            prev_m = float(macd.iloc[i - 1]) if not pd.isna(macd.iloc[i - 1]) else 0
            curr_m = float(macd.iloc[i])
            prev_s = float(signal.iloc[i - 1]) if not pd.isna(signal.iloc[i - 1]) else 0
            curr_s = float(signal.iloc[i])

            if not in_trade and prev_m <= prev_s and curr_m > curr_s:
                in_trade = True
                entry_price = float(close.iloc[i])
                entry_date = df.index[i]
            elif in_trade and prev_m >= prev_s and curr_m < curr_s:
                exit_price = float(close.iloc[i])
                duration = (df.index[i] - entry_date).days
                ret_pct = (exit_price - entry_price) / entry_price * 100
                trades.append({
                    "entry_date": entry_date,
                    "exit_date": df.index[i],
                    "entry_price": entry_price,
                    "exit_price": exit_price,
                    "return_pct": ret_pct,
                    "duration_days": duration,
                })
                in_trade = False

        # Close open trade at last bar
        if in_trade:
            exit_price = float(close.iloc[-1])
            duration = (df.index[-1] - entry_date).days
            ret_pct = (exit_price - entry_price) / entry_price * 100
            trades.append({
                "entry_date": entry_date,
                "exit_date": df.index[-1],
                "entry_price": entry_price,
                "exit_price": exit_price,
                "return_pct": ret_pct,
                "duration_days": duration,
            })

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
