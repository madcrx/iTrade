# iTrade — Product Requirements Document
**Version**: 2.0
**Date**: 2026-05-28
**Status**: Awaiting Stakeholder Approval

---

## 1. Executive Summary

iTrade is an AI-powered trading signal and strategy platform. It analyses markets across US stocks (NYSE/NASDAQ), Australian stocks (ASX), and cryptocurrency, then delivers actionable buy/sell signals to users. The user reviews the signal and places the order themselves in their own broker or exchange app.

iTrade does **not** execute trades. This is a deliberate product and regulatory decision — the platform operates as a tool, not a financial service, placing it outside the scope of AFSL (Australian Financial Services Licence) requirements.

Users can start with as little as $20. The value proposition is *intelligence and insight*, not automation: better signals, clear reasoning, and educational context around every recommendation.

**North Star Metric**: A new user can run a backtest, receive their first live signal with clear buy/sell rationale, and place their first trade (manually) within 15 minutes of signing up.

---

## 2. The Tool-Only Model — What This Means

### What iTrade Does
| Action | iTrade Does This? |
|--------|-----------------|
| Analyse market data | ✅ Yes |
| Run backtests on strategies | ✅ Yes |
| Generate buy/sell signals with reasoning | ✅ Yes |
| Display signals, charts, and performance metrics | ✅ Yes |
| Send push/email alerts when a signal fires | ✅ Yes |
| Simulate paper trades (educational, no real money) | ✅ Yes |
| Place orders in a broker on the user's behalf | ❌ No |
| Hold client funds | ❌ No |
| Provide personalised financial advice | ❌ No |

### Regulatory Position
Operating as a signal/tool platform (no execution) mirrors the TradingView model and is **exempt from AFSL requirements** under the Corporations Act 2001 (Cth), provided:
1. iTrade never submits orders to a broker
2. All trade decisions are made and executed by the user
3. Prominent disclaimer is displayed at all times: *"iTrade provides market signals for informational purposes only. It is not a financial adviser. You are solely responsible for all investment decisions."*
4. iTrade never holds client funds

This model allows iTrade to launch with no regulatory licence, in any jurisdiction, immediately.

---

## 3. Problem Statement

Retail investors want data-driven signals to guide their trades but face three barriers:
1. **Signal noise** — too many conflicting indicators; no clear, reasoned recommendation
2. **Complexity** — understanding when and why to trade requires technical knowledge most users lack
3. **Fragmentation** — separate tools exist for stocks, ASX, and crypto; no unified signal dashboard

**Benchmark**: Finelo focuses on trading education with a simulated account but offers no real-time signals or strategy intelligence. TradingView provides charts but requires users to build their own strategies. iTrade fills the gap: pre-built AI strategies that explain *why* a signal fired, across stocks, ASX, and crypto, from a $20 entry point.

---

## 4. Target Users

| Persona | Description | Starting Capital |
|---------|-------------|-----------------|
| **Curious Beginner** | Wants guided, explained signals before committing real money | $0 (paper simulation) |
| **Small Retail Investor** | Has $20–$500; wants AI-backed signals to inform manual trades | $20–$500 |
| **ASX Investor** | Australian investor wanting strategy-backed signals for ASX stocks | $20+ AUD |
| **Crypto Trader** | Wants systematic signals for crypto entries/exits | $20+ |
| **Experienced Trader** | Wants to backtest and customise signal strategies | $500+ |

---

## 5. Key Features by Phase

---

### Phase 1 — MVP (Weeks 1–8)
**Theme: "See signals work before you invest a cent"**

**Goal**: Paper simulation with 3 pre-built strategies, backtesting engine, and a signal dashboard. No real money, no broker connection required.

