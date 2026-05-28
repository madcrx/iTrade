import apiClient from './client'
import type { AssetClass } from './signals'

export interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  change_pct: number
  volume: number
  market_cap?: number
  high: number
  low: number
  open: number
  prev_close: number
  asset_class: AssetClass
}

export interface HistoricalBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  sma50?: number
  sma200?: number
  rsi?: number
  macd?: number
  macd_signal?: number
  bb_upper?: number
  bb_lower?: number
  bb_mid?: number
}

export interface SearchResult {
  symbol: string
  name: string
  asset_class: AssetClass
  exchange: string
}

export interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  change_pct: number
}

export interface SectorPerformance {
  sector: string
  change_pct: number
}

export const marketApi = {
  getQuote: async (symbol: string): Promise<Quote> => {
    const resp = await apiClient.get<Quote>(`/market/quote/${symbol}`)
    return resp.data
  },

  getHistory: async (
    symbol: string,
    timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' = '3M'
  ): Promise<HistoricalBar[]> => {
    const resp = await apiClient.get<HistoricalBar[]>(`/market/history/${symbol}`, {
      params: { timeframe },
    })
    return resp.data
  },

  searchSymbols: async (query: string): Promise<SearchResult[]> => {
    const resp = await apiClient.get<SearchResult[]>('/market/search', { params: { q: query } })
    return resp.data
  },

  getMarketIndices: async (): Promise<MarketIndex[]> => {
    const resp = await apiClient.get<MarketIndex[]>('/market/indices')
    return resp.data
  },

  getSectorPerformance: async (): Promise<SectorPerformance[]> => {
    const resp = await apiClient.get<SectorPerformance[]>('/market/sectors')
    return resp.data
  },

  getTrending: async (): Promise<Quote[]> => {
    const resp = await apiClient.get<Quote[]>('/market/trending')
    return resp.data
  },
}
