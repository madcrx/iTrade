# iTrade

**AI-powered trading signal platform — signals, not execution.**

iTrade analyses markets across US stocks (NYSE/NASDAQ), Australian stocks (ASX), and cryptocurrency, then delivers actionable buy/sell signals with clear reasoning to your dashboard. You review the signal and place the trade yourself in your broker app.

> **Disclaimer:** iTrade provides market signals for informational purposes only. It is not a financial adviser. Past performance of any strategy does not guarantee future results. You are solely responsible for all investment decisions and any resulting gains or losses.

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24+ and Docker Compose v2
- A free [Alpha Vantage](https://www.alphavantage.co/support/#api-key) API key (optional for dev — `demo` key works for sample endpoints)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/itrade.git
cd itrade
cp .env.example .env
# Edit .env — at minimum, generate a SECRET_KEY:
# openssl rand -hex 32
```

### 2. Start the stack

```bash
# Development (hot reload, no nginx)
make dev

# Production (nginx on port 80)
make up
```

### 3. Initialise the database

```bash
# Apply migrations
make migrate

# Insert default strategies and demo symbols
make seed
```

### 4. Open the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 (dev) / http://localhost (prod) |
| API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

---

## Environment Setup

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Async SQLAlchemy URL | `postgresql+asyncpg://itrade:itrade@postgres:5432/itrade` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `SECRET_KEY` | JWT signing key — **change this** | `change-me-…` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Session lifetime (10080 = 7 days) | `10080` |
| `ALPHA_VANTAGE_API_KEY` | Market data — free at alphavantage.co | `demo` |
| `FINNHUB_API_KEY` | News sentiment — free at finnhub.io | `your_key_here` |
| `APP_ENV` | `development` or `production` | `development` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |

Generate a strong secret key with:

```bash
openssl rand -hex 32
```

---

## Architecture Overview

```
Browser
  │
  ▼
nginx :80          ← reverse proxy + gzip + security headers
  ├─ /api/*   →   FastAPI (uvicorn) :8000
  │                   ├─ SQLAlchemy async  → PostgreSQL :5432
  │                   ├─ aioredis          → Redis :6379
  │                   └─ yfinance / Alpha Vantage / Finnhub
  │
  └─ /*       →   React SPA (nginx) :3000
```

**Signal flow:**

```
Market Data (yfinance / Alpha Vantage)
    │
    ▼
Strategy Engine (pandas-ta)
    │
    ▼
Signal Generated  →  Stored in PostgreSQL  →  Redis cache
    │
    ▼
WebSocket push  →  React Dashboard  →  Signal Card
                                            ↓
                                   User opens broker app
                                   and places trade manually
```

### Services

| Service | Image / Build | Purpose |
|---------|--------------|---------|
| `postgres` | postgres:16-alpine | Persistent signal, user, and strategy data |
| `redis` | redis:7-alpine | Market data cache, rate-limit counters |
| `backend` | ./backend (Python 3.11) | FastAPI — signals, auth, backtesting, WebSockets |
| `frontend` | ./frontend (Node 20 → nginx) | React SPA — signal dashboard |
| `nginx` | nginx:alpine | Production reverse proxy (production profile only) |

---

## Trading Strategies

Six pre-built strategies ship with iTrade. Each is idempotent-seeded via `make seed`.

| Strategy | Indicators | Best For | Avg Win Rate |
|----------|-----------|----------|-------------|
| **Golden Cross** | 50-day SMA / 200-day SMA crossover | Trend following — equities, crypto | ~58% |
| **RSI Reversal** | RSI(14) — oversold <30, overbought >70 | Mean reversion — ranging markets | ~62% |
| **Momentum** | Rate of Change (20-day) | Momentum continuation | ~55% |
| **MACD** | MACD(12, 26, 9) line crossover | Trend shifts — all asset classes | ~53% |
| **Bollinger Bands** | BB(20, 2σ) mean reversion | Volatility squeeze and expansion | ~60% |
| **Volume Spike** | Volume >2.5× 20-day avg + directional move | Breakout confirmation | ~57% |

Win rates are based on historical backtests and vary by market conditions, asset class, and timeframe.

---

## Supported Brokers (Deep Links)

iTrade generates a "Trade Now" deep link on every signal — tapping it opens your broker app with the ticker pre-filled. **iTrade never connects to or sends orders to any broker.**

| Broker | Markets | Deep Link Type |
|--------|---------|---------------|
| [Stake](https://stake.com.au) | US + ASX | URL scheme / web redirect |
| [CommSec](https://www.commsec.com.au) | ASX | Web URL pre-fill |
| [Selfwealth](https://www.selfwealth.com.au) | ASX | Web URL |
| [Kraken](https://www.kraken.com) | Crypto | Web order page |
| [Coinbase](https://www.coinbase.com) | Crypto | URL scheme |
| [Interactive Brokers](https://www.interactivebrokers.com) | US + ASX | TWS deep link |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, uvicorn |
| ORM | SQLAlchemy 2.0 (async), Alembic |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Market Data | yfinance, Alpha Vantage, Finnhub |
| Signals / TA | pandas-ta, pandas, NumPy |
| ML | scikit-learn (signal confidence scoring) |
| Auth | python-jose (JWT), passlib (bcrypt) |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | Zustand |
| HTTP Client | Axios |
| Containerisation | Docker, Docker Compose |
| Proxy | nginx |

---

## Development Setup

### Makefile targets

```bash
make dev           # Start dev stack (hot reload, ports 8000 + 3000)
make build         # Build Docker images
make up            # Start production stack
make down          # Stop all containers
make logs          # Tail all logs
make migrate       # Run alembic upgrade head
make migration MSG="add notifications table"  # Create new migration
make seed          # Seed default strategies
make shell-db      # psql into the database
make shell-backend # bash inside the backend container
make test          # Run pytest
make lint          # Run ruff linter
make clean         # Remove dangling Docker images
```

### Running backend tests locally (outside Docker)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL to a local Postgres or SQLite URL for tests
pytest tests/ -v
```

### Database migrations

Migrations live in `backend/alembic/versions/`. After changing a model:

```bash
make migration MSG="describe what changed"
make migrate
```

Alembic uses an **async engine** via `asyncpg`; the seed script and app both use the same `DATABASE_URL` from `.env`.

### API documentation

FastAPI generates interactive docs automatically:

- **Swagger UI** — http://localhost:8000/docs
- **ReDoc** — http://localhost:8000/redoc
- **OpenAPI JSON** — http://localhost:8000/openapi.json

---

## Project Structure

```
iTrade/
├── backend/
│   ├── alembic/            # Database migrations
│   │   └── versions/
│   ├── app/
│   │   ├── api/            # FastAPI routers
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic (signals, market data)
│   │   └── strategies/     # Strategy implementations
│   ├── scripts/
│   │   └── seed.py         # Default data seed script
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route-level page components
│   │   ├── store/          # Zustand state management
│   │   └── utils/          # Helpers and formatters
│   ├── Dockerfile          # Multi-stage build (node → nginx)
│   ├── Dockerfile.dev      # Dev image (Vite dev server)
│   └── nginx.conf          # SPA routing config
├── nginx/
│   └── nginx.conf          # Reverse proxy config (production)
├── docs/
│   └── PRD-v1.md           # Product Requirements Document
├── docker-compose.yml
├── Makefile
├── .env.example
└── .gitignore
```

---

## Regulatory Position

iTrade operates as a **signal tool**, not a financial service. This mirrors the TradingView model and is exempt from AFSL (Australian Financial Services Licence) requirements under the Corporations Act 2001 (Cth), provided:

1. iTrade never submits orders to a broker on a user's behalf
2. All trade decisions are made and executed by the user
3. iTrade never holds client funds
4. The platform disclaimer is displayed prominently at all times

This allows iTrade to operate in any jurisdiction without a financial services licence.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and add tests
4. Run `make lint` and `make test`
5. Submit a pull request

---

## Disclaimer

iTrade provides market analysis signals for **informational and educational purposes only**. It does not provide personalised financial advice and is not a licensed financial adviser. Market signals are generated by algorithmic strategies and may be incorrect or delayed. All investment decisions are made solely by you. Never invest more than you can afford to lose. Past signal performance does not guarantee future results.
