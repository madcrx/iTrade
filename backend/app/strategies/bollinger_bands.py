from typing import Optional
import pandas as pd
import pandas_ta as ta

from app.strategies.base import BaseStrategy, BacktestResult, SignalResult


class BollingerBandsStrategy(BaseStrategy):
    """
    Bollinger Band Mean-Reversion strategy.

    BUY  when price closes below the lower band (oversold/mean-reversion entry).
    SELL when price closes above the upper band (overbought/mean-reversion entry).

    Uses standard 20-period, 2 std-dev bands.
    """

    name = "bollinger_bands"
    display_name = "Bollinger Band Mean Reversion"
    description = (
        "Identifies overbought and oversold conditions using Bollinger Bands "
        "(20-period SMA ± 2 standard deviations). Generates buy signals when price "
        "touches the lower band and sell signals at the upper band, betting on reversion "
        "to the mean."
    )
    asset_classes = ["stocks", "asx", "crypto"]
    default_stop_loss_pct = 2.0
    default_take_profit_pct = 4.0

    BB_PERIOD = 20
    BB_STD = 2.0

    def _compute_bb(self, close: pd.Series):
        result = ta.bbands(close, length=self.BB_PERIOD, std=self.BB_STD)
        if result is None or result.empty:
            return None, None, None
        lower_col = f"BBL_{self.BB_PERIOD}_{self.BB_STD}"
        mid_col = f"BBM_{self.BB_PERIOD}_{self.BB_STD}"
        upper_col = f"BBU_{self.BB_PERIOD}_{self.BB_STD}"
        return result[lower_col], result[mid_col], result[upper_col]

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        if len(df) < self.BB_PERIOD + 2:
            return None

        close = df["Close"]
        lower, mid, upper = self._compute_bb(close)
        if lower is None:
            return None

        price = float(close.iloc[-1])
        curr_lower = float(lower.iloc[-1])
        curr_upper = float(upper.iloc[-1])
        curr_mid = float(mid.iloc[-1])
        band_width = curr_upper - curr_lower
        band_width_pct = band_width / curr_mid * 100

        below_lower = price < curr_lower
        above_upper = price > curr_upper

        # %B indicator: 0 = lower band, 1 = upper band
        pct_b = (price - curr_lower) / band_width if band_width > 0 else 0.5

        if below_lower:
            distance_pct = (curr_lower - price) / curr_lower * 100
            confidence = min(55 + distance_pct * 10, 85)
            reasoning = (
                f"Bollinger Band Lower Touch on {symbol}: price (${price:.2f}) has closed "
                f"below the lower Bollinger Band (${curr_lower:.2f}). The %B indicator reads "
                f"{pct_b:.3f} (below 0 = outside lower band). Band width is {band_width_pct:.1f}%, "
                f"suggesting elevated volatility. Historically, price tends to revert toward "
                f"the 20-day mean (${curr_mid:.2f}) from this level."
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
                    "bb_lower": round(curr_lower, 4),
                    "bb_mid": round(curr_mid, 4),
                    "bb_upper": round(curr_upper, 4),
                    "pct_b": round(pct_b, 4),
                    "band_width_pct": round(band_width_pct, 4),
                },
            )

        if above_upper:
            distance_pct = (price - curr_upper) / curr_upper * 100
            confidence = min(55 + distance_pct * 10, 85)
            reasoning = (
                f"Bollinger Band Upper Touch on {symbol}: price (${price:.2f}) has closed "
                f"above the upper Bollinger Band (${curr_upper:.2f}). The %B indicator reads "
                f"{pct_b:.3f} (above 1 = outside upper band). Band width is {band_width_pct:.1f}%. "
                f"Historically, price tends to pull back toward the 20-day mean "
                f"(${curr_mid:.2f}) from this level."
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
                    "bb_lower": round(curr_lower, 4),
                    "bb_mid": round(curr_mid, 4),
                    "bb_upper": round(curr_upper, 4),
                    "pct_b": round(pct_b, 4),
                    "band_width_pct": round(band_width_pct, 4),
                },
            )

        return None

    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        if len(df) < self.BB_PERIOD + 2:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        close = df["Close"].copy()
        lower, mid, upper = self._compute_bb(close)

        trades = []
        in_trade = False
        entry_price = 0.0
        entry_date = None
        trade_direction = None

        for i in range(1, len(df)):
            if pd.isna(lower.iloc[i]) or pd.isna(upper.iloc[i]):
                continue
            price = float(close.iloc[i])
            curr_l = float(lower.iloc[i])
            curr_u = float(upper.iloc[i])
            curr_m = float(mid.iloc[i])

            if not in_trade:
                if price < curr_l:
                    in_trade = True
                    entry_price = price
                    entry_date = df.index[i]
                    trade_direction = "long"
                elif price > curr_u:
                    in_trade = True
                    entry_price = price
                    entry_date = df.index[i]
                    trade_direction = "short"
            else:
                duration = (df.index[i] - entry_date).days
                # Exit when price reverts to the middle band or after 15 days
                reverted_long = trade_direction == "long" and price >= curr_m
                reverted_short = trade_direction == "short" and price <= curr_m
                time_exit = duration >= 15

                if reverted_long or reverted_short or time_exit:
                    if trade_direction == "long":
                        ret_pct = (price - entry_price) / entry_price * 100
                    else:
                        ret_pct = (entry_price - price) / entry_price * 100

                    trades.append({
                        "entry_date": entry_date,
                        "exit_date": df.index[i],
                        "entry_price": entry_price,
                        "exit_price": price,
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
