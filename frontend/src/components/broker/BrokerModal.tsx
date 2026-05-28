import { ExternalLink, AlertTriangle, Info } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { BROKERS, getBrokersForAsset } from '../../utils/deeplinks'
import { formatPrice, formatPercent } from '../../utils/formatters'
import type { Signal } from '../../api/signals'
import { useAuthStore } from '../../store/authStore'

interface BrokerModalProps {
  isOpen: boolean
  onClose: () => void
  signal: Signal
}

export default function BrokerModal({ isOpen, onClose, signal }: BrokerModalProps) {
  const { user } = useAuthStore()
  const availableBrokers = getBrokersForAsset(signal.asset_class)

  const stopLossPct = signal.current_price > 0
    ? Math.abs((signal.stop_loss - signal.entry_price) / signal.entry_price) * 100
    : 2

  const takeProfitPct = signal.current_price > 0
    ? Math.abs((signal.take_profit - signal.entry_price) / signal.entry_price) * 100
    : 6

  const riskReward = stopLossPct > 0 ? (takeProfitPct / stopLossPct).toFixed(1) : '—'

  const portfolioValue = 10000 // default for suggestion
  const riskPct = user?.risk_preference === 'aggressive' ? 3 : user?.risk_preference === 'moderate' ? 2 : 1
  const riskAmount = portfolioValue * (riskPct / 100)
  const suggestedQty = stopLossPct > 0 ? Math.floor(riskAmount / (signal.entry_price * (stopLossPct / 100))) : 10
  const suggestedValue = suggestedQty * signal.entry_price

  const isBuy = signal.signal_type === 'BUY'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade in Your Broker" size="lg">
      <div className="p-6 space-y-5">
        {/* Signal summary */}
        <div className={`rounded-xl p-4 border ${isBuy ? 'border-bull/30 bg-bull/5' : 'border-bear/30 bg-bear/5'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-bold text-text-primary">{signal.symbol}</span>
              <span className="ml-2 text-sm text-text-secondary">{signal.asset_name}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              isBuy ? 'bg-bull/20 text-bull' : 'bg-bear/20 text-bear'
            }`}>
              {isBuy ? '▲ BUY' : '▼ SELL'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-text-muted">Entry</p>
              <p className="text-sm font-semibold text-text-primary">{formatPrice(signal.entry_price)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Stop Loss</p>
              <p className="text-sm font-semibold text-bear">{formatPrice(signal.stop_loss)}</p>
              <p className="text-xs text-bear/70">-{stopLossPct.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Take Profit</p>
              <p className="text-sm font-semibold text-bull">{formatPrice(signal.take_profit)}</p>
              <p className="text-xs text-bull/70">+{takeProfitPct.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Risk/Reward</p>
              <p className="text-sm font-semibold text-accent-blue">1:{riskReward}</p>
            </div>
          </div>
        </div>

        {/* Position size suggestion */}
        <div className="bg-bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-accent-blue flex-shrink-0" />
            <p className="text-sm font-medium text-text-primary">Suggested Position Size</p>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Based on {riskPct}% portfolio risk ({user?.risk_preference || 'moderate'}) on a $
            {portfolioValue.toLocaleString()} portfolio
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{suggestedQty}</p>
              <p className="text-xs text-text-muted">Shares</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">${suggestedValue.toFixed(0)}</p>
              <p className="text-xs text-text-muted">Total Value</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-bear">${riskAmount.toFixed(0)}</p>
              <p className="text-xs text-text-muted">Max Risk</p>
            </div>
          </div>
        </div>

        {/* Broker grid */}
        <div>
          <p className="text-sm font-medium text-text-secondary mb-3">
            Open in your broker app
          </p>
          {availableBrokers.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              No supported brokers for this asset class.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {availableBrokers.map((broker) => {
                const url = broker.buildUrl(
                  signal.symbol,
                  signal.signal_type,
                  signal.entry_price,
                  suggestedQty
                )
                return (
                  <a
                    key={broker.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-3 bg-bg-card hover:bg-bg-hover border border-border hover:border-border-light rounded-xl transition-all group"
                  >
                    <span className="text-xl flex-shrink-0">{broker.logo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{broker.name}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-text-muted group-hover:text-text-secondary flex-shrink-0" />
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="flex gap-2.5 p-3.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-400/80 leading-relaxed">
            <span className="font-semibold text-yellow-400">You are responsible for this trade decision.</span>{' '}
            iTrade provides signals as informational tools only. Always conduct your own research,
            consider your risk tolerance, and never invest more than you can afford to lose.
          </p>
        </div>

        <Button variant="ghost" fullWidth onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
