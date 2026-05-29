import { useState } from 'react'
import { Plus, Trash2, Play, GripVertical } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Select, Input } from '../ui/Input'

type IndicatorType = 'RSI' | 'SMA' | 'EMA' | 'MACD' | 'BB' | 'VOLUME' | 'ROC' | 'ATR'
type Condition = 'crosses_above' | 'crosses_below' | 'greater_than' | 'less_than' | 'equals'
type Logic = 'AND' | 'OR'

interface IndicatorBlock {
  id: string
  type: IndicatorType
  period?: number
  value?: number
  condition: Condition
  targetType: 'value' | 'indicator'
  targetValue?: number
  targetIndicator?: string
}

interface StrategyBuilderProps {
  onRunBacktest?: (strategy: { name: string; blocks: IndicatorBlock[] }) => void
}

const INDICATORS: IndicatorType[] = ['RSI', 'SMA', 'EMA', 'MACD', 'BB', 'VOLUME', 'ROC', 'ATR']

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'crosses_above', label: 'crosses above' },
  { value: 'crosses_below', label: 'crosses below' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'equals', label: 'equals' },
]

const DEFAULT_PERIODS: Record<IndicatorType, number> = {
  RSI: 14, SMA: 50, EMA: 20, MACD: 12, BB: 20, VOLUME: 20, ROC: 10, ATR: 14,
}

export default function StrategyBuilder({ onRunBacktest }: StrategyBuilderProps) {
  const [strategyName, setStrategyName] = useState('My Custom Strategy')
  const [entryBlocks, setEntryBlocks] = useState<IndicatorBlock[]>([
    {
      id: '1',
      type: 'RSI',
      period: 14,
      condition: 'crosses_above',
      targetType: 'value',
      targetValue: 30,
    },
  ])
  const [exitBlocks, setExitBlocks] = useState<IndicatorBlock[]>([
    {
      id: '2',
      type: 'RSI',
      period: 14,
      condition: 'crosses_above',
      targetType: 'value',
      targetValue: 70,
    },
  ])
  const [logic, setLogic] = useState<Logic>('AND')
  const [timeframe, setTimeframe] = useState('1D')
  const [activeSection, setActiveSection] = useState<'entry' | 'exit'>('entry')

  const addBlock = (section: 'entry' | 'exit') => {
    const newBlock: IndicatorBlock = {
      id: Date.now().toString(),
      type: 'RSI',
      period: 14,
      condition: 'greater_than',
      targetType: 'value',
      targetValue: 50,
    }
    if (section === 'entry') {
      setEntryBlocks((prev) => [...prev, newBlock])
    } else {
      setExitBlocks((prev) => [...prev, newBlock])
    }
  }

  const removeBlock = (section: 'entry' | 'exit', id: string) => {
    if (section === 'entry') {
      setEntryBlocks((prev) => prev.filter((b) => b.id !== id))
    } else {
      setExitBlocks((prev) => prev.filter((b) => b.id !== id))
    }
  }

  const updateBlock = (section: 'entry' | 'exit', id: string, updates: Partial<IndicatorBlock>) => {
    const setter = section === 'entry' ? setEntryBlocks : setExitBlocks
    setter((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, ...updates, ...(updates.type ? { period: DEFAULT_PERIODS[updates.type as IndicatorType] } : {}) }
          : b
      )
    )
  }

  const blocks = activeSection === 'entry' ? entryBlocks : exitBlocks

  return (
    <div className="space-y-5">
      {/* Strategy name + timeframe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Strategy Name"
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          placeholder="e.g. RSI + Volume Breakout"
        />
        <Select
          label="Timeframe"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          {['1M', '5M', '15M', '1H', '4H', '1D', '1W'].map((tf) => (
            <option key={tf} value={tf}>{tf}</option>
          ))}
        </Select>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {(['entry', 'exit'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
              activeSection === s
                ? s === 'entry' ? 'bg-bull/10 text-bull border border-bull/30' : 'bg-bear/10 text-bear border border-bear/30'
                : 'text-text-secondary hover:text-text-primary border border-border hover:bg-bg-card'
            }`}
          >
            {s === 'entry' ? '▲ Entry Conditions' : '▼ Exit Conditions'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted">Logic:</span>
          {(['AND', 'OR'] as Logic[]).map((l) => (
            <button
              key={l}
              onClick={() => setLogic(l)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                logic === l ? 'bg-accent-blue text-white' : 'text-text-muted border border-border hover:text-text-primary'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Condition blocks */}
      <Card>
        <CardContent className="space-y-3">
          {blocks.map((block, idx) => (
            <div key={block.id}>
              {idx > 0 && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="px-3 py-1 text-xs font-bold bg-bg-primary border border-border rounded-full text-text-muted">
                    {logic}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap p-3 bg-bg-secondary rounded-xl border border-border">
                <GripVertical className="h-4 w-4 text-text-muted flex-shrink-0 cursor-grab" />

                {/* Indicator type */}
                <select
                  value={block.type}
                  onChange={(e) => updateBlock(activeSection, block.id, { type: e.target.value as IndicatorType })}
                  className="bg-bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                >
                  {INDICATORS.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>

                {/* Period */}
                {['RSI', 'SMA', 'EMA', 'BB', 'VOLUME', 'ROC', 'ATR'].includes(block.type) && (
                  <input
                    type="number"
                    value={block.period}
                    onChange={(e) => updateBlock(activeSection, block.id, { period: parseInt(e.target.value) })}
                    className="w-16 bg-bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                    placeholder="Period"
                  />
                )}

                {/* Condition */}
                <select
                  value={block.condition}
                  onChange={(e) => updateBlock(activeSection, block.id, { condition: e.target.value as Condition })}
                  className="bg-bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                >
                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>

                {/* Target value */}
                <input
                  type="number"
                  value={block.targetValue}
                  onChange={(e) => updateBlock(activeSection, block.id, { targetValue: parseFloat(e.target.value) })}
                  className="w-24 bg-bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  placeholder="Value"
                />

                <button
                  onClick={() => removeBlock(activeSection, block.id)}
                  className="ml-auto p-1.5 text-text-muted hover:text-bear hover:bg-bear/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => addBlock(activeSection)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-accent-blue hover:bg-accent-blue/5 rounded-xl border border-dashed border-accent-blue/30 hover:border-accent-blue/50 w-full justify-center transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Condition
          </button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={() => onRunBacktest?.({ name: strategyName, blocks: [...entryBlocks, ...exitBlocks] })}
          className="flex-1"
        >
          <Play className="h-4 w-4" />
          Run Backtest
        </Button>
        <Button variant="secondary">
          Save Strategy
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-secondary">Strategy Logic Preview</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 font-mono text-xs">
            <p className="text-bull">// ENTRY: Buy when...</p>
            {entryBlocks.map((b, i) => (
              <p key={b.id} className="text-text-primary">
                {i > 0 ? <span className="text-accent-blue">{logic} </span> : null}
                {b.type}({b.period}) {CONDITIONS.find((c) => c.value === b.condition)?.label} {b.targetValue}
              </p>
            ))}
            <p className="text-bear mt-2">// EXIT: Sell when...</p>
            {exitBlocks.map((b, i) => (
              <p key={b.id} className="text-text-primary">
                {i > 0 ? <span className="text-accent-blue">{logic} </span> : null}
                {b.type}({b.period}) {CONDITIONS.find((c) => c.value === b.condition)?.label} {b.targetValue}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
