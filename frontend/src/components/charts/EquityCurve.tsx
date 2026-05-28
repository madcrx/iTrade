import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatShortDate } from '../../utils/formatters'

interface EquityPoint {
  date: string
  value: number
}

interface EquityCurveProps {
  data: EquityPoint[]
  height?: number
  color?: string
  label?: string
}

export default function EquityCurve({ data, height = 200, color = '#3b82f6', label = 'Value' }: EquityCurveProps) {
  const chartData = data.map((pt) => ({
    ...pt,
    date: formatShortDate(pt.date),
  }))

  const isPositive = data.length > 1 && data[data.length - 1].value >= data[0].value

  const lineColor = isPositive ? '#10b981' : '#ef4444'
  const gradientId = `ec-${label.replace(/\s/g, '')}`

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrency(v, 'USD', 0)}
            width={70}
          />
          <Tooltip
            formatter={(v: number) => [formatCurrency(v), label]}
            contentStyle={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f9fafb',
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            name={label}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
