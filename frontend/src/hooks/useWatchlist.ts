import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { watchlistApi } from '../api/watchlist'

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.getWatchlist,
    staleTime: 30_000,
  })
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (symbol: string) => watchlistApi.addSymbol(symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (symbol: string) => watchlistApi.removeSymbol(symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}

export function useUpdateWatchlistStrategies() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ symbol, strategies }: { symbol: string; strategies: string[] }) =>
      watchlistApi.updateStrategies(symbol, strategies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}

export function useSearchSymbols(query: string) {
  return useQuery({
    queryKey: ['search-symbols', query],
    queryFn: () => watchlistApi.searchSymbols(query),
    enabled: query.length >= 2,
    staleTime: 60_000,
  })
}