#### 5.1 Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Signal Dashboard | Live feed of buy/sell signals per strategy; shows asset, signal type, price at signal, confidence level | P0 |
| Signal Explanation | Each signal shows *why* it fired: which indicator triggered, historical hit rate, supporting data | P0 |
| Strategy Library (3 strategies) | Golden Cross, RSI Reversal, Simple Momentum | P0 |
| Backtesting Engine | Run any strategy against 2 years of historical data; show P&L, Sharpe ratio, max drawdown, win rate | P0 |
| Paper Simulation | Track signals as if user followed them; show hypothetical portfolio performance without real money | P0 |
| Watchlist | User adds stocks/crypto to watch; strategies run against watchlist assets | P0 |
| Market Data Feed | Real-time + historical quotes for US stocks | P0 |
| User Authentication | Email/password sign-up, JWT sessions | P1 |
| Signal Alerts | Email/push notification when a signal fires on a watched asset | P1 |

#### 5.2 Signal Flow (How It Works)
```
Market Data → Strategy Engine → Signal Generated → User Notified
                                      ↓
                             Signal Card shows:
                             • Asset: BHP.AX
                             • Action: BUY
                             • Reason: RSI crossed below 30 (oversold)
                             • Entry price: $42.30
                             • Suggested stop-loss: $40.10 (-5%)
                             • Suggested take-profit: $46.50 (+10%)
                             • Backtest win rate: 64% over 2 years
                                      ↓
                             User opens their broker app and places the order
```

#### 5.3 Trading Strategies (Phase 1)

1. **Golden Cross / Dead Cross** — 50-day SMA crosses above/below 200-day SMA
2. **RSI Reversal** — Signal fires when RSI < 30 (buy) or RSI > 70 (sell)
3. **Momentum (ROC-based)** — Signal fires when Rate of Change exceeds threshold over N periods

#### 5.4 Tech Stack (Phase 1)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Market Data | **yfinance** + **Alpha Vantage** (free tier) | Zero cost for MVP; Alpha Vantage for production reliability |
| Strategy Engine | **pandas-ta** + custom Python | 150+ indicators; no C dependency; MIT license |
| Backtesting | **Backtrader** or **Lumibot** | Backtest strategies against historical data |
| Backend | **Python + FastAPI** | Lightweight, async, Python-native |
| Database | **PostgreSQL** | Signal history, user watchlists, backtest results |
| Frontend | **React + Recharts** | Signal cards, performance charts, responsive dashboard |
| Hosting | **Docker + VPS** ($5–10/month) | Simple deployment |
| Alerts | **Email (SMTP) + Web Push** | Signal notifications |

#### 5.5 Phase 1 Success Criteria
- Backtest completes in < 30 seconds
- Signal generated within 60 seconds of market data update
- Signal card clearly explains why the signal fired
- Dashboard loads in < 2 seconds
- 3 strategies running against user watchlist

---

### Phase 1B — Live Signals + Broker Deep Links (Weeks 9–12)
**Theme: "From signal to trade in 3 taps"**

**Goal**: Connect to real market data for ASX + US, add deep-link buttons so users can jump directly from a signal into their broker app pre-filled with the trade details.

#### Features Added

| Feature | Description | Priority |
|---------|-------------|----------|
| Broker Deep Links | "Trade Now" button opens user's broker app (Stake, CommSec, Selfwealth, Kraken) pre-filled with ticker + suggested size | P0 |
| ASX Stock Signals | Strategies run against ASX-listed securities; 15-min delayed data | P0 |
| Crypto Signals | Strategies run against BTC, ETH, top 20 crypto via CoinGecko data | P0 |
| Portfolio Tracker | User manually logs executed trades; iTrade tracks P&L against signals | P1 |
| Signal History | Full log of all signals fired, whether user acted, and outcome | P1 |
| Risk Context | Each signal shows suggested position size (as % of portfolio) and stop-loss | P1 |
| Performance Scorecard | Tracks how well each strategy is performing in real market conditions | P1 |

#### Broker Deep Link Implementation
Deep links open the broker app with trade pre-populated — user still taps "confirm" in their app. No API connection to the broker. No AFSL exposure.

