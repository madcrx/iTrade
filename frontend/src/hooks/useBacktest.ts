import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backtestApi, type BacktestRequest } from '../api/backtest'

export function useBacktestResults() {
  return useQuery({
    queryKey: ['backtest-results'],
    queryFn: backtestApi.getResults,
    staleTime: 60_000,
  })
}

export function useBacktestResult(id: number) {
  return useQuery({
    queryKey: ['backtest-result', id],
    queryFn: () => backtestApi.getResult(id),
    enabled: !!id,
  })
}

export function useRunBacktest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: BacktestRequest) => backtestApi.runBacktest(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtest-results'] })
    },
  })
}

export function useDeleteBacktestResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => backtestApi.deleteResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtest-results'] })
    },
  })
}
