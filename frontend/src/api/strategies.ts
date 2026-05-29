import apiClient from './client'

export type StrategyType = 'TECHNICAL' | 'ML' | 'SENTIMENT'

export interface Strategy {
  id: number
  name: string
  display_name: string
  description: string
  asset_classes: string[]
  is_enabled: boolean
  default_stop_loss_pct: number
  default_take_profit_pct: number
  parameters: Record<string, number | string>
  stats?: Record<string, number | string>
  // Derived display fields
  win_rate: number
  avg_return: number
  total_signals: number
  strategy_type: StrategyType
  indicators: string[]
  timeframe: string
}

function deriveType(name: string): StrategyType {
  if (name === 'ml_classifier') return 'ML'
  if (name.includes('sentiment')) return 'SENTIMENT'
  return 'TECHNICAL'
}

function normalise(raw: any): Strategy {
  const stats = raw.stats ?? {}
  const parameters = raw.parameters ?? {}
  return {
    ...raw,
    parameters,
    win_rate: stats.win_rate ?? 0,
    avg_return: stats.avg_return ?? 0,
    total_signals: stats.total_signals ?? 0,
    strategy_type: deriveType(raw.name),
    indicators: Object.keys(parameters),
    timeframe: 'Daily',
  }
}

export const strategiesApi = {
  getStrategies: async (): Promise<Strategy[]> => {
    const resp = await apiClient.get<any[]>('/strategies')
    return resp.data.map(normalise)
  },

  getStrategy: async (name: string): Promise<Strategy> => {
    const resp = await apiClient.get<any>(`/strategies/${name}`)
    return normalise(resp.data)
  },

  toggleStrategy: async (name: string, enabled: boolean): Promise<Strategy> => {
    const resp = await apiClient.patch<any>(`/strategies/${name}`, { is_enabled: enabled })
    return normalise(resp.data)
  },
}
