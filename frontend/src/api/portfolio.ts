import apiClient from './client'

export interface Trade {
  id: number
  symbol: string
  asset_name: string
  trade_type: 'BUY' | 'SELL'
  price: number
  quantity: number
  total_value: number
  trade_date: string
  notes?: string
  signal_id?: number
  current_price?: number
  current_value?: number
  pnl?: number
  pnl_pct?: number
}

export interface AddTradeRequest {
  symbol: string
  trade_type: 'BUY' | 'SELL'
  price: number
  quantity: number
  trade_date: string
  notes?: string
  signal_id?: number
}

export interface Holding {
  symbol: string
  asset_name: string
  quantity: number
  avg_buy_price: number
  current_price: number
  cost_basis: number
  current_value: number
  pnl: number
  pnl_pct: number
  day_change: number
  day_change_pct: number
}

export interface PortfolioPerformance {
  total_invested: number
  current_value: number
  total_pnl: number
  total_pnl_pct: number
  day_pnl: number
  day_pnl_pct: number
  win_rate: number
  total_trades: number
  winning_trades: number
  losing_trades: number
}

export interface PaperPerformance {
  initial_capital: number
  current_value: number
  total_return: number
  total_return_pct: number
  signals_followed: number
  win_rate: number
  equity_curve: { date: string; value: number }[]
}

export const portfolioApi = {
  getTrades: async (): Promise<Trade[]> => {
    const resp = await apiClient.get<Trade[]>('/portfolio/trades')
    return resp.data
  },

  addTrade: async (data: AddTradeRequest): Promise<Trade> => {
    const resp = await apiClient.post<Trade>('/portfolio/trades', data)
    return resp.data
  },

  deleteTrade: async (id: number): Promise<void> => {
    await apiClient.delete(`/portfolio/trades/${id}`)
  },

  getHoldings: async (): Promise<Holding[]> => {
    const resp = await apiClient.get<Holding[]>('/portfolio/holdings')
    return resp.data
  },

  getPerformance: async (): Promise<PortfolioPerformance> => {
    const resp = await apiClient.get<PortfolioPerformance>('/portfolio/performance')
    return resp.data
  },

  getPaperPerformance: async (): Promise<PaperPerformance> => {
    const resp = await apiClient.get<PaperPerformance>('/portfolio/paper')
    return resp.data
  },
}
