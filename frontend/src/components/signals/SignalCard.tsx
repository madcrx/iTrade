import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, Clock, Target, Shield, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { Link } from 'react-router-dom'
import type { Signal } from '../../api/signals'
import { AssetClassBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import BrokerModal from '../broker/BrokerModal'
import { formatPrice, formatRelativeTime, formatPercent } from '../../utils/formatters'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface SignalCardProps {
  signal: Signal
  className?: string
}

// Signal strength bar
function StrengthMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={clsx(
              'w-2 h-3 rounded-sm transition-all',
              i < value
                ? value >= 7 ? 'bg-bull' : value >= 4 ? 'bg-yellow-500' : 'bg-bear'
                : 'bg-border'
            )}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-text-secondary">{value}/10</span>
    </div>
  )
}

// Mini sparkline using mock data derived from signal values
function MiniSparkline({ signal }: { signal: Signal }) {
  const mockData = Array.from({ length: 30 }, (_, i) => {
    const noise = (Math.sin(i * 0.5 + signal.id) * 0.03 + Math.cos(i * 0.3) * 0.02) * signal.current_price
    return { v: signal.current_price + noise - (signal.signal_type === 'BUY' ? -noise * 0.5 : noise * 0.5) }
  })
  const isBuy = signal.signal_type === 'BUY'

  return (
    <div className="w-24 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={isBuy ? '#10b981' : '#ef4444'}
            strokeWidth={1.5}
            dot={false}
          />
          <Tooltip
            formatter={(v: number) => [formatPrice(v), '']}
            contentStyle={{ display: 'none' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function SignalCard({ signal, className }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [brokerModalOpen, setBrokerModalOpen] = useState(false)

  const isBuy = signal.signal_type === 'BUY'

  const stopLossPct = ((Math.abs(signal.stop_loss - signal.entry_price) / signal.entry_price) * 100).toFixed(1)
  const takeProfitPct = ((Math.abs(signal.take_profit - signal.entry_price) / signal.entry_price) * 100).toFixed(1)

  const priceChange = signal.current_price - signal.entry_price
  const priceChangePct = (priceChange / signal.entry_price) * 100

  return (
    <>
      <div
        className={clsx(
          'bg-bg-card rounded-xl border border-border animate-slide-up',
          'hover:border-border-light transition-all duration-200',
          isBuy ? 'signal-card-buy' : 'signal-card-sell',
          className
        )}
      >
        {/* Card header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left: symbol info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-lg font-bold text-text-primary">{signal.symbol}</span>
                <AssetClassBadge assetClass={signal.asset_class} />
                <span
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold',
                    isBuy
                      ? 'bg-bull/20 text-bull border border-bull/30'
                      : 'bg-bear/20 text-bear border border-bear/30'
                  )}
                >
                  {isBuy ? '▲ BUY' : '▼ SELL'}
                </span>
              </div>
              <p className="text-sm text-text-secondary truncate">{signal.asset_name}</p>
            </div>

            {/* Right: price + sparkline */}
            <div className="flex items-start gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-xl font-bold font-mono text-text-primary">
                  {formatPrice(signal.current_price)}
                </p>
                <p
                  className={clsx(
                    'text-xs font-medium',
                    priceChange >= 0 ? 'text-bull' : 'text-bear'
                  )}
                >
                  {priceChange >= 0 ? '+' : ''}{formatPercent(priceChangePct)}
                </p>
              </div>
              <MiniSparkline signal={signal} />
            </div>
          </div>

          {/* Strategy + signal strength */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-accent-blue" />
              <span className="text-xs text-accent-blue font-medium">{signal.strategy_name}</span>
            </div>
            <StrengthMeter value={signal.signal_strength} />
          </div>
        </div>

        {/* Trade levels */}
        <div className="px-5 py-3 border-t border-border grid grid-cols-3 gap-3">
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <Target className="h-3 w-3 text-text-muted" />
              <span className="text-xs text-text-muted">Entry</span>
            </div>
            <p className="text-sm font-semibold font-mono text-text-primary">{formatPrice(signal.entry_price)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <Shield className="h-3 w-3 text-bear/70" />
              <span className="text-xs text-text-muted">Stop</span>
            </div>
            <p className="text-sm font-semibold font-mono text-bear">{formatPrice(signal.stop_loss)}</p>
            <p className="text-xs text-bear/60">-{stopLossPct}%</p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <Target className="h-3 w-3 text-bull/70" />
              <span className="text-xs text-text-muted">Target</span>
            </div>
            <p className="text-sm font-semibold font-mono text-bull">{formatPrice(signal.take_profit)}</p>
            <p className="text-xs text-bull/60">+{takeProfitPct}%</p>
          </div>
        </div>

        {/* Reasoning preview */}
        <div className="px-5 py-3 border-t border-border">
          <p
            className={clsx(
              'text-sm text-text-secondary leading-relaxed transition-all',
              !expanded && 'line-clamp-2'
            )}
          >
            {signal.reasoning}
          </p>
          {signal.reasoning.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-1.5 text-xs text-accent-blue hover:text-blue-300 transition-colors"
            >
              {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Read more</>}
            </button>
          )}
        </div>

        {/* Footer: time + actions */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeTime(signal.created_at)}
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/signals/${signal.symbol}`}>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
                Details
              </Button>
            </Link>
            <Button
              variant={isBuy ? 'success' : 'danger'}
              size="sm"
              onClick={() => setBrokerModalOpen(true)}
            >
              Trade Now
            </Button>
          </div>
        </div>
      </div>

      <BrokerModal
        isOpen={brokerModalOpen}
        onClose={() => setBrokerModalOpen(false)}
        signal={signal}
      />
    </>
  )
}
