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

function detectAssetClass(symbol: string): AssetClass {
  const s = symbol.toUpperCase()
  if (s.endsWith('.AX')) return 'ASX_STOCK'
  if (s.endsWith('-USD') || s.endsWith('-USDT')) return 'CRYPTO'
  return 'US_STOCK'
}

// Map the backend SignalResponse shape → the frontend Signal shape.
function normalise(raw: any): Signal {
  const price = raw.price ?? 0
  return {
    id: raw.id,
    symbol: raw.symbol,
    asset_name: raw.symbol,
    asset_class: detectAssetClass(raw.symbol),
    signal_type: (raw.action === 'SELL' ? 'SELL' : 'BUY'),
    current_price: price,
    entry_price: price,
    stop_loss: raw.stop_loss ?? 0,
    take_profit: raw.take_profit ?? 0,
    // confidence is 0-100 on the backend; convert to a 1-10 strength meter
    signal_strength: Math.max(1, Math.min(10, Math.round((raw.confidence ?? 50) / 10))),
    strategy_name: raw.strategy ?? '',
    reasoning: raw.reasoning ?? '',
    indicators: raw.indicator_values ?? {},
    created_at: raw.created_at,
    is_active: !raw.acted_on,
  }
}

export const signalsApi = {
  getSignals: async (filters?: SignalFilters): Promise<Signal[]> => {
    const resp = await apiClient.get<any[]>('/signals', {
      params: { limit: filters?.limit ?? 50, offset: filters?.offset ?? 0 },
    })
    return resp.data.map(normalise)
  },

  getSignal: async (id: number): Promise<Signal> => {
    const resp = await apiClient.get<any[]>(`/signals/${id}`)
    // backend returns a list for /signals/{symbol}; take the first
    const item = Array.isArray(resp.data) ? resp.data[0] : resp.data
    return normalise(item)
  },

  getSignalsBySymbol: async (symbol: string): Promise<Signal[]> => {
    const resp = await apiClient.get<any[]>(`/signals/${symbol}`)
    return resp.data.map(normalise)
  },

  // Generate signals on demand for specific symbols
  generateSignals: async (symbols: string[]): Promise<Signal[]> => {
    const resp = await apiClient.post<any[]>('/signals/generate', { symbols })
    return resp.data.map(normalise)
  },

  // Generate signals for every symbol on the user's watchlist
  generateWatchlistSignals: async (): Promise<Signal[]> => {
    const resp = await apiClient.post<any[]>('/signals/generate/watchlist', {})
    return resp.data.map(normalise)
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
