import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { BacktestResult } from '../../api/backtest'
import { formatCurrency, formatShortDate } from '../../utils/formatters'

interface BacktestChartProps {
  result: BacktestResult
  height?: number
}

const EquityTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-text-secondary mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function BacktestChart({ result, height = 300 }: BacktestChartProps) {
  const chartData = result.equity_curve.map((pt) => ({
    ...pt,
    date: formatShortDate(pt.date),
    drawdown_pct: -(pt.drawdown * 100),
  }))

  return (
    <div className="space-y-4">
      {/* Equity curve */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Equity Curve</p>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="stratGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="benchGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, 'USD', 0)}
                width={75}
              />
              <Tooltip content={<EquityTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="benchmark_value"
                stroke="#6b7280"
                strokeWidth={1.5}
                fill="url(#benchGradient)"
                name="Buy & Hold"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="strategy_value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#stratGradient)"
                name="Strategy"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drawdown */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Drawdown</p>
        <div style={{ height: height * 0.4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
                width={55}
              />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']} />
              <Area
                type="monotone"
                dataKey="drawdown_pct"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="url(#ddGradient)"
                name="Drawdown"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
