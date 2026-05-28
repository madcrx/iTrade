# iTrade — Product Requirements Document
**Version**: 1.0 (Draft for Review)
**Date**: 2026-05-28
**Status**: Awaiting Stakeholder Approval

---

## 1. Executive Summary

iTrade is an AI-powered automated trading platform that executes trades across US stocks (NYSE/NASDAQ), Australian stocks (ASX), and cryptocurrency. Users can start with as little as $20, with the platform handling strategy selection, backtesting, and automated execution. The product is built in phases — starting with a fast, demonstrable MVP and progressively adding complexity.

**North Star Metric**: A new user can connect a paper trading account, run a backtest on a strategy, and see simulated P&L within 10 minutes of signing up.

---

## 2. Problem Statement

Retail investors want to participate in automated, algorithm-driven trading but face three barriers:
1. **High capital requirements** — most platforms require $500–$2,000 to get started
2. **Technical complexity** — setting up trading bots requires coding knowledge
3. **Fragmentation** — separate tools exist for stocks, ASX, and crypto with no unified interface

**Benchmark**: Finelo focuses on trading education with a $1,000 simulated account but offers no real automation. iTrade fills the gap with AI-driven execution from a $20 entry point.

---

## 3. Target Users

| Persona | Description | Starting Capital |
|---------|-------------|-----------------|
| **Curious Beginner** | Wants to learn automated trading safely | $0 (paper trading) |
| **Small Retail Investor** | Has $20–$500, wants algorithmic assistance | $20–$500 |
| **ASX Investor** | Australian investor wanting automation | $20+ AUD |
| **Crypto Trader** | Wants bot-assisted crypto strategies | $20+ |
| **Experienced Trader** | Wants to backtest and deploy custom strategies | $500+ |

---

## 4. Key Features by Phase

---

### Phase 1 — MVP (Weeks 1–8)
**Theme: "See it work before you invest a cent"**

**Goal**: Paper trading with 3 pre-built strategies, backtesting, and a clean dashboard.

#### 4.1 Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Paper Trading Account | Connect Alpaca paper account; simulate trades with real market data | P0 |
| Strategy Library (3 strategies) | Golden Cross, RSI Reversal, Simple Momentum | P0 |
| Backtesting Engine | Run any strategy against 2 years of historical data; show P&L, Sharpe ratio, max drawdown | P0 |
| Dashboard | Portfolio overview, open positions, trade history, performance chart | P0 |
| Strategy Activation | Toggle a strategy on/off; set risk level (conservative/moderate/aggressive) | P0 |
| Market Data Feed | Real-time + historical quotes for US stocks | P0 |
| User Authentication | Email/password sign-up, JWT sessions | P1 |
| Notifications | Email/in-app alerts on trade execution | P1 |

#### 4.2 Trading Strategies (Phase 1)

1. **Golden Cross / Dead Cross** — 50-day SMA crosses above/below 200-day SMA
2. **RSI Reversal** — Buy when RSI < 30 (oversold), sell when RSI > 70 (overbought)
3. **Momentum (ROC-based)** — Enter when Rate of Change exceeds threshold over N periods

#### 4.3 Tech Stack (Phase 1)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Broker (US paper) | **Alpaca API** | Free paper trading, commission-free, no minimum |
| Backtesting | **Lumibot** | Unified backtest→live codebase, MIT license, beginner-friendly |
| Market Data | **yfinance** + **Alpha Vantage** (free tier) | Zero cost for MVP; Alpha Vantage for reliability |
| Indicators | **pandas-ta** | 150+ indicators, no C dependency, MIT license |
| Backend | **Python + FastAPI** | Lightweight, async, Python-native for trading libs |
| Database | **PostgreSQL** | Trade history, user settings, backtest results |
| Frontend | **React + Recharts** | Performance charts, responsive dashboard |
| Hosting | **Docker + VPS** ($5–10/month) | Simple deployment |

#### 4.4 Phase 1 Success Criteria
- User can run a backtest in < 30 seconds
- Paper trading executes within 5 seconds of signal
- Dashboard loads in < 2 seconds
- 3 strategies available and documented

---

### Phase 1B — Real Money Entry (Weeks 9–12)
**Theme: "Go live with $20"**

**Goal**: Enable real trades on US stocks and ASX via Stake; add risk management.

#### Features Added

| Feature | Description | Priority |
|---------|-------------|----------|
| Stake Broker Integration | Connect Stake account for US + ASX live trading | P0 |
| Position Sizing | Kelly Criterion, fixed-fraction, or fixed-dollar sizing | P0 |
| Stop-Loss / Take-Profit | Configurable per strategy | P0 |
| Live P&L Tracking | Real-time portfolio value vs. cost basis | P0 |
| ASX Stock Support | Search and trade ASX-listed securities | P1 |
| Risk Dashboard | Max drawdown, daily loss limit, exposure per sector | P1 |
| Deposit/Withdraw Alerts | Notify user when broker balance changes | P2 |

