import { FlaskConical, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Strategy } from '../../api/strategies'
import { strategiesApi } from '../../api/strategies'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface StrategyCardProps {
  strategy: Strategy
  onBacktest?: (strategy: Strategy) => void
  onViewDetail?: (strategy: Strategy) => void
}

const TYPE_CONFIG = {
  TECHNICAL: { label: 'Technical', color: 'bg-blue-500/10 text-blue-400', icon: '📈' },
  ML: { label: 'ML / AI', color: 'bg-purple-500/10 text-purple-400', icon: '🤖' },
  SENTIMENT: { label: 'Sentiment', color: 'bg-orange-500/10 text-orange-400', icon: '📰' },
}

export default function StrategyCard({ strategy, onBacktest, onViewDetail }: StrategyCardProps) {
  const queryClient = useQueryClient()
  const typeConfig = TYPE_CONFIG[strategy.strategy_type]

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => strategiesApi.toggleStrategy(strategy.name, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategies'] }),
  })

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{typeConfig.icon}</span>
              <h3 className="text-base font-semibold text-text-primary truncate">{strategy.name}</h3>
            </div>
            <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full', typeConfig.color)}>
              {typeConfig.label}
            </span>
          </div>

          {/* Toggle */}
          <button
            onClick={() => toggleMutation.mutate(!strategy.is_enabled)}
            disabled={toggleMutation.isPending}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
              strategy.is_enabled ? 'bg-accent-blue' : 'bg-border',
              toggleMutation.isPending && 'opacity-50'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                strategy.is_enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-3">
          {strategy.description}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-bg-secondary rounded-lg p-2 text-center">
            <p className="text-base font-bold text-bull">{(strategy.win_rate * 100).toFixed(0)}%</p>
            <p className="text-xs text-text-muted">Win Rate</p>
          </div>
          <div className="bg-bg-secondary rounded-lg p-2 text-center">
            <p className={clsx('text-base font-bold', strategy.avg_return >= 0 ? 'text-bull' : 'text-bear')}>
              {strategy.avg_return >= 0 ? '+' : ''}{(strategy.avg_return * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-text-muted">Avg Return</p>
          </div>
          <div className="bg-bg-secondary rounded-lg p-2 text-center">
            <p className="text-base font-bold text-text-primary">{strategy.total_signals}</p>
            <p className="text-xs text-text-muted">Signals</p>
          </div>
        </div>

        {/* Asset classes */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {strategy.asset_classes.map((ac) => (
            <Badge key={ac} variant="outline" size="sm">
              {ac === 'US_STOCK' ? '🇺🇸 US' : ac === 'ASX_STOCK' ? '🇦🇺 ASX' : ac === 'CRYPTO' ? '₿ Crypto' : '📊 ETF'}
            </Badge>
          ))}
        </div>

        {/* Indicators */}
        <div className="flex flex-wrap gap-1.5">
          {strategy.indicators.slice(0, 4).map((ind) => (
            <span key={ind} className="px-2 py-0.5 text-xs bg-border/50 text-text-muted rounded font-mono">
              {ind}
            </span>
          ))}
          {strategy.indicators.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-text-muted">+{strategy.indicators.length - 4} more</span>
          )}
        </div>
      </CardContent>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-border flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBacktest?.(strategy)}
          className="flex-1"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Backtest
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewDetail?.(strategy)}
          className="flex-1"
        >
          Details
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
