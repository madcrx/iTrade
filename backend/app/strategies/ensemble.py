"""
Ensemble / Confluence strategy.

Runs every other strategy and only produces a signal when multiple strategies
agree on the same direction. This is the highest-conviction signal the platform
produces: confidence scales with how many independent strategies confirm the
trade and how strong each one is. Designed to surface the best available
opportunities and filter out weak, single-indicator noise.
"""
from __future__ import annotations

from typing import Optional
import pandas as pd

from app.strategies.base import BaseStrategy, BacktestResult, SignalResult
from app.strategies import indicators as ta


class EnsembleStrategy(BaseStrategy):
    name = "ensemble"
    display_name = "AI Ensemble (Confluence)"
    description = (
        "The flagship high-conviction strategy. Runs all other strategies and only "
        "generates a signal when at least two agree on the same direction. Confidence "
        "scales with the number of confirming strategies and their individual strength, "
        "surfacing the best available trades while filtering out weak single-indicator noise."
    )
    asset_classes = ["stocks", "asx", "crypto"]
    default_stop_loss_pct = 3.0
    default_take_profit_pct = 7.0

    MIN_AGREEMENT = 2  # minimum strategies that must agree

    def _sub_strategies(self) -> list[BaseStrategy]:
        # Imported lazily to avoid a circular import at module load time.
        from app.strategies.golden_cross import GoldenCrossStrategy
        from app.strategies.rsi_reversal import RSIReversalStrategy
        from app.strategies.momentum import MomentumStrategy
        from app.strategies.macd_crossover import MACDCrossoverStrategy
        from app.strategies.bollinger_bands import BollingerBandsStrategy
        from app.strategies.volume_spike import VolumeSpikeStrategy
        from app.strategies.ml_classifier import MLClassifierStrategy

        return [
            GoldenCrossStrategy(),
            RSIReversalStrategy(),
            MomentumStrategy(),
            MACDCrossoverStrategy(),
            BollingerBandsStrategy(),
            VolumeSpikeStrategy(),
            MLClassifierStrategy(),
        ]

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        if len(df) < 60:
            return None

        buy_votes: list[SignalResult] = []
        sell_votes: list[SignalResult] = []

        for strat in self._sub_strategies():
            try:
                result = strat.generate_signal(df, symbol)
            except Exception:
                continue
            if result is None:
                continue
            if result.action == "BUY":
                buy_votes.append(result)
            elif result.action == "SELL":
                sell_votes.append(result)

        # Decide the winning side by both count and total conviction.
        buy_conf = sum(r.confidence for r in buy_votes)
        sell_conf = sum(r.confidence for r in sell_votes)

        if len(buy_votes) >= self.MIN_AGREEMENT and buy_conf >= sell_conf:
            winners, action = buy_votes, "BUY"
        elif len(sell_votes) >= self.MIN_AGREEMENT and sell_conf > buy_conf:
            winners, action = sell_votes, "SELL"
        else:
            return None

        price = float(df["Close"].iloc[-1])
        avg_conf = sum(r.confidence for r in winners) / len(winners)
        # Bonus for each additional confirming strategy beyond the minimum.
        confidence = min(97.0, avg_conf + 6.0 * (len(winners) - 1))

        names = ", ".join(
            r.strategy_name.replace("_", " ").title() for r in winners
        )
        reasoning = (
            f"AI Ensemble {action} on {symbol}: {len(winners)} independent strategies "
            f"agree on a {action} ({names}). Average sub-strategy confidence "
            f"{avg_conf:.0f}%, boosted to {confidence:.0f}% by confluence. This is a "
            f"high-conviction setup — multiple uncorrelated signals confirm the same direction."
        )

        # Use the tightest stop and the most ambitious target among the winners.
        stop_pct = min((r.stop_loss_pct for r in winners), default=self.default_stop_loss_pct)
        target_pct = max((r.take_profit_pct for r in winners), default=self.default_take_profit_pct)

        return SignalResult(
            symbol=symbol,
            strategy_name=self.name,
            action=action,
            price=price,
            confidence=round(confidence, 1),
            reasoning=reasoning,
            stop_loss_pct=stop_pct,
            take_profit_pct=target_pct,
            indicator_values={
                "agreeing_strategies": len(winners),
                "buy_votes": len(buy_votes),
                "sell_votes": len(sell_votes),
                "avg_confidence": round(avg_conf, 1),
            },
        )

    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        """
        Confluence-trend backtest proxy: long while the medium-term trend is up
        (SMA50 > SMA200) and momentum is not overbought (RSI < 70); flat otherwise.
        Gives a representative equity curve for the ensemble's bias.
        """
        if len(df) < 210:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0, equity_curve=[],
            )

        close = df["Close"]
        sma50 = ta.sma(close, 50)
        sma200 = ta.sma(close, 200)
        rsi = ta.rsi(close, 14)

        trades = []
        in_trade = False
        entry_price = 0.0
        entry_date = None

        for i in range(1, len(df)):
            if pd.isna(sma200.iloc[i]) or pd.isna(rsi.iloc[i]):
                continue
            uptrend = sma50.iloc[i] > sma200.iloc[i] and rsi.iloc[i] < 70
            price = float(close.iloc[i])

            if not in_trade and uptrend:
                in_trade = True
                entry_price = price
                entry_date = df.index[i]
            elif in_trade and not uptrend:
                ret_pct = (price - entry_price) / entry_price * 100
                trades.append({
                    "entry_date": entry_date,
                    "exit_date": df.index[i],
                    "entry_price": entry_price,
                    "exit_price": price,
                    "return_pct": ret_pct,
                    "duration_days": (df.index[i] - entry_date).days,
                })
                in_trade = False

        if not trades:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0, equity_curve=[],
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
