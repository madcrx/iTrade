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

const ASSET_TYPE_MAP: Record<string, AssetClass> = {
  asx: 'ASX_STOCK',
  crypto: 'CRYPTO',
  stock: 'US_STOCK',
  etf: 'ETF',
}

function normaliseWatchlistItem(raw: any): WatchlistItem {
  return {
    id: raw.id ?? 0,
    symbol: raw.symbol,
    asset_name: raw.display_name ?? raw.asset_name ?? raw.symbol,
    asset_class: ASSET_TYPE_MAP[(raw.asset_type ?? raw.asset_class ?? 'stock').toLowerCase()] ?? 'US_STOCK',
    current_price: raw.current_price ?? 0,
    daily_change: raw.daily_change ?? 0,
    daily_change_pct: raw.daily_change_pct ?? 0,
    active_signals: raw.active_signals ?? 0,
    enabled_strategies: raw.enabled_strategies ?? [],
    added_at: raw.added_at ?? '',
  }
}

export const watchlistApi = {
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const resp = await apiClient.get<any[]>('/watchlist')
    return resp.data.map(normaliseWatchlistItem)
  },

  addSymbol: async (symbol: string): Promise<WatchlistItem> => {
    const resp = await apiClient.post<any>('/watchlist', { symbol })
    return normaliseWatchlistItem(resp.data)
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
