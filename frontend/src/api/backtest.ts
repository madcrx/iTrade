import apiClient from './client'

export interface BacktestRequest {
  symbol: string
  strategy_id: number
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

export const backtestApi = {
  runBacktest: async (request: BacktestRequest): Promise<BacktestResult> => {
    const resp = await apiClient.post<BacktestResult>('/backtest/run', request)
    return resp.data
  },

  getResults: async (): Promise<BacktestResult[]> => {
    const resp = await apiClient.get<BacktestResult[]>('/backtest/results')
    return resp.data
  },

  getResult: async (id: number): Promise<BacktestResult> => {
    const resp = await apiClient.get<BacktestResult>(`/backtest/results/${id}`)
    return resp.data
  },

  deleteResult: async (id: number): Promise<void> => {
    await apiClient.delete(`/backtest/results/${id}`)
  },
}