| Broker | Deep Link Support | Market |
|--------|-----------------|--------|
| Stake | URL scheme + web redirect | US + ASX |
| CommSec | Web URL pre-fill | ASX |
| Kraken | Web order page pre-fill | Crypto |
| Coinbase | URL scheme | Crypto |
| Interactive Brokers | TWS deep link | US + ASX |

#### Phase 1B Success Criteria
- ASX and crypto signals firing correctly
- "Trade Now" deep link tested on 5+ brokers
- Portfolio tracker accurately reflects manually logged trades
- Signal accuracy (backtest vs live) reported on scorecard

---

### Phase 2 — AI Signals + No-Code Strategy Builder (Weeks 13–20)
**Theme: "Build your own signal engine"**

| Feature | Description |
|---------|-------------|
| No-Code Strategy Builder | Drag-and-drop indicator blocks (RSI, MACD, Bollinger, SMA, volume) to build custom signal rules |
| More Strategies | MACD Crossover, Bollinger Band Mean Reversion, DCA timing signals |
| Sentiment Signals | Finnhub news sentiment as a signal confirmation layer ("signal + positive news = stronger conviction") |
| ML Direction Signal | Random Forest classifier: predicts next-day up/down probability as a signal confidence score |
| Strategy Marketplace | Users share and clone community-built strategies |
| Signal Strength Score | Composite score (1–10) combining technical, sentiment, and ML inputs |
| Mobile-Responsive UI | Full functionality on mobile browser |
| Crypto Signals Expansion | Kraken pairs, top 50 crypto assets |

---

### Phase 3 — Advanced AI + Institutional Signals (Month 6+)
**Theme: "Institutional-grade intelligence for retail"**

| Feature | Description |
|---------|-------------|
| RL-Based Signal Agent | FinRL-trained agent generates signals based on portfolio-level optimisation |
| Options Signal Layer | Signal for options plays (via IBKR deep links) — covered calls, protective puts |
| Pairs Trading Signals | Cointegration-based long/short signal pairs |
| Multi-Strategy Consensus | Signals only fire when 2+ strategies agree ("ensemble confirmation") |
| OpenBB Data Layer | Fundamental + alternative data (earnings, insider activity, macro) as signal inputs |
| Subscription Tiers | Freemium → Pro ($19/month) → Institutional ($99/month) |
| API Access | Developers can pull iTrade signals via REST API into their own tools |

---

## 6. Market Data & API Stack

| Provider | Cost | Use |
|----------|------|-----|
| yfinance | Free | MVP US historical data (unofficial; prototype only) |
| Alpha Vantage | Free / $25+/month | Production US stock data; 50+ indicators |
| Finnhub | Free (60 req/min) | News sentiment, real-time US quotes |
| CoinGecko | Free | Crypto prices (Phase 1B+) |
| yfinance (ASX) | Free | ASX 15-min delayed data (Phase 1B) |
| Polygon.io | $199+/month | Tick data if real-time precision required (Phase 3) |

---

## 7. Signal Strategy Library

### Phase 1 (Launch)
| Strategy | Signal Logic | Asset Class |
|----------|-------------|-------------|
| Golden Cross | 50 SMA crosses above 200 SMA → BUY signal | US Stocks, ASX |
| RSI Reversal | RSI < 30 → BUY signal; RSI > 70 → SELL signal | Stocks, Crypto |
| ROC Momentum | Price ROC exceeds N% over M days → BUY signal | US Stocks |

### Phase 1B (Expansion)
| Strategy | Signal Logic | Asset Class |
|----------|-------------|-------------|
| ASX Golden Cross | Same as Golden Cross applied to ASX securities | ASX |
| Crypto RSI | RSI applied to BTC/ETH/top 20 | Crypto |
| Volume Spike | Unusual volume + price direction → signal | US Stocks, ASX |

### Phase 2 (AI Layer)
| Strategy | Signal Logic | Asset Class |
|----------|-------------|-------------|
| MACD Crossover | Signal line cross on MACD histogram | Stocks, Crypto |
| Bollinger Mean Reversion | Price touches lower band → BUY signal | Stocks, Crypto |
| Sentiment Confirmation | Technical signal + positive/negative news → confirmed signal | Stocks |
| ML Classifier | Random Forest: probability > 65% up → BUY signal | Stocks |

