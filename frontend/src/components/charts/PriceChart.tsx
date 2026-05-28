import { useState, useMemo } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Bar,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { marketApi, type HistoricalBar } from '../../api/market'
import { SimpleTabs } from '../ui/Tabs'
import { Spinner } from '../ui/Spinner'
import { formatPrice, formatShortDate } from '../../utils/formatters'
import type { Signal } from '../../api/signals'

interface PriceChartProps {
  symbol: string
  signals?: Signal[]
  height?: number
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y'
type Overlay = 'sma50' | 'sma200' | 'bb' | 'rsi' | 'macd'

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '3M', label: '3M' },
  { id: '6M', label: '6M' },
  { id: '1Y', label: '1Y' },
]

// Custom tooltip
const PriceTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as HistoricalBar
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-text-secondary mb-2">{label}</p>
      {d.close && <p className="text-text-primary font-semibold">Close: {formatPrice(d.close)}</p>}
      {d.sma50 && <p className="text-blue-400">SMA 50: {formatPrice(d.sma50)}</p>}
      {d.sma200 && <p className="text-yellow-400">SMA 200: {formatPrice(d.sma200)}</p>}
      {d.rsi && <p className="text-purple-400">RSI: {d.rsi.toFixed(1)}</p>}
    </div>
  )
}

export default function PriceChart({ symbol, signals = [], height = 400 }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('3M')
  const [overlays, setOverlays] = useState<Overlay[]>(['sma50', 'sma200'])

  const { data: history, isLoading } = useQuery({
    queryKey: ['history', symbol, timeframe],
    queryFn: () => marketApi.getHistory(symbol, timeframe),
    staleTime: 60_000,
  })

  const toggleOverlay = (o: Overlay) => {
    setOverlays((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]))
  }

  const chartData = useMemo(() => {
    if (!history) return []
    return history.map((bar) => ({
      ...bar,
      date: formatShortDate(bar.date),
    }))
  }, [history])

  // Signal markers as reference lines
  const signalLines = useMemo(() => {
    if (!signals.length || !chartData.length) return []
    return signals.map((s) => ({
      date: formatShortDate(s.created_at),
      type: s.signal_type,
      price: s.entry_price,
    }))
  }, [signals, chartData])

  const showRsi = overlays.includes('rsi')
  const showMacd = overlays.includes('macd')
  const hasIndicatorPanel = showRsi || showMacd

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <SimpleTabs
          tabs={TIMEFRAMES}
          active={timeframe}
          onChange={(t) => setTimeframe(t as Timeframe)}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { id: 'sma50', label: 'SMA 50', color: '#3b82f6' },
              { id: 'sma200', label: 'SMA 200', color: '#eab308' },
              { id: 'bb', label: 'BB', color: '#8b5cf6' },
              { id: 'rsi', label: 'RSI', color: '#a855f7' },
              { id: 'macd', label: 'MACD', color: '#06b6d4' },
            ] as { id: Overlay; label: string; color: string }[]
          ).map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => toggleOverlay(id)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all font-medium ${
                overlays.includes(id)
                  ? 'border-transparent text-white'
                  : 'border-border text-text-muted hover:text-text-secondary'
              }`}
              style={overlays.includes(id) ? { background: color + '30', color, borderColor: color + '50' } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main price chart */}
      <div style={{ height: hasIndicatorPanel ? height * 0.6 : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatPrice(v)}
              width={70}
            />
            <Tooltip content={<PriceTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#6b7280', paddingTop: '8px' }}
            />

            {/* Signal markers */}
            {signalLines.map((s, i) => (
              <ReferenceLine
                key={i}
                x={s.date}
                stroke={s.type === 'BUY' ? '#10b981' : '#ef4444'}
                strokeDasharray="4 2"
                strokeWidth={1.5}
              />
            ))}

            {/* Price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Price"
              activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
            />

            {/* Overlays */}
            {overlays.includes('sma50') && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
                name="SMA 50"
              />
            )}
            {overlays.includes('sma200') && (
              <Line
                type="monotone"
                dataKey="sma200"
                stroke="#eab308"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
                name="SMA 200"
              />
            )}
            {overlays.includes('bb') && (
              <>
                <Line
                  type="monotone"
                  dataKey="bb_upper"
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="2 2"
                  name="BB Upper"
                />
                <Line
                  type="monotone"
                  dataKey="bb_lower"
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="2 2"
                  name="BB Lower"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI panel */}
      {showRsi && (
        <div style={{ height: height * 0.2 }}>
          <p className="text-xs text-text-muted mb-1 px-1">RSI (14)</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip formatter={(v: number) => [v?.toFixed(1), 'RSI']} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
              <Line type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={1.5} dot={false} name="RSI" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD panel */}
      {showMacd && (
        <div style={{ height: height * 0.2 }}>
          <p className="text-xs text-text-muted mb-1 px-1">MACD</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" hide />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="macd" fill="#06b6d4" opacity={0.6} name="MACD" />
              <Line type="monotone" dataKey="macd_signal" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
