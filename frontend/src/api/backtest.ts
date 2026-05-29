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

function normalise(raw: any): BacktestResult {
  const r = raw.results ?? {}
  return {
    id: raw.id,
    symbol: raw.symbol,
    strategy_name: raw.strategy,
    period: raw.period,
    start_date: r.start_date ?? '',
    end_date: r.end_date ?? '',
    initial_capital: r.initial_capital ?? 10000,
    final_value: r.final_value ?? 0,
    total_return: r.total_return ?? 0,
    total_return_pct: r.total_return_pct ?? 0,
    benchmark_return: r.benchmark_return ?? 0,
    benchmark_return_pct: r.benchmark_return_pct ?? 0,
    sharpe_ratio: r.sharpe_ratio ?? 0,
    max_drawdown: r.max_drawdown ?? 0,
    win_rate: r.win_rate ?? 0,
    total_trades: r.total_trades ?? 0,
    winning_trades: r.winning_trades ?? 0,
    losing_trades: r.losing_trades ?? 0,
    avg_win: r.avg_win ?? 0,
    avg_loss: r.avg_loss ?? 0,
    profit_factor: r.profit_factor ?? 1,
    equity_curve: r.equity_curve ?? [],
    trades: r.trades ?? [],
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
}