### Phase 3 (Advanced)
| Strategy | Signal Logic | Asset Class |
|----------|-------------|-------------|
| Pairs Signal | Cointegrated pair diverges beyond 2σ → signal | Stocks |
| RL Portfolio Signal | DRL agent generates portfolio-level rebalance signals | Multi-asset |
| Ensemble Consensus | Signal fires only when 3+ strategies agree | Multi-asset |

---

## 8. Open Source Components

| Library | License | Purpose |
|---------|---------|---------|
| pandas-ta | MIT | Technical indicator calculation |
| Backtrader | GPL-3.0 | Backtesting engine |
| Lumibot | MIT | Alternative backtesting framework |
| scikit-learn | BSD | ML classifier for signal confidence (Phase 2) |
| FinRL | Apache-2.0 | RL-based signal generation (Phase 3) |
| stable-baselines3 | MIT | RL algorithm library (Phase 3) |

---

## 9. Risk & Disclaimer Requirements

- **Prominent Disclaimer**: Displayed on every signal card, dashboard header, and onboarding: *"iTrade provides market signals for informational purposes only. It is not a financial adviser. Past signal performance does not guarantee future results. You are solely responsible for all investment decisions."*
- **No Execution**: Platform must never submit an order to any broker or exchange. Deep links open the broker UI; the user presses confirm.
- **No Client Funds**: iTrade never holds, receives, or transfers user money.
- **Signal Accuracy Transparency**: Every strategy shows its historical backtest win rate and live performance so users can assess quality themselves.
- **Stop-Loss Guidance**: Every signal includes a suggested stop-loss level (informational only).
- **Paper Simulation First**: New users default to paper simulation mode; must actively switch to "Live Signal Mode."
- **Data Privacy**: No broker credentials stored; deep links use public URL schemes only.

---

## 10. Cost Model

### Phase 1 Operating Costs (Monthly)
| Item | Cost |
|------|------|
| VPS hosting (2 vCPU, 4GB RAM) | $10–20/month |
| Alpha Vantage free tier | $0 |
| Domain + SSL | ~$2/month amortised |
| **Total** | **$12–22/month** |

### Phase 1B–2 Operating Costs (Monthly)
| Item | Cost |
|------|------|
| Alpha Vantage premium | $25/month |
| Finnhub free tier | $0 |
| VPS upgrade | $20–40/month |
| **Total** | **$45–65/month** |

*Note: No brokerage costs — iTrade does not execute trades.*

### Revenue Model (Phase 2+)
| Tier | Price | Features |
|------|-------|---------|
| Free | $0 | 3 strategies, backtesting, paper simulation, basic signals |
| Pro | $19/month | All strategies, live signals, sentiment layer, ML confidence scores, deep links |
| Institutional | $99/month | Custom strategy builder, ensemble signals, API access, priority support |

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| API response time | < 500ms for data queries |
| Signal generation latency | < 60 seconds from market data update |
| Uptime | 99.5% (Phase 1), 99.9% (Phase 2+) |
| Backtest speed | Complete 2-year backtest in < 30 seconds |
| Data retention | Signal history retained indefinitely |
| Security | OWASP Top 10 compliance; no broker credentials stored |

---

## 12. Out of Scope (All Phases)

- Automated order execution (by design — tool-only model)
- Holding client funds
- Personalised financial advice
- Portfolio management on behalf of users
- Tax reporting / ATO integration
- Margin or leverage trading signals (Phase 1–2)
- Mobile native app (iOS/Android) — Phase 1–2

---

## 13. Decisions Log