#### ASX Notes
- Stake charges flat $3 AUD per trade — optimal for small accounts
- Minimum practical trade: ~$20 AUD (fractional shares where available)
- Data source: yfinance daily data (15-min delay acceptable for Phase 1B)

#### Phase 1B Success Criteria
- Live order placed and confirmed within 10 seconds of signal
- Stop-loss triggers correctly in backtests and paper tests
- ASX and US portfolios shown on single dashboard

---

### Phase 2 — Crypto + AI Signals (Weeks 13–20)
**Theme: "More assets, smarter signals"**

| Feature | Description |
|---------|-------------|
| Crypto Trading | Binance + Kraken integration (spot); $20 minimum viable |
| Freqtrade Integration | Run Freqtrade strategies as crypto sub-engine |
| Sentiment Analysis | Finnhub news sentiment as signal confirmation layer |
| MACD + Bollinger Bands | Add 2 more strategy templates |
| DCA Automation | Dollar-cost averaging bot for any asset |
| ML Classifier (Beta) | scikit-learn Random Forest: predict next-day direction |
| Strategy Marketplace | Users can share/clone community strategies |
| Mobile-Responsive UI | Full functionality on mobile browser |

---

### Phase 3 — Advanced AI + Institutional (Month 6+)
**Theme: "Institutional-grade for retail"**

| Feature | Description |
|---------|-------------|
| Reinforcement Learning Agent | FinRL-based DRL agent (PPO/DDPG) for portfolio management |
| Interactive Brokers Integration | Options, futures, advanced order types ($500+ accounts) |
| QuantConnect Lean Backtesting | Walk-forward testing, Monte Carlo simulation |
| Pairs Trading | Cointegration-based market-neutral strategies |
| Multi-Strategy Portfolio | Allocate capital across multiple concurrent strategies |
| OpenBB Data Layer | Institutional-grade fundamental + alternative data |
| Subscription Tiers | Freemium → Pro ($19/month) → Institutional ($99/month) |

---

## 5. Broker & API Integration Summary

### Recommended Broker Stack

| Phase | Broker | Market | Min Capital | Notes |
|-------|--------|--------|-------------|-------|
| Phase 1 | **Alpaca** | US Stocks | $0 (paper) | Best MVP broker; paper trading unlimited |
| Phase 1B | **Stake** | US + ASX | ~$20 | Flat $3/trade; community Python wrapper |
| Phase 2 | **Binance / Kraken** | Crypto | ~$20 | 0.1–0.26% fees; robust APIs |
| Phase 3 | **Interactive Brokers** | Multi-asset | $500 | Options, futures, advanced execution |

### Market Data Stack

| Provider | Cost | Use |
|----------|------|-----|
| yfinance | Free | MVP historical data (unofficial; prototype only) |
| Alpha Vantage | Free / $25+/month | Production stock data; 50+ indicators |
| Finnhub | Free (60 req/min) | News sentiment, real-time quotes |
| Polygon.io | Free tier / $199+/month | Tick data for Phase 3 |
| CoinGecko | Free | Crypto prices (Phase 2) |

---

## 6. Algorithm Library

### Phase 1 (Launch)
| Strategy | Logic | Asset Class |
|----------|-------|-------------|
| Golden Cross | 50 SMA crosses above 200 SMA → BUY | US Stocks, ASX |
| RSI Reversal | RSI < 30 → BUY; RSI > 70 → SELL | Stocks, Crypto |
| ROC Momentum | Price change rate exceeds N% in M days | US Stocks |

### Phase 2 (Expansion)
| Strategy | Logic | Asset Class |
|----------|-------|-------------|
| MACD Crossover | Signal line cross on MACD histogram | Stocks, Crypto |
| Bollinger Band Mean Reversion | Price touches lower/upper band | Stocks, Crypto |
| DCA Bot | Fixed-interval purchases regardless of price | Any |
| Sentiment Signal | News sentiment score > threshold → confirm trade | Stocks |
| ML Direction Classifier | Random Forest predicts up/down next day | Stocks |

### Phase 3 (Advanced)
| Strategy | Logic | Asset Class |
|----------|-------|-------------|
| Pairs Trading | Cointegrated pair diverges → mean revert | Stocks |
| RL Agent (PPO) | DRL agent maximises risk-adjusted return | Multi-asset |
| Ensemble Voting | Majority vote across 3+ strategies | Multi-asset |

---

## 7. Open Source Components

