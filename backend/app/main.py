"""
iTrade FastAPI Application

An AI-powered trading signal platform. iTrade generates buy/sell signals
with human-readable reasoning; users manually place orders in their own
broker applications.

iTrade is a TOOL ONLY — no trade execution is performed.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import create_tables, AsyncSessionLocal

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise DB tables and seed default strategies on startup."""
    logger.info("iTrade backend starting up...")

    # Create tables (idempotent — skips existing tables)
    await create_tables()

    # Seed default strategies
    async with AsyncSessionLocal() as db:
        try:
            from app.services.signal_engine import seed_strategies
            await seed_strategies(db)
        except Exception as e:
            logger.error("Failed to seed strategies: %s", e)

    logger.info("iTrade backend ready.")
    yield
    logger.info("iTrade backend shutting down.")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="iTrade API",
    description=(
        "AI-powered trading signal platform. Generates BUY/SELL signals with "
        "human-readable reasoning. iTrade is a TOOL ONLY — no trades are executed."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from app.api.auth import router as auth_router
from app.api.signals import router as signals_router
from app.api.watchlist import router as watchlist_router
from app.api.strategies import router as strategies_router
from app.api.backtest import router as backtest_router
from app.api.portfolio import router as portfolio_router
from app.api.market_data import router as market_router
from app.api.deeplinks import router as deeplinks_router

app.include_router(auth_router)
app.include_router(signals_router)
app.include_router(watchlist_router)
app.include_router(strategies_router)
app.include_router(backtest_router)
app.include_router(portfolio_router)
app.include_router(market_router)
app.include_router(deeplinks_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"])
async def health():
    """Service health check."""
    return {"status": "ok", "service": "iTrade API", "version": "1.0.0"}


@app.get("/", tags=["root"])
async def root():
    """API root — links to documentation."""
    return {
        "message": "Welcome to the iTrade API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "disclaimer": (
            "iTrade is a signals tool only. "
            "Always do your own research before trading."
        ),
    }
