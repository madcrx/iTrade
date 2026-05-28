import { useState } from 'react'
import { ArrowLeft, Clock, TrendingUp, Target, Shield, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Signal } from '../../api/signals'
import { AssetClassBadge, SignalTypeBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import BrokerModal from '../broker/BrokerModal'
import { formatPrice, formatRelativeTime } from '../../utils/formatters'
import { Card, CardContent, CardHeader } from '../ui/Card'

interface SignalDetailViewProps {
  signal: Signal
  signalHistory?: Signal[]
}

export default function SignalDetailView({ signal, signalHistory = [] }: SignalDetailViewProps) {
  const [brokerModalOpen, setBrokerModalOpen] = useState(false)
  const isBuy = signal.signal_type === 'BUY'

  const stopLossPct = ((Math.abs(signal.stop_loss - signal.entry_price) / signal.entry_price) * 100).toFixed(1)
  const takeProfitPct = ((Math.abs(signal.take_profit - signal.entry_price) / signal.entry_price) * 100).toFixed(1)
  const rrRatio = (parseFloat(takeProfitPct) / parseFloat(stopLossPct)).toFixed(1)

  return (
    <>
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to signals
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-text-primary">{signal.symbol}</h1>
              <AssetClassBadge assetClass={signal.asset_class} />
              <SignalTypeBadge type={signal.signal_type} />
            </div>
            <p className="text-text-secondary mt-1">{signal.asset_name}</p>
          </div>
          <Button
            variant={isBuy ? 'success' : 'danger'}
            size="lg"
            onClick={() => setBrokerModalOpen(true)}
          >
            Trade Now in Your Broker
          </Button>
        </div>

        {/* Price levels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Current Price</p>
            <p className="text-2xl font-bold font-mono text-text-primary">{formatPrice(signal.current_price)}</p>
          </Card>
          <Card className={`p-4 text-center border-l-4 ${isBuy ? 'border-l-bull/50' : 'border-l-bear/50'}`}>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Entry</p>
            <p className="text-2xl font-bold font-mono text-text-primary">{formatPrice(signal.entry_price)}</p>
          </Card>
          <Card className="p-4 text-center border-l-4 border-l-bear/50">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Stop Loss</p>
            <p className="text-2xl font-bold font-mono text-bear">{formatPrice(signal.stop_loss)}</p>
            <p className="text-xs text-bear/60 mt-0.5">-{stopLossPct}%</p>
          </Card>
          <Card className="p-4 text-center border-l-4 border-l-bull/50">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Take Profit</p>
            <p className="text-2xl font-bold font-mono text-bull">{formatPrice(signal.take_profit)}</p>
            <p className="text-xs text-bull/60 mt-0.5">+{takeProfitPct}%</p>
          </Card>
        </div>

        {/* Signal meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-accent-blue" />
              <span className="text-sm font-medium text-text-secondary">Strategy</span>
            </div>
            <p className="text-base font-semibold text-text-primary">{signal.strategy_name}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-text-secondary">Signal Strength</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-4 rounded-sm ${
                      i < signal.signal_strength
                        ? signal.signal_strength >= 7 ? 'bg-bull' : signal.signal_strength >= 4 ? 'bg-yellow-500' : 'bg-bear'
                        : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-text-primary">{signal.signal_strength}/10</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-accent-blue" />
              <span className="text-sm font-medium text-text-secondary">Risk/Reward</span>
            </div>
            <p className="text-base font-semibold text-text-primary">1 : {rrRatio}</p>
          </Card>
        </div>

        {/* Full reasoning */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-text-primary">AI Analysis & Reasoning</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary leading-relaxed">{signal.reasoning}</p>
            {/* Indicators grid */}
            {Object.keys(signal.indicators).length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(signal.indicators).map(([key, value]) => (
                  <div key={key} className="bg-bg-secondary rounded-lg p-3">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-semibold font-mono text-text-primary">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signal history */}
        {signalHistory.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-text-primary">Signal History</h3>
            </CardHeader>
            <div className="divide-y divide-border">
              {signalHistory.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        s.signal_type === 'BUY' ? 'bg-bull/20 text-bull' : 'bg-bear/20 text-bear'
                      }`}
                    >
                      {s.signal_type}
                    </span>
                    <span className="text-sm text-text-primary font-mono">{formatPrice(s.entry_price)}</span>
                    <span className="text-xs text-text-muted">{s.strategy_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {formatRelativeTime(s.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BrokerModal
        isOpen={brokerModalOpen}
        onClose={() => setBrokerModalOpen(false)}
        signal={signal}
      />
    </>
  )
}