| Library | License | Purpose |
|---------|---------|---------|
| Lumibot | MIT | Backtesting + live trading framework |
| pandas-ta | MIT | Technical indicator calculation |
| Freqtrade | GPL-3.0 | Crypto strategy sub-engine (Phase 2) |
| FinRL | Apache-2.0 | Reinforcement learning agents (Phase 3) |
| Hummingbot | Apache-2.0 | Market making / crypto (Phase 3 option) |
| OctoBot | Public source | Alt crypto UI (Phase 2 option) |
| stable-baselines3 | MIT | RL algorithm library |
| scikit-learn | BSD | ML classifiers (Phase 2) |

---

## 8. Risk Management Requirements

- **Daily Loss Limit**: Platform-enforced maximum daily loss (configurable, default 2%)
- **Position Sizing**: No single position > 10% of portfolio by default
- **Stop-Loss**: Mandatory stop-loss on all live strategies
- **Circuit Breaker**: Auto-pause all strategies if daily loss limit hit
- **Paper Before Live**: User must run strategy in paper mode for ≥ 7 days before enabling live
- **Regulatory Disclaimer**: Clear messaging that iTrade is not financial advice; past performance ≠ future results
- **Data Privacy**: No storage of broker credentials in plaintext (OAuth / API key vault)

---

## 9. Cost Model

### Phase 1 Operating Costs (Monthly)
| Item | Cost |
|------|------|
| VPS hosting (2 vCPU, 4GB RAM) | $10–20/month |
| Alpha Vantage free tier | $0 |
| Alpaca (paper) | $0 |
| Domain + SSL | ~$2/month amortised |
| **Total** | **$12–22/month** |

### Phase 1B–2 Operating Costs (Monthly)
| Item | Cost |
|------|------|
| Alpha Vantage premium | $25/month |
| Finnhub free tier | $0 |
| Stake trades (100/month est.) | $300/year ($25/month) |
| VPS upgrade | $20–40/month |
| **Total** | **$70–90/month** |

### Revenue Model (Phase 2+)
| Tier | Price | Features |
|------|-------|---------|
| Free | $0 | Paper trading, 3 strategies, backtesting |
| Pro | $19/month | Live trading, all strategies, sentiment signals, priority support |
| Institutional | $99/month | ML strategies, RL agents, multi-broker, API access |

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| API response time | < 500ms for data queries |
| Order execution latency | < 5 seconds signal-to-order |
| Uptime | 99.5% (Phase 1), 99.9% (Phase 2+) |
| Backtest speed | Complete 2-year backtest in < 30 seconds |
| Data retention | Trade history retained indefinitely |
| Security | OWASP Top 10 compliance; API keys encrypted at rest |

---

## 11. Out of Scope (Phase 1)

- Options trading
- Leverage / margin trading
- Tax reporting / ATO integration
- Social / copy trading features
- Mobile native app (iOS/Android)
- Fractional ASX shares
- Real-time Level 2 order book data

---

## 12. Open Questions for Stakeholder Review

1. **ASX real-time data**: Stake's community wrapper (stake-python) has no SLA. Accept 15-min delayed data for Phase 1B, or fund a paid ASX data feed from day one?
2. **$20 minimum viability**: Stake's $3 flat fee = 15% cost on a $20 trade. Should we enforce a soft minimum of $50–$100 to protect users from fee erosion?
3. **Strategy building UI**: Phase 1 uses pre-built strategies. Should Phase 2 include a no-code strategy builder (drag-and-drop indicators), or code-first only?
4. **Regulatory position**: Will iTrade apply for an AFSL (Australian Financial Services Licence) or operate strictly as a tool (not an advisor)?
5. **Crypto exchange priority**: Binance vs Kraken for Phase 2 — Binance has more liquidity; Kraken has stronger regulatory standing in AU/US. Which to prioritise?

---

## 13. Phased Delivery Timeline

```
Week 1–2   : Backend scaffolding, FastAPI, PostgreSQL, Auth
Week 3–4   : Alpaca paper trading integration, order execution
Week 5–6   : Backtest engine (Lumibot), 3 strategies, pandas-ta indicators
Week 7–8   : Frontend dashboard, charts, strategy toggle UI
── Phase 1 MVP Launch ──────────────────────────────────────
Week 9–10  : Stake broker integration, live order flow
Week 11–12 : Risk management (stop-loss, position sizing, circuit breaker)
── Phase 1B Launch ─────────────────────────────────────────
Week 13–15 : Binance/Kraken crypto integration
Week 16–18 : Freqtrade sub-engine, DCA bot, 2 new strategies
Week 19–20 : Sentiment analysis (Finnhub), ML classifier (Beta)
── Phase 2 Launch ──────────────────────────────────────────
Month 6+   : FinRL RL agents, IBKR, QuantConnect, subscription billing
── Phase 3 Ongoing ─────────────────────────────────────────
```

---

*This PRD is a living document. All technical choices are recommendations pending stakeholder approval and further due diligence on regulatory obligations.*
