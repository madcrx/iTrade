import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signalsApi, type SignalFilters } from '../api/signals'

export function useSignals(filters?: SignalFilters) {
  return useQuery({
    queryKey: ['signals', filters],
    queryFn: () => signalsApi.getSignals(filters),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useSignal(id: number) {
  return useQuery({
    queryKey: ['signal', id],
    queryFn: () => signalsApi.getSignal(id),
    enabled: !!id,
  })
}

export function useSignalsBySymbol(symbol: string) {
  return useQuery({
    queryKey: ['signals', 'symbol', symbol],
    queryFn: () => signalsApi.getSignalsBySymbol(symbol),
    enabled: !!symbol,
    staleTime: 30_000,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: signalsApi.getDashboardStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useGenerateSignals() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (symbols: string[]) => signalsApi.generateSignals(symbols),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] })
    },
  })
}
