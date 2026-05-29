import apiClient from './client'

export interface Trade {
  id: number
  symbol: string
  action: string
  price: number
  quantity: number
  trade_date: string
  notes?: string
  signal_id?: number
  broker?: string
}

export interface AddTradeRequest {
  symbol: string
  action: 'BUY' | 'SELL'
  price: number
  quantity: number
  trade_date: string
  notes?: string
  signal_id?: number
  broker?: string
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

function normalisePerfResponse(raw: any): PortfolioPerformance {
  return {
    total_invested: raw.total_invested ?? 0,
    current_value: raw.current_value ?? 0,
    total_pnl: raw.total_pnl ?? 0,
    total_pnl_pct: raw.total_return_pct ?? 0,
    day_pnl: 0,
    day_pnl_pct: 0,
    win_rate: raw.win_rate ?? 0,
    total_trades: raw.total_trades ?? 0,
    winning_trades: raw.open_positions?.filter((p: any) => (p.unrealised_pnl ?? 0) > 0).length ?? 0,
    losing_trades: raw.open_positions?.filter((p: any) => (p.unrealised_pnl ?? 0) < 0).length ?? 0,
  }
}

export const portfolioApi = {
  getTrades: async (): Promise<Trade[]> => {
    const resp = await apiClient.get<Trade[]>('/portfolio')
    return resp.data
  },

  addTrade: async (data: AddTradeRequest): Promise<Trade> => {
    const resp = await apiClient.post<Trade>('/portfolio/trade', data)
    return resp.data
  },

  deleteTrade: async (id: number): Promise<void> => {
    await apiClient.delete(`/portfolio/trade/${id}`)
  },

  getHoldings: async (): Promise<Holding[]> => {
    // Derive holdings from portfolio performance open positions
    const resp = await apiClient.get<any>('/portfolio/performance')
    const open = resp.data.open_positions ?? []
    return open.map((p: any) => ({
      symbol: p.symbol,
      asset_name: p.symbol,
      quantity: p.quantity,
      avg_buy_price: p.buy_price,
      current_price: p.current_price ?? p.buy_price,
      cost_basis: p.cost_basis,
      current_value: p.current_price ? p.current_price * p.quantity : p.cost_basis,
      pnl: p.unrealised_pnl ?? 0,
      pnl_pct: p.unrealised_pct ?? 0,
      day_change: 0,
      day_change_pct: 0,
    }))
  },

  getPerformance: async (): Promise<PortfolioPerformance> => {
    const resp = await apiClient.get<any>('/portfolio/performance')
    return normalisePerfResponse(resp.data)
  },

  getPaperPerformance: async (): Promise<PaperPerformance> => {
    // Paper trading not yet implemented server-side — return placeholder
    return {
      initial_capital: 10000,
      current_value: 10000,
      total_return: 0,
      total_return_pct: 0,
      signals_followed: 0,
      win_rate: 0,
      equity_curve: [],
    }
  },
}
