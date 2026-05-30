import apiClient from './client'

export interface BacktestRequest {
  symbol: string
  strategy: string       // strategy name, e.g. "golden_cross"
  period: '3m' | '6m' | '1y' | '2y' | '5y'
  initial_capital?: number
}

export interface BacktestTrade {
  id: number
  entry_date: string
  exit_date: string
  entry_price: number
  exit_price: number
  signal_type: 'BUY' | 'SELL'
  quantity: number
  pnl: number
  pnl_pct: number
  holding_days: number
}

export interface EquityPoint {
  date: string
  strategy_value: number
  benchmark_value: number
  drawdown: number
}

export interface BacktestResult {
  id: number
  symbol: string
  strategy_name: string
  period: string
  start_date: string
  end_date: string
  initial_capital: number
  final_value: number
  total_return: number
  total_return_pct: number
  benchmark_return: number
  benchmark_return_pct: number
  sharpe_ratio: number
  max_drawdown: number
  win_rate: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  avg_win: number
  avg_loss: number
  profit_factor: number
  equity_curve: EquityPoint[]
  trades: BacktestTrade[]
  created_at: string
}

function normaliseTrade(t: any, idx: number, initialCapital: number): BacktestTrade {
  const entryPrice = Number(t.entry_price ?? 0)
  const exitPrice = Number(t.exit_price ?? 0)
  const retPct = Number(t.return_pct ?? t.pnl_pct ?? 0)
  // approximate quantity from initial capital split per trade
  const quantity = entryPrice > 0 ? Math.floor(initialCapital / entryPrice) : 0
  const pnl = t.pnl != null ? Number(t.pnl) : (exitPrice - entryPrice) * quantity
  return {
    id: t.id ?? idx,
    entry_date: String(t.entry_date ?? ''),
    exit_date: String(t.exit_date ?? ''),
    entry_price: entryPrice,
    exit_price: exitPrice,
    signal_type: (t.signal_type ?? (retPct >= 0 ? 'BUY' : 'SELL')) as 'BUY' | 'SELL',
    quantity,
    pnl,
    pnl_pct: retPct,
    holding_days: Number(t.duration_days ?? t.holding_days ?? 0),
  }
}

function normaliseEquityCurve(curve: any[], initialCapital: number): EquityPoint[] {
  if (!Array.isArray(curve)) return []
  return curve.map((p) => ({
    date: String(p.date ?? ''),
    strategy_value: Number(p.value ?? p.strategy_value ?? initialCapital),
    benchmark_value: Number(p.benchmark_value ?? initialCapital),
    drawdown: Number(p.drawdown ?? 0),
  }))
}

function normalise(raw: any): BacktestResult {
  const r = raw.results ?? {}
  const initialCapital = Number(r.initial_capital ?? 10000)
  const trades = Array.isArray(r.trades) ? r.trades : []
  const normalisedTrades = trades.map((t: any, i: number) => normaliseTrade(t, i, initialCapital))
  const winning = normalisedTrades.filter((t) => t.pnl_pct > 0)
  const losing = normalisedTrades.filter((t) => t.pnl_pct <= 0)
  const grossProfit = winning.reduce((s, t) => s + Math.abs(t.pnl), 0)
  const grossLoss = losing.reduce((s, t) => s + Math.abs(t.pnl), 0)
  return {
    id: raw.id ?? 0,
    symbol: raw.symbol ?? r.symbol ?? '',
    strategy_name: raw.strategy ?? r.strategy ?? '',
    period: raw.period ?? r.period ?? '',
    start_date: String(r.start_date ?? normalisedTrades[0]?.entry_date ?? ''),
    end_date: String(r.end_date ?? normalisedTrades[normalisedTrades.length - 1]?.exit_date ?? ''),
    initial_capital: initialCapital,
    final_value: Number(r.final_value ?? initialCapital * (1 + (r.total_return_pct ?? 0) / 100)),
    total_return: Number(r.total_return ?? initialCapital * (r.total_return_pct ?? 0) / 100),
    total_return_pct: Number(r.total_return_pct ?? 0),
    benchmark_return: Number(r.benchmark_return ?? 0),
    benchmark_return_pct: Number(r.benchmark_return_pct ?? 0),
    sharpe_ratio: Number(r.sharpe_ratio ?? 0),
    max_drawdown: Number(r.max_drawdown ?? r.max_drawdown_pct ?? 0),
    win_rate: Number(r.win_rate ?? 0),
    total_trades: Number(r.total_trades ?? normalisedTrades.length),
    winning_trades: winning.length,
    losing_trades: losing.length,
    avg_win: winning.length ? grossProfit / winning.length : 0,
    avg_loss: losing.length ? grossLoss / losing.length : 0,
    profit_factor: grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0),
    equity_curve: normaliseEquityCurve(r.equity_curve ?? [], initialCapital),
    trades: normalisedTrades,
    created_at: raw.created_at ?? '',
  }
}

export const backtestApi = {
  runBacktest: async (request: BacktestRequest): Promise<BacktestResult> => {
    const resp = await apiClient.post<any>('/backtest', request)
    return normalise(resp.data)
  },

  getResults: async (): Promise<BacktestResult[]> => {
    const resp = await apiClient.get<any[]>('/backtest/results')
    return resp.data.map(normalise)
  },

  getResult: async (id: number): Promise<BacktestResult> => {
    const resp = await apiClient.get<any>(`/backtest/results/${id}`)
    return normalise(resp.data)
  },

  saveResults: async (_result: BacktestResult): Promise<void> => {
    // Results are saved server-side on runBacktest — no-op here
  },

  deleteResult: async (_id: number): Promise<void> => {
    // No delete endpoint server-side yet — no-op
  },
}
