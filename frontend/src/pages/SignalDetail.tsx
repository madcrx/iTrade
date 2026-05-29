import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, TrendingUp, Shield, Target, Clock, BarChart2, RefreshCw } from 'lucide-react'
import { signalsApi } from '../api/signals'
import { backtestApi } from '../api/backtest'
import { strategiesApi } from '../api/strategies'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { AssetClassBadge } from '../components/ui/Badge'
import BrokerModal from '../components/broker/BrokerModal'
import { PriceChart } from '../components/charts/PriceChart'
import BacktestChart from '../components/charts/BacktestChart'
import { Spinner } from '../components/ui/Spinner'
import { formatPrice, formatRelativeTime } from '../utils/formatters'
import { clsx } from 'clsx'

export default function SignalDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const [brokerModalOpen, setBrokerModalOpen] = useState(false)
  const [runningBacktest, setRunningBacktest] = useState(false)
  const [backtestPeriod, setBacktestPeriod] = useState<'3m' | '6m' | '1y' | '2y'>('1y')

  const { data: signals, isLoading } = useQuery({
    queryKey: ['signals-symbol', symbol],
    queryFn: () => signalsApi.getSignalsBySymbol(symbol!),
    enabled: !!symbol,
  })

  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategiesApi.getStrategies(),
  })

  const latestSignal = signals?.[0]

  const { data: backtest, refetch: runBacktest } = useQuery({
    queryKey: ['backtest-detail', symbol, backtestPeriod, latestSignal?.strategy_name],
    queryFn: async () => {
      if (!latestSignal || !strategies) return null
      const strategy = strategies.find(s => s.name === latestSignal.strategy_name)
      if (!strategy) return null
      return backtestApi.runBacktest({
        symbol: symbol!,
        strategy: strategy.name,
        period: backtestPeriod,
        initial_capital: 10000,
      })
    },
    enabled: false,
  })

  const handleRunBacktest = async () => {
    setRunningBacktest(true)
    await runBacktest()
    setRunningBacktest(false)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  if (!latestSignal) return (
    <div className="p-6">
      <Link to="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
      <div className="text-center py-20">
        <p className="text-text-secondary">No signals found for {symbol}</p>
      </div>
    </div>
  )

  const isBuy = latestSignal.signal_type === 'BUY'
  const stopLossPct = ((Math.abs(latestSignal.stop_loss - latestSignal.entry_price) / latestSignal.entry_price) * 100).toFixed(1)
  const takeProfitPct = ((Math.abs(latestSignal.take_profit - latestSignal.entry_price) / latestSignal.entry_price) * 100).toFixed(1)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back nav */}
      <Link to="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Signal header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-3xl font-bold text-text-primary">{latestSignal.symbol}</h1>
            <AssetClassBadge assetClass={latestSignal.asset_class} />
            <span className={clsx(
              'px-3 py-1 rounded-full text-sm font-bold',
              isBuy ? 'bg-bull/20 text-bull border border-bull/30' : 'bg-bear/20 text-bear border border-bear/30'
            )}>
              {isBuy ? '▲ BUY SIGNAL' : '▼ SELL SIGNAL'}
            </span>
          </div>
          <p className="text-text-secondary">{latestSignal.asset_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="h-3.5 w-3.5 text-accent-blue" />
            <span className="text-sm text-accent-blue">{latestSignal.strategy_name}</span>
            <span className="text-text-muted">·</span>
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-sm text-text-muted">{formatRelativeTime(latestSignal.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-3xl font-bold font-mono text-text-primary">{formatPrice(latestSignal.current_price)}</p>
            <p className="text-sm text-text-secondary">Current Price</p>
          </div>
          <Button
            variant={isBuy ? 'success' : 'danger'}
            size="lg"
            onClick={() => setBrokerModalOpen(true)}
          >
            Trade Now →
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: chart + reasoning */}
        <div className="xl:col-span-2 space-y-6">
          {/* Price chart */}
          <PriceChart symbol={symbol!} signals={[latestSignal]} />

          {/* Full reasoning */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-accent-blue" />
                Signal Reasoning
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary leading-relaxed">{latestSignal.reasoning}</p>
              {latestSignal.indicators && Object.keys(latestSignal.indicators).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Indicator Values at Signal</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(latestSignal.indicators).map(([key, val]) => (
                      <div key={key} className="bg-bg-secondary rounded-lg p-3">
                        <p className="text-xs text-text-muted uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-semibold font-mono text-text-primary mt-1">
                          {typeof val === 'number' ? val.toFixed(4) : val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backtest section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-semibold text-text-primary">Backtest — {latestSignal.strategy_name} on {symbol}</h2>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {(['3m', '6m', '1y', '2y'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setBacktestPeriod(p)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          backtestPeriod === p
                            ? 'bg-accent-blue text-white'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" onClick={handleRunBacktest} loading={runningBacktest}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Run
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!backtest ? (
                <div className="text-center py-10 text-text-secondary">
                  <BarChart2 className="h-10 w-10 mx-auto mb-3 text-text-muted" />
                  <p>Click "Run" to backtest {latestSignal.strategy_name} on {symbol}</p>
                </div>
              ) : (
                <BacktestChart result={backtest} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: trade levels + signal history */}
        <div className="space-y-6">
          {/* Trade levels */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Trade Levels</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">Entry Price</span>
                </div>
                <span className="font-semibold font-mono text-text-primary">{formatPrice(latestSignal.entry_price)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-bear/70" />
                  <span className="text-sm text-text-secondary">Stop Loss</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold font-mono text-bear">{formatPrice(latestSignal.stop_loss)}</p>
                  <p className="text-xs text-bear/60">-{stopLossPct}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-bull/70" />
                  <span className="text-sm text-text-secondary">Take Profit</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold font-mono text-bull">{formatPrice(latestSignal.take_profit)}</p>
                  <p className="text-xs text-bull/60">+{takeProfitPct}%</p>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Risk/Reward</span>
                  <span className="font-semibold text-text-primary">
                    1 : {(parseFloat(takeProfitPct) / parseFloat(stopLossPct)).toFixed(1)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-bear via-yellow-500 to-bull rounded-full"
                    style={{ width: `${Math.min(100, (parseFloat(takeProfitPct) / (parseFloat(takeProfitPct) + parseFloat(stopLossPct))) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signal strength */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Signal Strength</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'w-5 h-6 rounded-sm',
                        i < latestSignal.signal_strength
                          ? latestSignal.signal_strength >= 7 ? 'bg-bull' : latestSignal.signal_strength >= 4 ? 'bg-yellow-500' : 'bg-bear'
                          : 'bg-border'
                      )}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold text-text-primary">{latestSignal.signal_strength}/10</span>
              </div>
              <p className="text-xs text-text-muted">
                {latestSignal.signal_strength >= 8
                  ? 'Very strong signal — multiple indicators aligning'
                  : latestSignal.signal_strength >= 6
                  ? 'Strong signal — primary indicator clearly triggered'
                  : latestSignal.signal_strength >= 4
                  ? 'Moderate signal — exercise caution'
                  : 'Weak signal — consider waiting for confirmation'}
              </p>
            </CardContent>
          </Card>

          {/* Signal history */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Signal History</h2>
            </CardHeader>
            <CardContent>
              {signals && signals.length > 1 ? (
                <div className="space-y-2">
                  {signals.slice(0, 8).map(sig => (
                    <div key={sig.id} className={clsx(
                      'flex items-center justify-between p-2 rounded-lg border',
                      sig.id === latestSignal.id ? 'border-accent-blue/30 bg-accent-blue/5' : 'border-border'
                    )}>
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'px-1.5 py-0.5 rounded text-xs font-bold',
                          sig.signal_type === 'BUY' ? 'bg-bull/20 text-bull' : 'bg-bear/20 text-bear'
                        )}>
                          {sig.signal_type}
                        </span>
                        <span className="text-xs text-text-secondary">{sig.strategy_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-text-primary">{formatPrice(sig.entry_price)}</p>
                        <p className="text-xs text-text-muted">{formatRelativeTime(sig.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary text-center py-4">No previous signals for {symbol}</p>
              )}
            </CardContent>
          </Card>

          <Button
            fullWidth
            variant={isBuy ? 'success' : 'danger'}
            size="lg"
            onClick={() => setBrokerModalOpen(true)}
          >
            Trade Now — Open in Broker →
          </Button>

          <p className="text-xs text-text-muted text-center leading-relaxed">
            ⚠️ Not financial advice. You are solely responsible for all investment decisions.
          </p>
        </div>
      </div>

      <BrokerModal isOpen={brokerModalOpen} onClose={() => setBrokerModalOpen(false)} signal={latestSignal} />
    </div>
  )
}
