import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Play, BarChart2, Trophy, TrendingDown, Percent, Clock } from 'lucide-react'
import { backtestApi, type BacktestResult } from '../api/backtest'
import { strategiesApi } from '../api/strategies'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import BacktestChart from '../components/charts/BacktestChart'
import { Spinner } from '../components/ui/Spinner'
import { clsx } from 'clsx'

const PERIODS = [
  { label: '3 Months', value: '3m' as const },
  { label: '6 Months', value: '6m' as const },
  { label: '1 Year', value: '1y' as const },
  { label: '2 Years', value: '2y' as const },
  { label: '5 Years', value: '5y' as const },
]

const EXAMPLE_SYMBOLS = ['AAPL', 'MSFT', 'BHP.AX', 'CBA.AX', 'BTC-USD', 'ETH-USD', 'TSLA', 'NVDA']

function KpiCard({ label, value, sub, positive, icon }: { label: string; value: string; sub?: string; positive?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <p className={clsx(
        'text-2xl font-bold font-mono',
        positive === true ? 'text-bull' : positive === false ? 'text-bear' : 'text-text-primary'
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}

export default function Backtest() {
  const [symbol, setSymbol] = useState('')
  const [strategyId, setStrategyId] = useState<number | null>(null)
  const [period, setPeriod] = useState<'3m' | '6m' | '1y' | '2y' | '5y'>('1y')
  const [capital, setCapital] = useState('10000')
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [savedResults, setSavedResults] = useState<BacktestResult[]>([])

  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategiesApi.getStrategies(),
  })

  const runMutation = useMutation({
    mutationFn: () => backtestApi.runBacktest({
      symbol: symbol.toUpperCase(),
      strategy_id: strategyId!,
      period,
      initial_capital: parseFloat(capital) || 10000,
    }),
    onSuccess: (data) => {
      setResult(data)
      setSavedResults(prev => [data, ...prev.slice(0, 4)])
    },
  })

  const canRun = symbol.length >= 1 && strategyId !== null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Backtesting Lab</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Test any strategy against historical data before following its signals
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Config panel */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Configuration</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Symbol */}
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Symbol</label>
                <Input
                  placeholder="e.g. AAPL, BHP.AX, BTC-USD"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {EXAMPLE_SYMBOLS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSymbol(s)}
                      className="px-2 py-0.5 text-xs bg-bg-secondary border border-border rounded hover:border-border-light text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strategy */}
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Strategy</label>
                <div className="space-y-1.5">
                  {strategies?.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStrategyId(s.id)}
                      className={clsx(
                        'w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                        strategyId === s.id
                          ? 'border-accent-blue bg-accent-blue/5 text-text-primary'
                          : 'border-border hover:border-border-light text-text-secondary'
                      )}
                    >
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className={clsx(
                        'text-xs',
                        s.win_rate >= 60 ? 'text-bull' : s.win_rate >= 45 ? 'text-yellow-400' : 'text-bear'
                      )}>
                        {s.win_rate.toFixed(0)}% win
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Period */}
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Period</label>
                <div className="grid grid-cols-3 gap-1">
                  {PERIODS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPeriod(p.value)}
                      className={clsx(
                        'py-1.5 rounded-lg text-xs font-medium transition-colors',
                        period === p.value
                          ? 'bg-accent-blue text-white'
                          : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border'
                      )}
                    >
                      {p.value.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capital */}
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Starting Capital ($)</label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={capital}
                  onChange={e => setCapital(e.target.value)}
                  min="100"
                />
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={() => runMutation.mutate()}
                loading={runMutation.isPending}
                disabled={!canRun}
              >
                <Play className="h-4 w-4" />
                Run Backtest
              </Button>
            </CardContent>
          </Card>

          {/* Previous results */}
          {savedResults.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <h3 className="font-semibold text-text-primary text-sm">Recent Runs</h3>
              </CardHeader>
              <div className="divide-y divide-border">
                {savedResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setResult(r)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{r.symbol}</p>
                      <p className="text-xs text-text-muted">{r.strategy_name} · {r.period}</p>
                    </div>
                    <span className={clsx(
                      'text-sm font-bold',
                      r.total_return_pct >= 0 ? 'text-bull' : 'text-bear'
                    )}>
                      {r.total_return_pct >= 0 ? '+' : ''}{r.total_return_pct.toFixed(1)}%
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Results panel */}
        <div className="xl:col-span-3 space-y-6">
          {runMutation.isPending ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Spinner size="lg" />
              <p className="text-text-secondary">Running backtest on {symbol}…</p>
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <BarChart2 className="h-16 w-16 text-text-muted" />
              <p className="text-text-secondary font-medium">Configure and run a backtest to see results</p>
              <p className="text-sm text-text-muted">Test strategies against historical market data</p>
            </div>
          ) : (
            <>
              {/* Result header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {result.symbol} — {result.strategy_name}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {result.start_date} → {result.end_date} · Starting capital: ${result.initial_capital.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* KPI grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard
                  label="Total Return"
                  value={`${result.total_return_pct >= 0 ? '+' : ''}${result.total_return_pct.toFixed(1)}%`}
                  sub={`vs ${result.benchmark_return_pct.toFixed(1)}% B&H`}
                  positive={result.total_return_pct >= 0}
                  icon={<TrendingDown className="h-4 w-4" />}
                />
                <KpiCard
                  label="Sharpe Ratio"
                  value={result.sharpe_ratio.toFixed(2)}
                  sub={result.sharpe_ratio >= 1 ? 'Good' : 'Below avg'}
                  positive={result.sharpe_ratio >= 1}
                  icon={<BarChart2 className="h-4 w-4" />}
                />
                <KpiCard
                  label="Max Drawdown"
                  value={`${result.max_drawdown.toFixed(1)}%`}
                  positive={false}
                  icon={<TrendingDown className="h-4 w-4" />}
                />
                <KpiCard
                  label="Win Rate"
                  value={`${result.win_rate.toFixed(1)}%`}
                  sub={`${result.winning_trades}W / ${result.losing_trades}L`}
                  positive={result.win_rate >= 50}
                  icon={<Trophy className="h-4 w-4" />}
                />
                <KpiCard
                  label="Total Trades"
                  value={String(result.total_trades)}
                  icon={<Percent className="h-4 w-4" />}
                />
                <KpiCard
                  label="Profit Factor"
                  value={result.profit_factor.toFixed(2)}
                  sub={result.profit_factor >= 1.5 ? 'Excellent' : result.profit_factor >= 1 ? 'Profitable' : 'Losing'}
                  positive={result.profit_factor >= 1}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              {/* Charts */}
              <BacktestChart result={result} />

              {/* Trade list */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-text-primary">Trade History ({result.trades.length} trades)</h3>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-5 py-3 text-xs text-text-muted font-medium">Type</th>
                        <th className="text-left px-5 py-3 text-xs text-text-muted font-medium">Entry</th>
                        <th className="text-left px-5 py-3 text-xs text-text-muted font-medium">Exit</th>
                        <th className="text-right px-5 py-3 text-xs text-text-muted font-medium">Entry $</th>
                        <th className="text-right px-5 py-3 text-xs text-text-muted font-medium">Exit $</th>
                        <th className="text-right px-5 py-3 text-xs text-text-muted font-medium">P&L</th>
                        <th className="text-right px-5 py-3 text-xs text-text-muted font-medium">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.trades.slice(0, 20).map(trade => (
                        <tr key={trade.id} className="hover:bg-bg-hover/30 transition-colors">
                          <td className="px-5 py-3">
                            <span className={clsx(
                              'px-2 py-0.5 rounded text-xs font-bold',
                              trade.signal_type === 'BUY' ? 'bg-bull/20 text-bull' : 'bg-bear/20 text-bear'
                            )}>
                              {trade.signal_type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-text-secondary text-xs">{trade.entry_date}</td>
                          <td className="px-5 py-3 text-text-secondary text-xs">{trade.exit_date}</td>
                          <td className="px-5 py-3 text-right font-mono text-text-primary">${trade.entry_price.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right font-mono text-text-primary">${trade.exit_price.toFixed(2)}</td>
                          <td className={clsx('px-5 py-3 text-right font-mono font-semibold', trade.pnl >= 0 ? 'text-bull' : 'text-bear')}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)} ({trade.pnl_pct >= 0 ? '+' : ''}{trade.pnl_pct.toFixed(1)}%)
                          </td>
                          <td className="px-5 py-3 text-right text-text-muted">{trade.holding_days}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.trades.length > 20 && (
                    <p className="text-center py-3 text-xs text-text-muted">Showing 20 of {result.trades.length} trades</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
