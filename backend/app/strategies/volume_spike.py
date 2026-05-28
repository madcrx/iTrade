from typing import Optional
import pandas as pd
import pandas_ta as ta

from app.strategies.base import BaseStrategy, BacktestResult, SignalResult


class VolumeSpikeStrategy(BaseStrategy):
    """
    Unusual Volume + Price Direction strategy.

    Detects when trading volume is significantly above the 20-day average AND
    price is moving in the same direction (confirming institutional interest).

    BUY  : volume spike + positive price movement (accumulation).
    SELL : volume spike + negative price movement (distribution).
    """

    name = "volume_spike"
    display_name = "Volume Spike"
    description = (
        "Detects unusual trading volume (≥ 2× the 20-day average) combined with a "
        "significant price move. High volume with a rising price suggests institutional "
        "accumulation (buy signal); high volume with a falling price suggests distribution "
        "(sell signal)."
    )
    asset_classes = ["stocks", "asx", "crypto"]
    default_stop_loss_pct = 2.5
    default_take_profit_pct = 5.0

    VOLUME_MULTIPLIER = 2.0   # Volume must be 2× the average
    VOLUME_PERIOD = 20
    PRICE_CHANGE_THRESHOLD = 1.0  # Price must move at least 1% on the spike day

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        if len(df) < self.VOLUME_PERIOD + 2:
            return None

        close = df["Close"]
        volume = df["Volume"]

        avg_volume = volume.rolling(self.VOLUME_PERIOD).mean()
        curr_volume = float(volume.iloc[-1])
        curr_avg_vol = float(avg_volume.iloc[-1])
        price = float(close.iloc[-1])
        prev_price = float(close.iloc[-2])

        if curr_avg_vol == 0:
            return None

        volume_ratio = curr_volume / curr_avg_vol
        price_change_pct = (price - prev_price) / prev_price * 100

        is_volume_spike = volume_ratio >= self.VOLUME_MULTIPLIER
        is_significant_move = abs(price_change_pct) >= self.PRICE_CHANGE_THRESHOLD

        if not (is_volume_spike and is_significant_move):
            return None

        confidence = min(50 + (volume_ratio - 2) * 10 + abs(price_change_pct) * 2, 90)

        if price_change_pct > 0:
            reasoning = (
                f"Bullish Volume Spike on {symbol}: today's volume ({curr_volume:,.0f}) is "
                f"{volume_ratio:.1f}× the 20-day average ({curr_avg_vol:,.0f}). Combined with "
                f"a +{price_change_pct:.2f}% price move, this suggests institutional accumulation. "
                f"High-volume up-days indicate strong buyer conviction. Price: ${price:.2f}."
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
                    "volume": curr_volume,
                    "avg_volume_20": round(curr_avg_vol, 0),
                    "volume_ratio": round(volume_ratio, 2),
                    "price_change_pct": round(price_change_pct, 2),
                    "volume_threshold_multiplier": self.VOLUME_MULTIPLIER,
                },
            )
        else:
            reasoning = (
                f"Bearish Volume Spike on {symbol}: today's volume ({curr_volume:,.0f}) is "
                f"{volume_ratio:.1f}× the 20-day average ({curr_avg_vol:,.0f}). Combined with "
                f"a {price_change_pct:.2f}% price drop, this suggests institutional distribution. "
                f"High-volume down-days indicate strong selling pressure. Price: ${price:.2f}."
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
                    "volume": curr_volume,
                    "avg_volume_20": round(curr_avg_vol, 0),
                    "volume_ratio": round(volume_ratio, 2),
                    "price_change_pct": round(price_change_pct, 2),
                    "volume_threshold_multiplier": self.VOLUME_MULTIPLIER,
                },
            )

    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        if len(df) < self.VOLUME_PERIOD + 2:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        close = df["Close"].copy()
        volume = df["Volume"].copy()
        avg_volume = volume.rolling(self.VOLUME_PERIOD).mean()

        trades = []

        for i in range(self.VOLUME_PERIOD + 1, len(df) - 5):
            curr_vol = float(volume.iloc[i])
            avg_vol = float(avg_volume.iloc[i])
            if avg_vol == 0:
                continue
            ratio = curr_vol / avg_vol
            price_change = (float(close.iloc[i]) - float(close.iloc[i - 1])) / float(close.iloc[i - 1]) * 100

            is_spike = ratio >= self.VOLUME_MULTIPLIER
            is_significant = abs(price_change) >= self.PRICE_CHANGE_THRESHOLD

            if is_spike and is_significant:
                entry_price = float(close.iloc[i])
                exit_price = float(close.iloc[i + 5])  # Hold 5 days
                direction = "long" if price_change > 0 else "short"
                if direction == "long":
                    ret_pct = (exit_price - entry_price) / entry_price * 100
                else:
                    ret_pct = (entry_price - exit_price) / entry_price * 100

                trades.append({
                    "entry_date": df.index[i],
                    "exit_date": df.index[i + 5],
                    "entry_price": entry_price,
                    "exit_price": exit_price,
                    "return_pct": ret_pct,
                    "duration_days": 5,
                })

        if not trades:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        total_return = sum(t["return_pct"] for t in trades)
        win_rate = len([t for t in trades if t["return_pct"] > 0]) / len(trades) * 100
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
            avg_trade_duration_days=5.0,
            equity_curve=equity_curve,
            trades=trades,
        )
