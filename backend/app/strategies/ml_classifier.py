"""
ML Classifier Strategy — Random Forest signal generator (Phase 2).

Uses a Random Forest trained on technical indicators to classify the next
5-day price direction as BUY (>+2%), SELL (<-2%), or HOLD.

Feature set: RSI, MACD, BB %B, ROC-20, Volume Ratio, SMA50/SMA200 ratio,
ATR-normalised, and day-of-week.
"""

from typing import Optional
import warnings
import numpy as np
import pandas as pd
from app.strategies import indicators as ta

from app.strategies.base import BaseStrategy, BacktestResult, SignalResult

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import StandardScaler


class MLClassifierStrategy(BaseStrategy):
    name = "ml_classifier"
    display_name = "ML Random Forest Classifier"
    description = (
        "A Random Forest machine learning model trained on 8 technical indicators "
        "(RSI, MACD histogram, Bollinger %B, ROC-20, Volume Ratio, SMA ratio, normalised ATR, "
        "and day-of-week) to predict whether price will rise >2%, fall >2%, or stay flat "
        "over the next 5 trading days."
    )
    asset_classes = ["stocks", "asx", "crypto"]
    default_stop_loss_pct = 2.5
    default_take_profit_pct = 5.0

    N_ESTIMATORS = 100
    FORWARD_DAYS = 5
    BUY_THRESHOLD = 2.0   # pct
    SELL_THRESHOLD = -2.0  # pct
    MIN_TRAIN_ROWS = 200

    # ------------------------------------------------------------------
    # Feature engineering
    # ------------------------------------------------------------------

    def _build_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Return a DataFrame of engineered features aligned with df index."""
        close = df["Close"]
        volume = df["Volume"]

        features = pd.DataFrame(index=df.index)

        # RSI
        rsi = ta.rsi(close, length=14)
        features["rsi"] = rsi

        # MACD histogram
        macd_result = ta.macd(close, fast=12, slow=26, signal=9)
        if macd_result is not None and not macd_result.empty:
            features["macd_hist"] = macd_result.get("MACDh_12_26_9", pd.Series(0, index=df.index))
        else:
            features["macd_hist"] = 0

        # Bollinger %B
        bb = ta.bbands(close, length=20, std=2.0)
        if bb is not None and not bb.empty:
            lower = bb.get("BBL_20_2.0", close)
            upper = bb.get("BBU_20_2.0", close)
            band_range = upper - lower
            features["bb_pct_b"] = (close - lower) / band_range.replace(0, np.nan)
        else:
            features["bb_pct_b"] = 0.5

        # ROC-20
        roc = ta.roc(close, length=20)
        features["roc_20"] = roc

        # Volume ratio vs 20-day average
        avg_vol = volume.rolling(20).mean()
        features["vol_ratio"] = volume / avg_vol.replace(0, np.nan)

        # SMA ratio (50 / 200)
        sma50 = ta.sma(close, length=50)
        sma200 = ta.sma(close, length=200)
        features["sma_ratio"] = sma50 / sma200.replace(0, np.nan)

        # ATR normalised by close
        atr = ta.atr(df["High"], df["Low"], close, length=14)
        features["atr_norm"] = atr / close.replace(0, np.nan)

        # Day of week (cyclical encoding)
        day = pd.Series(df.index, index=df.index).apply(
            lambda x: x.weekday() if hasattr(x, "weekday") else 2
        )
        features["dow_sin"] = np.sin(2 * np.pi * day / 5)
        features["dow_cos"] = np.cos(2 * np.pi * day / 5)

        return features

    def _build_labels(self, df: pd.DataFrame) -> pd.Series:
        """5-day forward return labels: 1=BUY, -1=SELL, 0=HOLD."""
        close = df["Close"]
        fwd_return = close.shift(-self.FORWARD_DAYS) / close - 1
        fwd_return_pct = fwd_return * 100
        labels = pd.Series(0, index=df.index)
        labels[fwd_return_pct > self.BUY_THRESHOLD] = 1
        labels[fwd_return_pct < self.SELL_THRESHOLD] = -1
        return labels

    def _train(self, features: pd.DataFrame, labels: pd.Series):
        """Fit a RandomForest; return (model, scaler)."""
        X = features.copy()
        y = labels.copy()

        # Align and drop NaNs
        combined = pd.concat([X, y.rename("label")], axis=1).dropna()
        # Drop last FORWARD_DAYS rows (no valid labels)
        combined = combined.iloc[: -self.FORWARD_DAYS]
        if len(combined) < self.MIN_TRAIN_ROWS:
            return None, None

        X_clean = combined.drop("label", axis=1)
        y_clean = combined["label"].astype(int)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_clean)

        clf = RandomForestClassifier(
            n_estimators=self.N_ESTIMATORS,
            max_depth=6,
            min_samples_split=20,
            random_state=42,
            n_jobs=-1,
        )
        clf.fit(X_scaled, y_clean)
        return clf, scaler

    # ------------------------------------------------------------------
    # BaseStrategy interface
    # ------------------------------------------------------------------

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[SignalResult]:
        if len(df) < self.MIN_TRAIN_ROWS + self.FORWARD_DAYS + 10:
            return None

        features = self._build_features(df)
        labels = self._build_labels(df)
        clf, scaler = self._train(features, labels)

        if clf is None:
            return None

        # Predict on last available row
        last_features = features.iloc[-1:].copy()
        if last_features.isnull().any().any():
            last_features = last_features.fillna(method="ffill").fillna(0)

        try:
            X_last = scaler.transform(last_features)
            prediction = int(clf.predict(X_last)[0])
            proba = clf.predict_proba(X_last)[0]
            confidence_raw = float(max(proba)) * 100
        except Exception:
            return None

        price = float(df["Close"].iloc[-1])
        feat_vals = {k: round(float(v), 4) for k, v in last_features.iloc[0].items()}

        if prediction == 1:
            action = "BUY"
            confidence = min(confidence_raw, 88)
            reasoning = (
                f"ML Classifier BUY signal for {symbol}: the Random Forest model "
                f"(trained on {self.N_ESTIMATORS} trees, {len(df)} historical bars) "
                f"predicts a >{self.BUY_THRESHOLD}% gain over the next {self.FORWARD_DAYS} days "
                f"with {confidence:.1f}% model confidence. Key drivers: "
                f"RSI={feat_vals.get('rsi', 0):.1f}, "
                f"MACD hist={feat_vals.get('macd_hist', 0):.4f}, "
                f"BB %B={feat_vals.get('bb_pct_b', 0):.3f}. "
                f"Current price: ${price:.2f}."
            )
        elif prediction == -1:
            action = "SELL"
            confidence = min(confidence_raw, 88)
            reasoning = (
                f"ML Classifier SELL signal for {symbol}: the Random Forest model "
                f"predicts a >{abs(self.SELL_THRESHOLD)}% decline over the next {self.FORWARD_DAYS} days "
                f"with {confidence:.1f}% model confidence. Key drivers: "
                f"RSI={feat_vals.get('rsi', 0):.1f}, "
                f"MACD hist={feat_vals.get('macd_hist', 0):.4f}, "
                f"BB %B={feat_vals.get('bb_pct_b', 0):.3f}. "
                f"Current price: ${price:.2f}."
            )
        else:
            return None  # HOLD — no actionable signal

        return SignalResult(
            symbol=symbol,
            strategy_name=self.name,
            action=action,
            price=price,
            confidence=round(confidence, 1),
            reasoning=reasoning,
            stop_loss_pct=self.default_stop_loss_pct,
            take_profit_pct=self.default_take_profit_pct,
            indicator_values={
                "prediction": prediction,
                "confidence_raw": round(confidence_raw, 2),
                **feat_vals,
            },
        )

    def backtest(self, df: pd.DataFrame) -> BacktestResult:
        """
        Walk-forward backtest: train on the first 60% of data, test on remaining 40%.
        """
        if len(df) < self.MIN_TRAIN_ROWS + self.FORWARD_DAYS + 50:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        split = int(len(df) * 0.6)
        train_df = df.iloc[:split]
        test_df = df.iloc[split:]

        features_train = self._build_features(train_df)
        labels_train = self._build_labels(train_df)
        clf, scaler = self._train(features_train, labels_train)

        if clf is None:
            return BacktestResult(
                total_return_pct=0.0, sharpe_ratio=0.0, max_drawdown_pct=0.0,
                win_rate=0.0, total_trades=0, avg_trade_duration_days=0.0,
                equity_curve=[],
            )

        features_test = self._build_features(test_df)
        close_test = test_df["Close"]
        trades = []

        for i in range(len(test_df) - self.FORWARD_DAYS):
            row = features_test.iloc[i:i + 1].fillna(0)
            try:
                X_row = scaler.transform(row)
                pred = int(clf.predict(X_row)[0])
            except Exception:
                continue

            if pred == 0:
                continue

            entry_price = float(close_test.iloc[i])
            exit_price = float(close_test.iloc[i + self.FORWARD_DAYS])

            if pred == 1:
                ret_pct = (exit_price - entry_price) / entry_price * 100
            else:
                ret_pct = (entry_price - exit_price) / entry_price * 100

            trades.append({
                "entry_date": test_df.index[i],
                "exit_date": test_df.index[i + self.FORWARD_DAYS],
                "entry_price": entry_price,
                "exit_price": exit_price,
                "return_pct": ret_pct,
                "duration_days": self.FORWARD_DAYS,
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
            avg_trade_duration_days=float(self.FORWARD_DAYS),
            equity_curve=equity_curve,
            trades=trades,
        )
