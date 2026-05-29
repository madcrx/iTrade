import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Bell, Filter, TrendingUp, Activity, Eye, Zap } from 'lucide-react'
import { signalsApi } from '../api/signals'
import { watchlistApi } from '../api/watchlist'
import { StatCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import SignalFeed from '../components/signals/SignalFeed'
import type { AssetClass, SignalType } from '../api/signals'

const ASSET_FILTERS: { label: string; value: AssetClass | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'US Stocks', value: 'US_STOCK' },
  { label: 'ASX', value: 'ASX_STOCK' },
  { label: 'Crypto', value: 'CRYPTO' },
]

const SIGNAL_FILTERS: { label: string; value: SignalType | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Buy', value: 'BUY' },
  { label: 'Sell', value: 'SELL' },
]

export default function Dashboard() {
  const [assetFilter, setAssetFilter] = useState<AssetClass | 'ALL'>('ALL')
  const [signalFilter, setSignalFilter] = useState<SignalType | 'ALL'>('ALL')
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', refreshKey],
    queryFn: () => signalsApi.getDashboardStats(),
    refetchInterval: 60_000,
  })

  const { data: watchlist } = useQuery({
    queryKey: ['watchlist-mini'],
    queryFn: () => watchlistApi.getWatchlist(),
  })

  const handleRefresh = () => setRefreshKey(k => k + 1)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Signal Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Live AI-generated trading signals — review and execute manually in your broker
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" size="sm">
            <Bell className="h-4 w-4" />
            Alerts
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Signals Today"
          value={statsLoading ? '—' : stats?.signals_today ?? 0}
          change={stats?.signals_today ? `${stats.active_signals} active` : undefined}
          changePositive={true}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="Watchlist"
          value={statsLoading ? '—' : stats?.watchlist_count ?? 0}
          change="assets monitored"
          changePositive={true}
          icon={<Eye className="h-4 w-4" />}
        />
        <StatCard
          label="Active Strategies"
          value={statsLoading ? '—' : stats?.active_strategies ?? 0}
          change="running now"
          changePositive={true}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Paper P&L"
          value={statsLoading ? '—' : `$${(stats?.paper_value ?? 10000).toLocaleString()}`}
          change={stats ? `${stats.paper_pnl_pct >= 0 ? '+' : ''}${stats.paper_pnl_pct.toFixed(2)}%` : undefined}
          changePositive={(stats?.paper_pnl_pct ?? 0) >= 0}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-text-secondary" />
          <span className="text-sm text-text-secondary">Filter:</span>
        </div>
        <div className="flex gap-1">
          {ASSET_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setAssetFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                assetFilter === f.value
                  ? 'bg-accent-blue text-white'
                  : 'bg-bg-card text-text-secondary border border-border hover:border-border-light'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {SIGNAL_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setSignalFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                signalFilter === f.value
                  ? f.value === 'BUY'
                    ? 'bg-bull text-white'
                    : f.value === 'SELL'
                    ? 'bg-bear text-white'
                    : 'bg-accent-blue text-white'
                  : 'bg-bg-card text-text-secondary border border-border hover:border-border-light'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content: signals + watchlist sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Signal feed — 2/3 width on xl */}
        <div className="xl:col-span-2">
          <SignalFeed />
        </div>

        {/* Watchlist sidebar — 1/3 width on xl */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Watchlist</h2>
          {!watchlist || watchlist.length === 0 ? (
            <div className="bg-bg-card rounded-xl border border-border p-6 text-center">
              <Eye className="h-8 w-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No assets in watchlist</p>
              <p className="text-xs text-text-muted mt-1">
                Add symbols in the{' '}
                <a href="/watchlist" className="text-accent-blue hover:underline">Watchlist</a> page
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlist.map(item => (
                <a
                  key={item.symbol}
                  href={`/signals/${item.symbol}`}
                  className="block bg-bg-card rounded-xl border border-border p-4 hover:border-border-light transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary text-sm">{item.symbol}</span>
                        {item.active_signals > 0 && (
                          <span className="px-1.5 py-0.5 bg-accent-blue/20 text-accent-blue text-xs rounded-full font-bold">
                            {item.active_signals}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary truncate">{item.asset_name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-mono font-semibold text-text-primary">
                        ${item.current_price.toFixed(2)}
                      </p>
                      <p className={`text-xs font-medium ${item.daily_change_pct >= 0 ? 'text-bull' : 'text-bear'}`}>
                        {item.daily_change_pct >= 0 ? '+' : ''}{item.daily_change_pct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-bg-card border border-border/50 px-4 py-3">
        <p className="text-xs text-text-muted text-center">
          ⚠️ iTrade provides market signals for informational purposes only. Not financial advice.
          All trade decisions and execution are your sole responsibility.
        </p>
      </div>
    </div>
  )
}
