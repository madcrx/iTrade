import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Cpu, TrendingUp, Activity, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { strategiesApi, type Strategy } from '../api/strategies'
import { Card, CardContent } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { clsx } from 'clsx'

const TYPE_ICONS = {
  TECHNICAL: <TrendingUp className="h-4 w-4" />,
  ML: <Cpu className="h-4 w-4" />,
  SENTIMENT: <Activity className="h-4 w-4" />,
}

const TYPE_COLORS = {
  TECHNICAL: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
  ML: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  SENTIMENT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
}

const ASSET_CLASS_LABELS: Record<string, string> = {
  US_STOCK: 'US',
  ASX_STOCK: 'ASX',
  CRYPTO: 'Crypto',
  ETF: 'ETF',
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const toggleMutation = useMutation({
    mutationFn: () => strategiesApi.toggleStrategy(strategy.id, !strategy.is_enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strategies'] }),
  })

  const winRateColor = strategy.win_rate >= 60 ? 'text-bull' : strategy.win_rate >= 45 ? 'text-yellow-400' : 'text-bear'

  return (
    <Card hover className="flex flex-col">
      <CardContent className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium',
                TYPE_COLORS[strategy.strategy_type]
              )}>
                {TYPE_ICONS[strategy.strategy_type]}
                {strategy.strategy_type}
              </span>
              {strategy.asset_classes.map(ac => (
                <span key={ac} className="px-1.5 py-0.5 bg-bg-secondary text-text-muted text-xs rounded border border-border">
                  {ASSET_CLASS_LABELS[ac] ?? ac}
                </span>
              ))}
            </div>
            <h3 className="font-bold text-text-primary text-lg">{strategy.name}</h3>
          </div>
          <button
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className={clsx(
              'flex-shrink-0 w-12 h-6 rounded-full transition-colors relative',
              strategy.is_enabled ? 'bg-accent-blue' : 'bg-border'
            )}
          >
            <span className={clsx(
              'absolute top-1 h-4 w-4 bg-white rounded-full shadow transition-transform',
              strategy.is_enabled ? 'translate-x-6' : 'translate-x-1'
            )} />
          </button>
        </div>

        {/* Description */}
        <p className={clsx('text-sm text-text-secondary leading-relaxed', !expanded && 'line-clamp-2')}>
          {strategy.description}
        </p>
        {strategy.description.length > 100 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-accent-blue hover:text-blue-300 transition-colors -mt-2"
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> More</>}
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
            <p className={clsx('text-lg font-bold', winRateColor)}>{strategy.win_rate.toFixed(0)}%</p>
            <p className="text-xs text-text-muted">Win Rate</p>
          </div>
          <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
            <p className={clsx('text-lg font-bold', strategy.avg_return >= 0 ? 'text-bull' : 'text-bear')}>
              {strategy.avg_return >= 0 ? '+' : ''}{strategy.avg_return.toFixed(1)}%
            </p>
            <p className="text-xs text-text-muted">Avg Return</p>
          </div>
          <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-text-primary">{strategy.total_signals.toLocaleString()}</p>
            <p className="text-xs text-text-muted">Signals</p>
          </div>
        </div>

        {/* Win rate bar */}
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Win Rate</span>
            <span className={winRateColor}>{strategy.win_rate.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', strategy.win_rate >= 60 ? 'bg-bull' : strategy.win_rate >= 45 ? 'bg-yellow-500' : 'bg-bear')}
              style={{ width: `${strategy.win_rate}%` }}
            />
          </div>
        </div>

        {/* Indicators */}
        {strategy.indicators.length > 0 && (
          <div>
            <p className="text-xs text-text-muted mb-1.5">Indicators</p>
            <div className="flex flex-wrap gap-1">
              {strategy.indicators.map(ind => (
                <span key={ind} className="px-2 py-0.5 bg-bg-secondary border border-border text-xs text-text-secondary rounded">
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Parameters (expanded) */}
        {expanded && Object.keys(strategy.parameters).length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-muted mb-2">Parameters</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(strategy.parameters).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-text-muted">{k.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-text-primary">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeframe + status */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-text-muted">Timeframe: <span className="text-text-secondary">{strategy.timeframe}</span></span>
          <span className={clsx(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            strategy.is_enabled ? 'bg-bull/10 text-bull' : 'bg-border text-text-muted'
          )}>
            {strategy.is_enabled ? '● Active' : '○ Inactive'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Strategies() {
  const [filter, setFilter] = useState<'ALL' | 'TECHNICAL' | 'ML' | 'SENTIMENT'>('ALL')

  const { data: strategies, isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategiesApi.getStrategies(),
  })

  const filtered = strategies?.filter(s => filter === 'ALL' || s.strategy_type === filter)

  const enabledCount = strategies?.filter(s => s.is_enabled).length ?? 0
  const avgWinRate = strategies
    ? (strategies.reduce((acc, s) => acc + s.win_rate, 0) / strategies.length).toFixed(1)
    : '—'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Strategy Library</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          AI-powered signal strategies — enable the ones you want to monitor
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{strategies?.length ?? '—'}</p>
          <p className="text-xs text-text-muted mt-1">Total Strategies</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-bull">{enabledCount}</p>
          <p className="text-xs text-text-muted mt-1">Active</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-accent-blue">{avgWinRate}%</p>
          <p className="text-xs text-text-muted mt-1">Avg Win Rate</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">3</p>
          <p className="text-xs text-text-muted mt-1">Strategy Types</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'TECHNICAL', 'ML', 'SENTIMENT'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === f
                ? 'bg-accent-blue text-white'
                : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary'
            )}
          >
            {f !== 'ALL' && TYPE_ICONS[f]}
            {f === 'ALL' ? 'All Strategies' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Strategy grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered?.map(strategy => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="flex items-start gap-3 bg-bg-card border border-border rounded-xl p-4">
        <Info className="h-5 w-5 text-accent-blue flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">How strategies work</p>
          <p className="text-sm text-text-secondary mt-1">
            Each strategy continuously analyses assets on your watchlist and fires a BUY or SELL signal when conditions are met.
            Signals include a plain-English explanation, suggested entry/stop/target levels, and historical win rate.
            You review the signal and place the trade yourself in your preferred broker.
          </p>
        </div>
      </div>
    </div>
  )
}
