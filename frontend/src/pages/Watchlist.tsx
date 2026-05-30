import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Search, TrendingUp, TrendingDown, Eye, Activity, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { watchlistApi } from '../api/watchlist'
import { strategiesApi } from '../api/strategies'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { AssetClassBadge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { clsx } from 'clsx'

export default function Watchlist() {
  const qc = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof watchlistApi.searchSymbols>>>([])
  const [searching, setSearching] = useState(false)
  const [addingSymbol, setAddingSymbol] = useState('')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.getWatchlist(),
  })

  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategiesApi.getStrategies(),
  })

  const addMutation = useMutation({
    mutationFn: (symbol: string) => watchlistApi.addSymbol(symbol),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
      setSearchQuery('')
      setSearchResults([])
      setAddingSymbol('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (symbol: string) => watchlistApi.removeSymbol(symbol),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const updateStratMutation = useMutation({
    mutationFn: ({ symbol, strategies }: { symbol: string; strategies: string[] }) =>
      watchlistApi.updateStrategies(symbol, strategies),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    clearTimeout(searchTimeout.current)
    if (q.length < 1) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await watchlistApi.searchSymbols(q)
        setSearchResults(results)
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const toggleStrategy = (symbol: string, stratName: string, currentEnabled: string[]) => {
    const updated = currentEnabled.includes(stratName)
      ? currentEnabled.filter(s => s !== stratName)
      : [...currentEnabled, stratName]
    updateStratMutation.mutate({ symbol, strategies: updated })
  }

  const selectedWatchlistItem = watchlist?.find(w => w.symbol === selectedItem)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Watchlist</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage assets to monitor — strategies will generate signals for each
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Eye className="h-4 w-4" />
          {watchlist?.length ?? 0} assets monitored
        </div>
      </div>

      {/* Add symbol search */}
      <Card>
        <CardContent>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="Search stocks, ASX (BHP.AX), crypto (BTC-USD)…"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Search dropdown */}
            {searchQuery.length >= 1 && !searching && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    const sym = searchQuery.toUpperCase().trim()
                    if (!sym) return
                    setAddingSymbol(sym)
                    addMutation.mutate(sym)
                  }}
                  disabled={addMutation.isPending}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors text-left disabled:opacity-60"
                >
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      Add "{searchQuery.toUpperCase()}" directly
                    </p>
                    <p className="text-xs text-text-secondary">
                      No search matches — add as a custom ticker (e.g. ATS.AX, BHP.AX, BTC-USD)
                    </p>
                  </div>
                  {addMutation.isPending && addingSymbol === searchQuery.toUpperCase() ? (
                    <Spinner size="sm" />
                  ) : (
                    <Plus className="h-4 w-4 text-accent-blue" />
                  )}
                </button>
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                {searchResults.slice(0, 8).map(result => {
                  const alreadyAdded = watchlist?.some(w => w.symbol === result.symbol)
                  return (
                    <button
                      key={result.symbol}
                      onClick={() => {
                        if (!alreadyAdded) {
                          setAddingSymbol(result.symbol)
                          addMutation.mutate(result.symbol)
                        }
                      }}
                      disabled={alreadyAdded || addMutation.isPending}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors text-left disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-text-primary text-sm">{result.symbol}</p>
                          <p className="text-xs text-text-secondary">{result.name}</p>
                        </div>
                        <AssetClassBadge assetClass={result.asset_class} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">{result.exchange}</span>
                        {alreadyAdded ? (
                          <span className="text-xs text-bull">✓ Added</span>
                        ) : addMutation.isPending && addingSymbol === result.symbol ? (
                          <Spinner size="sm" />
                        ) : (
                          <Plus className="h-4 w-4 text-accent-blue" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Watchlist + strategy config */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Watchlist table */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Monitored Assets</h2>
            </CardHeader>
            {isLoading ? (
              <CardContent className="flex justify-center py-10">
                <Spinner size="lg" />
              </CardContent>
            ) : !watchlist || watchlist.length === 0 ? (
              <CardContent className="text-center py-16">
                <Eye className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary font-medium">No assets in watchlist</p>
                <p className="text-sm text-text-muted mt-1">Search above to add US stocks, ASX stocks, or crypto</p>
              </CardContent>
            ) : (
              <div className="divide-y divide-border">
                {watchlist.map(item => (
                  <div
                    key={item.symbol}
                    className={clsx(
                      'flex items-center gap-4 px-5 py-4 hover:bg-bg-hover/50 transition-colors cursor-pointer',
                      selectedItem === item.symbol && 'bg-bg-hover/50'
                    )}
                    onClick={() => setSelectedItem(selectedItem === item.symbol ? null : item.symbol)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/signals/${item.symbol}`}
                          className="font-bold text-text-primary hover:text-accent-blue transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          {item.symbol}
                        </Link>
                        <AssetClassBadge assetClass={item.asset_class} />
                        {item.active_signals > 0 && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-accent-blue/20 text-accent-blue text-xs rounded-full font-bold">
                            <Activity className="h-2.5 w-2.5" />
                            {item.active_signals} signal{item.active_signals !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary truncate mt-0.5">{item.asset_name}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {item.enabled_strategies.length} strategies active
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold font-mono text-text-primary">${item.current_price.toFixed(2)}</p>
                      <p className={clsx(
                        'text-sm font-medium flex items-center justify-end gap-1',
                        item.daily_change_pct >= 0 ? 'text-bull' : 'text-bear'
                      )}>
                        {item.daily_change_pct >= 0
                          ? <TrendingUp className="h-3.5 w-3.5" />
                          : <TrendingDown className="h-3.5 w-3.5" />
                        }
                        {item.daily_change_pct >= 0 ? '+' : ''}{item.daily_change_pct.toFixed(2)}%
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeMutation.mutate(item.symbol) }}
                      className="p-1.5 text-text-muted hover:text-bear transition-colors rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Strategy config panel */}
        <div>
          {selectedWatchlistItem ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-text-primary">
                    Strategies — {selectedWatchlistItem.symbol}
                  </h2>
                  <button onClick={() => setSelectedItem(null)} className="text-text-muted hover:text-text-primary">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-text-secondary mb-3">
                  Toggle which strategies generate signals for this asset
                </p>
                {strategies?.map(strat => (
                  <div key={strat.name} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-border-light transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">{strat.name}</p>
                      <p className="text-xs text-text-muted truncate">{strat.description.slice(0, 50)}…</p>
                    </div>
                    <button
                      onClick={() => toggleStrategy(
                        selectedWatchlistItem.symbol,
                        strat.name,
                        selectedWatchlistItem.enabled_strategies
                      )}
                      className={clsx(
                        'ml-3 flex-shrink-0 w-10 h-5 rounded-full transition-colors relative',
                        selectedWatchlistItem.enabled_strategies.includes(strat.name)
                          ? 'bg-accent-blue'
                          : 'bg-border'
                      )}
                    >
                      <span className={clsx(
                        'absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform',
                        selectedWatchlistItem.enabled_strategies.includes(strat.name)
                          ? 'translate-x-5'
                          : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Activity className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">Select an asset to configure its strategies</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
