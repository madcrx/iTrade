import apiClient from './client'

export type StrategyType = 'TECHNICAL' | 'ML' | 'SENTIMENT'

export interface Strategy {
  id: number
  name: string
  description: string
  strategy_type: StrategyType
  asset_classes: ('US_STOCK' | 'ASX_STOCK' | 'CRYPTO' | 'ETF')[]
  indicators: string[]
  win_rate: number
  avg_return: number
  total_signals: number
  is_enabled: boolean
  timeframe: string
  parameters: Record<string, number | string>
}

export const strategiesApi = {
  getStrategies: async (): Promise<Strategy[]> => {
    const resp = await apiClient.get<Strategy[]>('/strategies')
    return resp.data
  },

  getStrategy: async (id: number): Promise<Strategy> => {
    const resp = await apiClient.get<Strategy>(`/strategies/${id}`)
    return resp.data
  },

  toggleStrategy: async (id: number, enabled: boolean): Promise<Strategy> => {
    const resp = await apiClient.patch<Strategy>(`/strategies/${id}`, { is_enabled: enabled })
    return resp.data
  },
}
