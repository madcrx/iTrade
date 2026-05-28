"""
Deep Links API

Generates pre-filled broker URLs so users can quickly navigate to a trade
screen in their broker app. iTrade is a TOOL ONLY — no trades are executed.

Supported brokers:
  stake, commsec, selfwealth, kraken, coinbase, interactive_brokers,
  etoro, binance, webull, tiger
"""

from typing import Optional
from urllib.parse import quote as url_quote

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/deeplinks", tags=["deeplinks"])


# ---------------------------------------------------------------------------
# Deep link generator registry
# ---------------------------------------------------------------------------

def _stake(symbol: str, action: str, quantity: Optional[float], **_) -> str:
    """Stake AU deep link."""
    base = f"https://hellostake.com/au/trade/{url_quote(symbol)}"
    params = f"?action={action.lower()}"
    if quantity:
        params += f"&quantity={quantity}"
    return base + params


def _commsec(symbol: str, **_) -> str:
    """CommSec ASX trade screen (symbol only, ASX format without .AX)."""
    clean = symbol.replace(".AX", "").replace(".ax", "")
    return (
        f"https://www2.commsec.com.au/Private/Equities/Trade/BuySell.aspx"
        f"?mCode={url_quote(clean)}"
    )


def _selfwealth(symbol: str, **_) -> str:
    """SelfWealth ASX trade screen."""
    clean = symbol.replace(".AX", "").replace(".ax", "")
    return f"https://app.selfwealth.com.au/trade?ticker={url_quote(clean)}"


def _kraken(symbol: str, **_) -> str:
    """Kraken crypto trading pair (symbol → symbolUSD)."""
    base = symbol.replace("-USD", "").replace("-USDT", "").upper()
    return f"https://www.kraken.com/u/trade?pair={url_quote(base)}USD"


def _coinbase(symbol: str, **_) -> str:
    """Coinbase Advanced Trade."""
    base = symbol.replace("-USD", "").replace("-USDT", "").upper()
    return f"https://www.coinbase.com/advanced-trade/{url_quote(base)}-USD"


def _interactive_brokers(symbol: str, **_) -> str:
    """Interactive Brokers contract search."""
    clean = symbol.replace(".AX", "").upper()
    return (
        f"https://pennies.interactivebrokers.com/cstools/contract_info.php"
        f"?symbol={url_quote(clean)}"
    )


def _etoro(symbol: str, **_) -> str:
    """eToro market page."""
    clean = symbol.replace(".AX", "").replace("-USD", "").upper()
    return f"https://www.etoro.com/markets/{url_quote(clean.lower())}"


def _binance(symbol: str, **_) -> str:
    """Binance spot trading pair."""
    base = symbol.replace("-USD", "").replace("-USDT", "").upper()
    return f"https://www.binance.com/en/trade/{url_quote(base)}_USDT"


def _webull(symbol: str, **_) -> str:
    """Webull quote page."""
    clean = symbol.replace(".AX", "").replace("-USD", "").upper()
    return f"https://www.webull.com/quote/{url_quote(clean.lower())}"


def _tiger(symbol: str, **_) -> str:
    """Tiger Brokers trade page."""
    clean = symbol.replace(".AX", "").replace("-USD", "").upper()
    return f"https://www.tigerbrokers.com.au/trade/{url_quote(clean)}"


BROKER_GENERATORS: dict[str, callable] = {
    "stake": _stake,
    "commsec": _commsec,
    "selfwealth": _selfwealth,
    "kraken": _kraken,
    "coinbase": _coinbase,
    "interactive_brokers": _interactive_brokers,
    "etoro": _etoro,
    "binance": _binance,
    "webull": _webull,
    "tiger": _tiger,
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/brokers")
async def list_brokers(_: User = Depends(get_current_user)):
    """List all supported brokers."""
    return {
        "brokers": [
            {"name": "stake", "display": "Stake AU", "asset_types": ["stocks", "us_stocks"]},
            {"name": "commsec", "display": "CommSec", "asset_types": ["asx"]},
            {"name": "selfwealth", "display": "SelfWealth", "asset_types": ["asx"]},
            {"name": "kraken", "display": "Kraken", "asset_types": ["crypto"]},
            {"name": "coinbase", "display": "Coinbase", "asset_types": ["crypto"]},
            {"name": "interactive_brokers", "display": "Interactive Brokers", "asset_types": ["stocks", "asx", "crypto"]},
            {"name": "etoro", "display": "eToro", "asset_types": ["stocks", "crypto"]},
            {"name": "binance", "display": "Binance", "asset_types": ["crypto"]},
            {"name": "webull", "display": "Webull", "asset_types": ["stocks"]},
            {"name": "tiger", "display": "Tiger Brokers", "asset_types": ["stocks", "asx"]},
        ]
    }


@router.get("/{broker}")
async def generate_deep_link(
    broker: str,
    symbol: str = Query(..., description="Ticker symbol, e.g. AAPL, BHP.AX, BTC-USD"),
    action: str = Query("buy", description="buy or sell"),
    price: Optional[float] = Query(None, description="Suggested price (informational only)"),
    quantity: Optional[float] = Query(None, description="Suggested quantity"),
    _: User = Depends(get_current_user),
):
    """
    Generate a pre-filled broker deep link URL.

    iTrade does NOT execute trades. This URL simply opens the broker's
    app or web interface so the user can manually review and place the order.
    """
    broker = broker.lower()
    if broker not in BROKER_GENERATORS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Broker '{broker}' is not supported. "
                f"Available: {', '.join(sorted(BROKER_GENERATORS.keys()))}"
            ),
        )

    if action.lower() not in {"buy", "sell"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="action must be 'buy' or 'sell'.",
        )

    generator = BROKER_GENERATORS[broker]
    url = generator(symbol=symbol.upper(), action=action, price=price, quantity=quantity)

    return {
        "broker": broker,
        "symbol": symbol.upper(),
        "action": action.lower(),
        "price": price,
        "quantity": quantity,
        "url": url,
        "disclaimer": (
            "iTrade generates signals only. This link opens your broker app "
            "so you can review and manually place the trade yourself."
        ),
    }
