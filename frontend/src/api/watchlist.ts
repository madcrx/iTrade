import apiClient from './client'
import type { AssetClass } from './signals'

export interface WatchlistItem {
  id: number
  symbol: string
  asset_name: string
  asset_class: AssetClass
  current_price: number
  daily_change: number
  daily_change_pct: number
  active_signals: number
  enabled_strategies: string[]
  added_at: string
}

export const watchlistApi = {
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const resp = await apiClient.get<WatchlistItem[]>('/watchlist')
    return resp.data
  },

  addSymbol: async (symbol: string): Promise<WatchlistItem> => {
    const resp = await apiClient.post<WatchlistItem>('/watchlist', { symbol })
    return resp.data
  },

  removeSymbol: async (symbol: string): Promise<void> => {
    await apiClient.delete(`/watchlist/${symbol}`)
  },

  updateStrategies: async (symbol: string, strategies: string[]): Promise<WatchlistItem> => {
    const resp = await apiClient.patch<WatchlistItem>(`/watchlist/${symbol}/strategies`, {
      enabled_strategies: strategies,
    })
    return resp.data
  },

  searchSymbols: async (query: string): Promise<Array<{
    symbol: string
    name: string
    asset_class: AssetClass
    exchange: string
  }>> => {
    const resp = await apiClient.get<any>('/market/search', { params: { q: query } })
    const raw = Array.isArray(resp.data) ? resp.data : (resp.data?.results ?? [])
    const map: Record<string, AssetClass> = {
      asx: 'ASX_STOCK',
      crypto: 'CRYPTO',
      stock: 'US_STOCK',
      etf: 'ETF',
    }
    return raw.map((r: any) => ({
      symbol: r.symbol,
      name: r.name ?? r.symbol,
      exchange: r.exchange ?? '',
      asset_class: map[(r.asset_type ?? r.asset_class ?? 'stock').toLowerCase()] ?? 'US_STOCK',
    }))
  },
}
