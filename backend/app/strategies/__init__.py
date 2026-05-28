from app.strategies.golden_cross import GoldenCrossStrategy
from app.strategies.rsi_reversal import RSIReversalStrategy
from app.strategies.momentum import MomentumStrategy
from app.strategies.macd_crossover import MACDCrossoverStrategy
from app.strategies.bollinger_bands import BollingerBandsStrategy
from app.strategies.volume_spike import VolumeSpikeStrategy
from app.strategies.ml_classifier import MLClassifierStrategy

ALL_STRATEGIES = [
    GoldenCrossStrategy(),
    RSIReversalStrategy(),
    MomentumStrategy(),
    MACDCrossoverStrategy(),
    BollingerBandsStrategy(),
    VolumeSpikeStrategy(),
    MLClassifierStrategy(),
]

STRATEGY_MAP = {s.name: s for s in ALL_STRATEGIES}

__all__ = [
    "GoldenCrossStrategy",
    "RSIReversalStrategy",
    "MomentumStrategy",
    "MACDCrossoverStrategy",
    "BollingerBandsStrategy",
    "VolumeSpikeStrategy",
    "MLClassifierStrategy",
    "ALL_STRATEGIES",
    "STRATEGY_MAP",
]
