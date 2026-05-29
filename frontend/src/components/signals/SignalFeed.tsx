import { useState } from 'react'
import { Filter, RefreshCw, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { signalsApi, type SignalFilters, type AssetClass, type SignalType } from '../../api/signals'
import SignalCard from './SignalCard'
import { SkeletonCard } from '../ui/Spinner'
import { Button } from '../ui/Button'

const ASSET_CLASS_OPTIONS: { value: AssetClass | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Assets' },
  { value: 'US_STOCK', label: '🇺🇸 US Stocks' },
  { value: 'ASX_STOCK', label: '🇦🇺 ASX' },
  { value: 'CRYPTO', label: '₿ Crypto' },
  { value: 'ETF', label: '📊 ETFs' },
]

const SIGNAL_TYPE_OPTIONS: { value: SignalType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Signals' },
  { value: 'BUY', label: '▲ Buy Only' },
  { value: 'SELL', label: '▼ Sell Only' },
]

export default function SignalFeed() {
  const [assetFilter, setAssetFilter] = useState<AssetClass | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<SignalType | 'ALL'>('ALL')
  const [showFilters, setShowFilters] = useState(false)

  const filters: SignalFilters = {
    ...(assetFilter !== 'ALL' ? { asset_class: assetFilter } : {}),
    ...(typeFilter !== 'ALL' ? { signal_type: typeFilter } : {}),
    limit: 50,
  }

  const { data: signals, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['signals', filters],
    queryFn: () => signalsApi.getSignals(filters),
    refetchInterval: 60_000,
  })

  const DEMO_SIGNALS = useDemoSignals()

  const displaySignals = signals?.length ? signals : DEMO_SIGNALS

  return (
    <div className="space-y-4">
      {/* Feed header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent-blue" />
          <h2 className="text-lg font-semibold text-text-primary">Live Signals</h2>
          {displaySignals.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-accent-blue/10 text-accent-blue rounded-full font-semibold">
              {displaySignals.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            loading={isFetching}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-bg-card rounded-xl border border-border animate-fade-in">
          <div className="flex flex-wrap gap-1.5">
            {ASSET_CLASS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAssetFilter(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  assetFilter === opt.value
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="w-px bg-border mx-1 hidden sm:block" />
          <div className="flex flex-wrap gap-1.5">
            {SIGNAL_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  typeFilter === opt.value
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Signal cards */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displaySignals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Zap className="h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No signals yet</h3>
          <p className="text-text-muted text-sm max-w-sm">
            Add assets to your watchlist and enable strategies to start receiving AI-powered trading signals.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displaySignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}
    </div>
  )
}

// Demo signals for when API is not connected
function useDemoSignals() {
  return [
    {
      id: 1,
      symbol: 'AAPL',
      asset_name: 'Apple Inc.',
      asset_class: 'US_STOCK' as const,
      signal_type: 'BUY' as const,
      current_price: 189.45,
      entry_price: 188.50,
      stop_loss: 183.00,
      take_profit: 202.00,
      signal_strength: 8,
      strategy_name: 'RSI Reversal',
      reasoning: 'RSI(14) crossed above 30 from oversold territory at 28.3, signaling potential reversal. Price is holding above the 200-day SMA ($182.40) as key support. Volume on the current candle is 1.4x the 20-day average, confirming buyer interest. MACD histogram is turning positive after 5 days of negative readings.',
      indicators: { rsi: 32.1, sma200: 182.4, volume_ratio: 1.4, sma50: 0, bb_lower: 0, macd: 0, roc: 0 },
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      is_active: true,
    },
    {
      id: 2,
      symbol: 'BTC-USD',
      asset_name: 'Bitcoin',
      asset_class: 'CRYPTO' as const,
      signal_type: 'BUY' as const,
      current_price: 68240.00,
      entry_price: 67500.00,
      stop_loss: 64000.00,
      take_profit: 78000.00,
      signal_strength: 9,
      strategy_name: 'SMA Crossover',
      reasoning: 'Golden cross detected — SMA 50 ($65,200) crossed above SMA 200 ($62,800) for the first time in 14 months. Bitcoin is trading in a range above the 50-day SMA, with decreasing sell-side volume. On-chain data shows accumulation by long-term holders. Funding rates are neutral, reducing squeeze risk.',
      indicators: { sma50: 65200, sma200: 62800, rsi: 0, volume_ratio: 0, bb_lower: 0, macd: 0, roc: 0 },
      created_at: new Date(Date.now() - 18 * 60000).toISOString(),
      is_active: true,
    },
    {
      id: 3,
      symbol: 'CBA.AX',
      asset_name: 'Commonwealth Bank of Australia',
      asset_class: 'ASX_STOCK' as const,
      signal_type: 'SELL' as const,
      current_price: 127.30,
      entry_price: 127.50,
      stop_loss: 131.00,
      take_profit: 119.00,
      signal_strength: 6,
      strategy_name: 'Bollinger Band Squeeze',
      reasoning: 'Price broke below the lower Bollinger Band ($128.20) on above-average volume, suggesting downside momentum. RSI at 38 is trending lower, and the MACD crossed bearish 3 days ago. The stock is approaching a key resistance level turned support at $125.50.',
      indicators: { bb_lower: 128.2, rsi: 38, macd: -0.45, sma50: 0, sma200: 0, volume_ratio: 0, roc: 0 },
      created_at: new Date(Date.now() - 42 * 60000).toISOString(),
      is_active: true,
    },
    {
      id: 4,
      symbol: 'NVDA',
      asset_name: 'NVIDIA Corporation',
      asset_class: 'US_STOCK' as const,
      signal_type: 'BUY' as const,
      current_price: 875.20,
      entry_price: 870.00,
      stop_loss: 840.00,
      take_profit: 950.00,
      signal_strength: 7,
      strategy_name: 'Momentum Breakout',
      reasoning: 'NVDA broke above the $865 resistance level with 2.1x average volume. The stock has been consolidating for 12 days forming a bull flag pattern. ROC(10) at +8.3% indicates strong positive momentum. Sector tailwind from AI infrastructure spending continues to drive institutional buying.',
      indicators: { roc: 8.3, volume_ratio: 2.1, rsi: 0, sma50: 0, sma200: 0, bb_lower: 0, macd: 0 },
      created_at: new Date(Date.now() - 95 * 60000).toISOString(),
      is_active: true,
    },
    {
      id: 5,
      symbol: 'ETH-USD',
      asset_name: 'Ethereum',
      asset_class: 'CRYPTO' as const,
      signal_type: 'SELL' as const,
      current_price: 3420.50,
      entry_price: 3430.00,
      stop_loss: 3600.00,
      take_profit: 3050.00,
      signal_strength: 5,
      strategy_name: 'MACD Divergence',
      reasoning: 'Bearish MACD divergence: price made a higher high at $3,512 while MACD made a lower high, indicating weakening upside momentum. Ethereum staking yield compression and cooling DeFi activity suggest reduced demand pressure. Volume declining over the past 5 sessions despite price stability.',
      indicators: { macd: -45.2, rsi: 52, sma50: 0, sma200: 0, volume_ratio: 0, bb_lower: 0, roc: 0 },
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      is_active: true,
    },
  ]
}
