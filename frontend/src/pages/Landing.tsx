import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  Check,
  Brain,
  Globe,
  ChevronRight,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Signals',
    description: 'Our ML models analyse price action, volume, momentum, and sentiment to generate high-probability buy/sell signals with full reasoning.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: BarChart3,
    title: 'Backtesting Lab',
    description: 'Test any strategy against 5 years of historical data. See win rates, Sharpe ratios, max drawdown, and equity curves before going live.',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Every signal comes with suggested entry, stop-loss, and take-profit levels calibrated to your risk preference.',
    color: 'text-bull',
    bg: 'bg-bull/10',
  },
  {
    icon: Globe,
    title: '10+ Broker Integrations',
    description: 'One-click deep links to CommSec, Stake, IBKR, Binance, Coinbase, eToro and more. You place the trade — we just make it effortless.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Add to Watchlist',
    desc: 'Search and add any US stock, ASX stock, or crypto you want to monitor. Enable the strategies you trust.',
  },
  {
    num: '02',
    title: 'Receive AI Signals',
    desc: 'When our AI detects a high-probability setup, you get a detailed signal with reasoning, confidence score, and trade levels.',
  },
  {
    num: '03',
    title: 'Trade in Your Broker',
    desc: 'Review the signal, agree with the analysis, and tap your preferred broker to execute. You\'re always in control.',
  },
]

const TICKER_ITEMS = [
  { symbol: 'AAPL', change: '+1.24%', bull: true },
  { symbol: 'NVDA', change: '+3.18%', bull: true },
  { symbol: 'BTC', change: '-0.87%', bull: false },
  { symbol: 'CBA.AX', change: '+0.45%', bull: true },
  { symbol: 'ETH', change: '+2.11%', bull: true },
  { symbol: 'TSLA', change: '-1.63%', bull: false },
  { symbol: 'SPY', change: '+0.72%', bull: true },
  { symbol: 'QQQ', change: '+0.91%', bull: true },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Ticker strip */}
      <div className="bg-bg-secondary border-b border-border py-2 overflow-hidden">
        <div className="flex animate-none" style={{ animation: 'none' }}>
          <div className="flex items-center gap-6 px-4 flex-wrap">
            {TICKER_ITEMS.map((item) => (
              <div key={item.symbol} className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="font-semibold text-text-primary">{item.symbol}</span>
                <span className={item.bull ? 'text-bull' : 'text-bear'}>{item.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            i<span className="text-accent-blue">Trade</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/20 rounded-full text-xs font-semibold text-accent-blue mb-6">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered · Signal Tool Only · You Trade
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-text-primary">AI-Powered</span>{' '}
            <span className="text-gradient">Trading Signals.</span>
            <br />
            <span className="text-text-primary">You Stay in Control.</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            iTrade analyses US stocks, ASX stocks, and crypto 24/7 — generating buy/sell signals with
            full AI reasoning, backtested performance, and one-tap broker links. You decide. You trade.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-accent-blue hover:bg-accent-blue-hover text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-accent-blue/20"
            >
              Start Free — No card required
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-bg-card hover:bg-bg-hover border border-border text-text-primary font-semibold px-8 py-4 rounded-xl text-lg transition-all"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-text-muted mt-4">
            iTrade is a signal tool only. It does not execute trades. Always do your own research.
          </p>
        </div>

        {/* Mock signal card preview */}
        <div className="max-w-2xl mx-auto mt-16 relative">
          <div className="bg-bg-card rounded-2xl border border-border shadow-2xl overflow-hidden signal-card-buy">
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-text-primary">AAPL</span>
                    <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">🇺🇸 US</span>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-bull/20 text-bull border border-bull/30 rounded-full">▲ BUY</span>
                  </div>
                  <p className="text-sm text-text-secondary">Apple Inc.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono">$189.45</p>
                  <p className="text-sm text-bull">+1.24%</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-accent-blue font-medium">RSI Reversal</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className={`w-2 h-3 rounded-sm ${i < 8 ? 'bg-bull' : 'bg-border'}`} />
                  ))}
                </div>
                <span className="text-xs text-text-secondary">8/10</span>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-border grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-text-muted">Entry</p>
                <p className="text-sm font-semibold font-mono">$188.50</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Stop</p>
                <p className="text-sm font-semibold font-mono text-bear">$183.00</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Target</p>
                <p className="text-sm font-semibold font-mono text-bull">$202.00</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border">
              <p className="text-sm text-text-secondary line-clamp-2">
                RSI(14) crossed above 30 from oversold territory at 28.3, signaling potential reversal. Price is holding above the 200-day SMA ($182.40) as key support.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-text-muted">5 minutes ago</span>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded-lg">Details</button>
                <button className="px-3 py-1.5 text-xs font-bold bg-bull/10 text-bull border border-bull/30 rounded-lg">Trade Now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">How it works</h2>
            <p className="text-text-secondary text-lg">Three steps from watchlist to trade</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-start">
                {i < STEPS.length - 1 && (
                  <div className="absolute top-8 right-0 w-1/3 h-px bg-border hidden md:block translate-x-1/2" />
                )}
                <div className="w-16 h-16 bg-bg-card border border-border rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl font-black text-accent-blue">{step.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
              Everything you need to trade smarter
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Institutional-grade analysis tools for everyday traders
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="bg-bg-card rounded-2xl border border-border p-6 hover:border-border-light transition-all group"
              >
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-text-secondary leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported markets */}
      <section className="py-16 px-6 bg-bg-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Coverage</h2>
          <p className="text-text-secondary mb-8">Signals across major markets</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { flag: '🇺🇸', label: 'US Stocks', sub: 'NYSE & NASDAQ' },
              { flag: '🇦🇺', label: 'ASX Stocks', sub: 'Australian Exchange' },
              { flag: '₿', label: 'Crypto', sub: 'BTC, ETH & 100+' },
              { flag: '📊', label: 'ETFs', sub: 'Major index funds' },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center bg-bg-card border border-border rounded-xl px-6 py-4 w-36">
                <span className="text-3xl mb-2">{m.flag}</span>
                <p className="text-sm font-semibold text-text-primary">{m.label}</p>
                <p className="text-xs text-text-muted">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Ready to trade smarter?
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Join thousands of traders using AI signals to find better setups.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-accent-blue hover:bg-accent-blue-hover text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-accent-blue/20"
          >
            Start Free Today
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
            {['Free to start', 'No credit card', '10+ brokers supported', 'Cancel anytime'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Check className="h-4 w-4 text-bull" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-blue rounded flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">i<span className="text-accent-blue">Trade</span></span>
          </div>
          <p className="text-xs text-text-muted text-center sm:text-right max-w-md">
            iTrade is a signal analysis tool only. It does not execute trades or provide financial advice.
            Always conduct your own research before making investment decisions.
          </p>
        </div>
      </footer>
    </div>
  )
}
