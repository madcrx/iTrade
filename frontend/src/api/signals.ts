import apiClient from './client'

export type SignalType = 'BUY' | 'SELL'
export type AssetClass = 'US_STOCK' | 'ASX_STOCK' | 'CRYPTO' | 'ETF'

export interface Signal {
  id: number
  symbol: string
  asset_name: string
  asset_class: AssetClass
  signal_type: SignalType
  current_price: number
  entry_price: number
  stop_loss: number
  take_profit: number
  signal_strength: number  // 1-10
  strategy_name: string
  reasoning: string
  indicators: Record<string, number | string>
  created_at: string
  expires_at?: string
  is_active: boolean
}

export interface SignalFilters {
  symbol?: string
  asset_class?: AssetClass
  signal_type?: SignalType
  strategy?: string
  limit?: number
  offset?: number
}

export const signalsApi = {
  getSignals: async (filters?: SignalFilters): Promise<Signal[]> => {
    const resp = await apiClient.get<Signal[]>('/signals', { params: filters })
    return resp.data
  },

  getSignal: async (id: number): Promise<Signal> => {
    const resp = await apiClient.get<Signal>(`/signals/${id}`)
    return resp.data
  },

  getSignalsBySymbol: async (symbol: string): Promise<Signal[]> => {
    const resp = await apiClient.get<Signal[]>(`/signals/symbol/${symbol}`)
    return resp.data
  },

  generateSignals: async (symbol: string): Promise<Signal[]> => {
    const resp = await apiClient.post<Signal[]>(`/signals/generate`, { symbol })
    return resp.data
  },

  getDashboardStats: async (): Promise<{
    signals_today: number
    active_signals: number
    watchlist_count: number
    active_strategies: number
    paper_value: number
    paper_pnl: number
    paper_pnl_pct: number
  }> => {
    const resp = await apiClient.get('/signals/stats/dashboard')
    return resp.data
  },
}
