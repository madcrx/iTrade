import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, TrendingUp, DollarSign, BarChart2, Activity } from 'lucide-react'
import { portfolioApi } from '../api/portfolio'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardContent, StatCard } from '../components/ui/Card'
import { SimpleTabs as Tabs } from '../components/ui/Tabs'
import { Spinner } from '../components/ui/Spinner'
import AddTradeModal from '../components/portfolio/AddTradeModal'
import EquityCurve from '../components/charts/EquityCurve'
import { clsx } from 'clsx'

export default function Portfolio() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'live' | 'paper'>('live')
  const [addTradeOpen, setAddTradeOpen] = useState(false)

  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['portfolio-performance'],
    queryFn: () => portfolioApi.getPerformance(),
  })

  const { data: paper, isLoading: paperLoading } = useQuery({
    queryKey: ['paper-performance'],
    queryFn: () => portfolioApi.getPaperPerformance(),
    enabled: tab === 'paper',
  })

  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: ['portfolio-holdings'],
    queryFn: () => portfolioApi.getHoldings(),
    enabled: tab === 'live',
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Portfolio</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track your trades and paper performance</p>
        </div>
        <Button onClick={() => setAddTradeOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Log Trade
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: 'Trade Log', value: 'live' },
          { label: 'Paper Simulation', value: 'paper' },
        ]}
        active={tab}
        onChange={v => setTab(v as 'live' | 'paper')}
      />

      {tab === 'live' && (
        <>
          {/* KPIs */}
          {perfLoading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : performance ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Current Value"
                value={`$${performance.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                change={`Invested $${performance.total_invested.toLocaleString()}`}
                changePositive={true}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <StatCard
                label="Total P&L"
                value={`${performance.total_pnl >= 0 ? '+' : ''}$${performance.total_pnl.toFixed(2)}`}
                change={`${performance.total_pnl_pct >= 0 ? '+' : ''}${performance.total_pnl_pct.toFixed(2)}%`}
                changePositive={performance.total_pnl >= 0}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <StatCard
                label="Day P&L"
                value={`${performance.day_pnl >= 0 ? '+' : ''}$${performance.day_pnl.toFixed(2)}`}
                change={`${performance.day_pnl_pct >= 0 ? '+' : ''}${performance.day_pnl_pct.toFixed(2)}% today`}
                changePositive={performance.day_pnl >= 0}
                icon={<Activity className="h-4 w-4" />}
              />
              <StatCard
                label="Win Rate"
                value={`${performance.win_rate.toFixed(1)}%`}
                change={`${performance.winning_trades}W / ${performance.losing_trades}L`}
                changePositive={performance.win_rate >= 50}
                icon={<BarChart2 className="h-4 w-4" />}
              />
            </div>
          ) : null}

          {/* Holdings */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Current Holdings</h2>
            </CardHeader>
            {holdingsLoading ? (
              <CardContent className="flex justify-center py-10"><Spinner size="lg" /></CardContent>
            ) : !holdings || holdings.length === 0 ? (
              <CardContent className="text-center py-16">
                <BarChart2 className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">No holdings yet</p>
                <p className="text-sm text-text-muted mt-1">Log your first trade to track performance</p>
                <Button className="mt-4" onClick={() => setAddTradeOpen(true)}>
                  <PlusCircle className="h-4 w-4" /> Log First Trade
                </Button>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Symbol', 'Qty', 'Avg Cost', 'Current', 'Cost Basis', 'Value', 'P&L', 'Return', 'Today'].map(h => (
                        <th key={h} className={clsx(
                          'px-5 py-3 text-xs text-text-muted font-medium',
                          ['Qty', 'Avg Cost', 'Current', 'Cost Basis', 'Value', 'P&L', 'Return', 'Today'].includes(h) ? 'text-right' : 'text-left'
                        )}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {holdings.map(h => (
                      <tr key={h.symbol} className="hover:bg-bg-hover/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-text-primary">{h.symbol}</p>
                          <p className="text-xs text-text-muted truncate max-w-24">{h.asset_name}</p>
                        </td>
                        <td className="px-5 py-4 text-right text-text-primary font-mono">{h.quantity}</td>
                        <td className="px-5 py-4 text-right text-text-primary font-mono">${h.avg_buy_price.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right text-text-primary font-mono">${h.current_price.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right text-text-secondary">${h.cost_basis.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right text-text-primary font-semibold">${h.current_value.toFixed(2)}</td>
                        <td className={clsx('px-5 py-4 text-right font-semibold font-mono', h.pnl >= 0 ? 'text-bull' : 'text-bear')}>
                          {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)}
                        </td>
                        <td className={clsx('px-5 py-4 text-right font-semibold', h.pnl_pct >= 0 ? 'text-bull' : 'text-bear')}>
                          {h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct.toFixed(2)}%
                        </td>
                        <td className={clsx('px-5 py-4 text-right text-sm', h.day_change_pct >= 0 ? 'text-bull' : 'text-bear')}>
                          {h.day_change_pct >= 0 ? '+' : ''}{h.day_change_pct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Trade history logged */}
        </>
      )}

      {tab === 'paper' && (
        <>
          {paperLoading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : paper ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Paper Value"
                  value={`$${paper.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  change={`Started $${paper.initial_capital.toLocaleString()}`}
                  changePositive={true}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <StatCard
                  label="Paper Return"
                  value={`${paper.total_return_pct >= 0 ? '+' : ''}${paper.total_return_pct.toFixed(2)}%`}
                  change={`$${paper.total_return >= 0 ? '+' : ''}${paper.total_return.toFixed(2)}`}
                  changePositive={paper.total_return_pct >= 0}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatCard
                  label="Signals Followed"
                  value={String(paper.signals_followed)}
                  icon={<Activity className="h-4 w-4" />}
                />
                <StatCard
                  label="Win Rate"
                  value={`${paper.win_rate.toFixed(1)}%`}
                  changePositive={paper.win_rate >= 50}
                  icon={<BarChart2 className="h-4 w-4" />}
                />
              </div>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-text-primary">Paper Portfolio Equity Curve</h2>
                </CardHeader>
                <CardContent>
                  <EquityCurve data={paper.equity_curve.map(p => ({ date: p.date, value: p.value }))} height={300} />
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-text-secondary">No paper trading data yet. Signals will automatically be tracked.</p>
            </div>
          )}
        </>
      )}

      <AddTradeModal
        isOpen={addTradeOpen}
        onClose={() => setAddTradeOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['portfolio-trades', 'portfolio-holdings', 'portfolio-performance'] })
          setAddTradeOpen(false)
        }}
      />
    </div>
  )
}
