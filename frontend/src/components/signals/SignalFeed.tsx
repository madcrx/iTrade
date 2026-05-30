import { useState } from 'react'
import { Filter, RefreshCw, Zap, Sparkles } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
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

  const generateMutation = useMutation({
    mutationFn: () => signalsApi.generateWatchlistSignals(),
    onSuccess: () => refetch(),
  })

  const source = signals ?? []
  const displaySignals = source.filter((s) => {
    if (assetFilter !== 'ALL' && s.asset_class !== assetFilter) return false
    if (typeFilter !== 'ALL' && s.signal_type !== typeFilter) return false
    return true
  })

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
          <Button
            variant="primary"
            size="sm"
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
          >
            <Sparkles className="h-4 w-4" />
            Generate Signals
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
          <p className="text-text-muted text-sm max-w-sm mb-4">
            Add assets to your watchlist, then click "Generate Signals" to run all
            strategies against live market data and produce real trading signals.
          </p>
          <Button
            variant="primary"
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
          >
            <Sparkles className="h-4 w-4" />
            Generate Signals Now
          </Button>
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
