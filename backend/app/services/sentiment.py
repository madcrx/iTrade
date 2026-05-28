"""
Sentiment service — fetches news sentiment from Finnhub.

Returns a list of news items with sentiment scores and an aggregate
sentiment summary for a given symbol.
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta
from typing import Optional

import httpx

from app.core.config import settings

# ---------------------------------------------------------------------------
# Simple TTL cache
# ---------------------------------------------------------------------------

_sentiment_cache: dict[str, tuple[float, object]] = {}
SENTIMENT_CACHE_TTL = 1800  # 30 minutes


def _cache_get(key: str) -> Optional[object]:
    if key not in _sentiment_cache:
        return None
    expires_at, value = _sentiment_cache[key]
    if time.monotonic() > expires_at:
        del _sentiment_cache[key]
        return None
    return value


def _cache_set(key: str, value: object) -> None:
    _sentiment_cache[key] = (time.monotonic() + SENTIMENT_CACHE_TTL, value)


# ---------------------------------------------------------------------------
# Finnhub API helpers
# ---------------------------------------------------------------------------

FINNHUB_BASE = "https://finnhub.io/api/v1"


async def get_news_sentiment(symbol: str) -> dict:
    """
    Fetch recent news and aggregate sentiment for `symbol`.

    Returns a dict:
    {
      "symbol": str,
      "sentiment_score": float,    # -1 (very negative) to +1 (very positive)
      "sentiment_label": str,      # "bullish" | "neutral" | "bearish"
      "buzz": int,                  # number of articles in past 7 days
      "articles": [
        {
          "headline": str,
          "source": str,
          "url": str,
          "published_at": str,
          "sentiment": float,
        }
      ]
    }
    """
    cache_key = f"sentiment:{symbol.upper()}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    result = await _fetch_finnhub_sentiment(symbol)
    if result is None:
        result = _neutral_sentiment(symbol)

    _cache_set(cache_key, result)
    return result


async def _fetch_finnhub_sentiment(symbol: str) -> Optional[dict]:
    if not settings.FINNHUB_API_KEY:
        return None

    headers = {"X-Finnhub-Token": settings.FINNHUB_API_KEY}
    today = datetime.utcnow()
    week_ago = today - timedelta(days=7)

    # News endpoint
    news_params = {
        "symbol": symbol,
        "from": week_ago.strftime("%Y-%m-%d"),
        "to": today.strftime("%Y-%m-%d"),
    }

    # Sentiment endpoint (company news sentiment)
    sentiment_params = {"symbol": symbol}

    try:
        async with httpx.AsyncClient(timeout=10, headers=headers) as client:
            news_resp, sent_resp = await asyncio.gather(
                client.get(f"{FINNHUB_BASE}/company-news", params=news_params),
                client.get(f"{FINNHUB_BASE}/news-sentiment", params=sentiment_params),
                return_exceptions=True,
            )
    except Exception:
        return None

    articles = []
    if not isinstance(news_resp, Exception) and news_resp.status_code == 200:
        raw_news = news_resp.json()
        for item in raw_news[:10]:  # cap at 10 articles
            articles.append({
                "headline": item.get("headline", ""),
                "source": item.get("source", ""),
                "url": item.get("url", ""),
                "published_at": datetime.utcfromtimestamp(
                    item.get("datetime", 0)
                ).isoformat() if item.get("datetime") else "",
                "sentiment": None,  # individual sentiment not from this endpoint
            })

    sentiment_score = 0.0
    buzz = len(articles)

    if not isinstance(sent_resp, Exception) and sent_resp.status_code == 200:
        sent_data = sent_resp.json()
        sentiment_score = float(
            sent_data.get("companyNewsScore", 0)
            or sent_data.get("buzz", {}).get("articlesInLastWeek", 0) * 0
        )
        buzz_data = sent_data.get("buzz", {})
        buzz = int(buzz_data.get("articlesInLastWeek", buzz))
        sent_score = sent_data.get("sentiment", {})
        if isinstance(sent_score, dict):
            bearish = float(sent_score.get("bearishPercent", 0))
            bullish = float(sent_score.get("bullishPercent", 0))
            sentiment_score = bullish - bearish  # range: -1 to +1

    if sentiment_score > 0.1:
        label = "bullish"
    elif sentiment_score < -0.1:
        label = "bearish"
    else:
        label = "neutral"

    return {
        "symbol": symbol.upper(),
        "sentiment_score": round(sentiment_score, 4),
        "sentiment_label": label,
        "buzz": buzz,
        "articles": articles,
    }


def _neutral_sentiment(symbol: str) -> dict:
    return {
        "symbol": symbol.upper(),
        "sentiment_score": 0.0,
        "sentiment_label": "neutral",
        "buzz": 0,
        "articles": [],
    }


# asyncio.gather needs asyncio imported
import asyncio  # noqa: E402 — placed here to avoid circular-like import issues