| # | Question | Decision | Notes |
|---|----------|----------|-------|
| 1 | ASX real-time data | **Accept 15-min delay** | yfinance ASX data; revisit if user demand requires real-time |
| 2 | $20 minimum viability | **Enforce soft minimum $50–$100 guidance** | Informational warning in UI; user's brokerage fees are their own concern since iTrade doesn't execute |
| 3 | Strategy building UI | **No-code builder in Phase 2** | Drag-and-drop indicator blocks; code-first available for advanced users |
| 4 | Regulatory position | **Tool-only model — no AFSL required** | iTrade generates signals only; user executes manually. Mirrors TradingView model. Exempt from AFSL. |
| 5 | Crypto exchange | **Kraken signals (primary); CCXT abstraction** | Deep links to Kraken; CCXT used in signal engine for price data so Binance/Coinbase can be added easily |

---

## 14. Regulatory Position — Tool Only

### Legal Basis
Under the Corporations Act 2001 (Cth), providing factual market information, analysis, and signals — without executing transactions — does not constitute "dealing in financial products" (s.769B) or "providing financial product advice" requiring AFSL.

iTrade operates identically to:
- **TradingView** — signals and charts; no execution; no AFSL
- **MetaTrader** — strategy signals via brokers; no independent AFSL
- **ASIC Class Order [CO 02/1277]** — exempts factual information and general market commentary from AFSL requirements

### Non-Negotiable Design Constraints (to maintain tool status)
1. **No order submission** — iTrade never calls a broker API to place an order
2. **No broker credentials stored** — deep links use public URL schemes only
3. **No discretionary management** — iTrade does not manage a portfolio on the user's behalf
4. **User confirmation always required** — user must manually place every trade in their broker
5. **Disclaimer on every signal** — *"This is not financial advice. You are responsible for your investment decisions."*

### What Changes if iTrade Ever Executes Trades
If a future version adds automated execution, an AFSL (or Authorised Representative arrangement) would be required before that feature goes live. The recommended path at that point is AR under an existing AFSL holder (~$2,000–$10,000/year, weeks to set up).

---

## 15. Kraken — Phase 2 Crypto Signal Engine

**Decision: Kraken as primary crypto data source and deep-link target.**

| Factor | Kraken | Binance |
|--------|--------|---------|
| AU Regulatory Status | ✅ AUSTRAC licensed (Bit Trade Pty Ltd) | ⚠️ No AU entity since 2023 |
| US Regulatory Status | ✅ Strong (acquired Bitnomial May 2026) | ❌ Unavailable in NY/TX/HI/VT |
| API / Data Quality | ✅ Excellent for systematic signal generation | ✅ Good |
| Deep Link Support | ✅ Web order page pre-fill | ✅ Web order page pre-fill |
| Python SDK | `python-kraken-sdk` (official) + CCXT | `python-binance` + CCXT |

**Implementation**: Use **CCXT** for exchange-agnostic price data in the signal engine. Binance can be added as a Phase 3 data source + deep-link target without rewriting strategy code.

---

## 16. Phased Delivery Timeline

```
Week 1–2   : Backend scaffolding, FastAPI, PostgreSQL, Auth
Week 3–4   : Market data pipeline (yfinance + Alpha Vantage), watchlist
Week 5–6   : Strategy engine (pandas-ta), 3 strategies, signal generation
Week 7–8   : Frontend — signal dashboard, backtest UI, paper simulation
── Phase 1 MVP Launch ──────────────────────────────────────────────────
Week 9–10  : ASX + crypto data feeds; signal coverage expansion
Week 11–12 : Broker deep links (Stake, CommSec, Kraken); portfolio tracker
── Phase 1B Launch ─────────────────────────────────────────────────────
Week 13–15 : No-code strategy builder (drag-and-drop)
Week 16–18 : MACD + Bollinger strategies; Finnhub sentiment signals
Week 19–20 : ML classifier (Random Forest); signal strength score
── Phase 2 Launch ──────────────────────────────────────────────────────
Month 6+   : RL-based signal agent (FinRL), ensemble consensus, API access
── Phase 3 Ongoing ─────────────────────────────────────────────────────
```

---

*This PRD is a living document. The tool-only model is a core architectural and regulatory constraint — any feature that causes iTrade to execute trades on behalf of users requires legal review before implementation.*
