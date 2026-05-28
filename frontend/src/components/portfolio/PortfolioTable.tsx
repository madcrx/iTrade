import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'
import type { Holding } from '../../api/portfolio'
import { formatCurrency, formatPercent, getChangeBg } from '../../utils/formatters'

interface PortfolioTableProps {
  holdings: Holding[]
}

export default function PortfolioTable({ holdings }: PortfolioTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingUp className="h-12 w-12 text-text-muted mb-3" />
        <p className="text-text-secondary font-medium">No holdings yet</p>
        <p className="text-text-muted text-sm mt-1">Add trades to track your portfolio</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Asset</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Qty</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Avg Cost</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Current</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Value</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">P&L</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Day</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {holdings.map((h) => {
            const pnlPositive = h.pnl >= 0
            const dayPositive = h.day_change >= 0
            return (
              <tr key={h.symbol} className="hover:bg-bg-card/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-text-primary">{h.symbol}</p>
                    <p className="text-xs text-text-muted truncate max-w-[150px]">{h.asset_name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-primary">
                  {h.quantity.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-secondary">
                  {formatCurrency(h.avg_buy_price)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-primary font-semibold">
                  {formatCurrency(h.current_price)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-primary font-semibold">
                  {formatCurrency(h.current_value)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div>
                    <p className={clsx('font-semibold font-mono', pnlPositive ? 'text-bull' : 'text-bear')}>
                      {pnlPositive ? '+' : ''}{formatCurrency(h.pnl)}
                    </p>
                    <span className={clsx('text-xs px-1.5 py-0.5 rounded-full', getChangeBg(h.pnl_pct))}>
                      {formatPercent(h.pnl_pct)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {dayPositive ? (
                      <TrendingUp className="h-3.5 w-3.5 text-bull" />
                    ) : h.day_change < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-bear" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-text-muted" />
                    )}
                    <span className={clsx('text-sm font-medium', dayPositive ? 'text-bull' : h.day_change < 0 ? 'text-bear' : 'text-text-muted')}>
                      {formatPercent(h.day_change_pct)}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
