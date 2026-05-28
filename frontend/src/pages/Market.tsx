import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Globe, Activity } from 'lucide-react'
import { marketApi } from '../api/market'
import { signalsApi } from '../api/signals'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { AssetClassBadge } from '../components/ui/Badge'
import SignalCard from '../components/signals/SignalCard'
import { clsx } from 'clsx'

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500', region: 'US' },
  { symbol: '^AXJO', name: 'ASX 200', region: 'AU' },
  { symbol: '^DJI', name: 'Dow Jones', region: 'US' },
  { symbol: '^IXIC', name: 'NASDAQ', region: 'US' },
  { symbol: 'BTC-USD', name: 'Bitcoin', region: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', region: 'Crypto' },
]

const TRENDING = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'BHP.AX', 'CBA.AX', 'BTC-USD', 'ETH-USD']

const SECTORS = [
  { sector: 'Technology', change_pct: 1.24 },
  { sector: 'Healthcare', change_pct: -0.32 },
  { sector: 'Financials', change_pct: 0.87 },
  { sector: 'Energy', change_pct: -1.15 },
  { sector: 'Consumer', change_pct: 0.44 },
  { sector: 'Industrials', change_pct: 0.21 },
  { sector: 'Materials', change_pct: -0.67 },
  { sector: 'Utilities', change_pct: 0.09 },
]

function IndexCard({ symbol, name, region }: { symbol: string; name: string; region: string }) {
  const { data: quote } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => marketApi.getQuote(symbol),
    staleTime: 60_000,
  })

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 hover:border-border-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted px-1.5 py-0.5 rounded bg-bg-secondary border border-border">{region}</span>
        {quote ? (
          quote.change_pct >= 0
            ? <TrendingUp className="h-4 w-4 text-bull" />
            : <TrendingDown className="h-4 w-4 text-bear" />
        ) : null}
      </div>
      <p className="text-sm text-text-secondary">{name}</p>
      {!quote ? (
        <div className="mt-1 h-6 skeleton rounded w-24" />
      ) : (
        <>
          <p className="text-xl font-bold font-mono text-text-primary mt-0.5">
            {quote.price >= 1000 ? quote.price.toLocaleString(undefined, { minimumFractionDigits: 0 }) : quote.price.toFixed(2)}
          </p>
          <p className={clsx('text-sm font-medium mt-0.5', quote.change_pct >= 0 ? 'text-bull' : 'text-bear')}>
            {quote.change_pct >= 0 ? '+' : ''}{quote.change_pct.toFixed(2)}%
            <span className="text-text-muted ml-1 text-xs">({quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)})</span>
          </p>
        </>
      )}
    </div>
  )
}

function TrendingRow({ symbol }: { symbol: string }) {
  const { data: quote } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => marketApi.getQuote(symbol),
    staleTime: 60_000,
  })

  if (!quote) return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border animate-pulse">
      <div className="h-4 bg-bg-secondary rounded w-24" />
      <div className="h-4 bg-bg-secondary rounded w-20" />
    </div>
  )

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border hover:bg-bg-hover/30 transition-colors">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">{quote.symbol}</span>
            <AssetClassBadge assetClass={quote.asset_class} />
          </div>
          <p className="text-xs text-text-muted truncate max-w-32">{quote.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono font-semibold text-text-primary">${quote.price.toFixed(2)}</p>
        <p className={clsx('text-sm font-medium', quote.change_pct >= 0 ? 'text-bull' : 'text-bear')}>
          {quote.change_pct >= 0 ? '+' : ''}{quote.change_pct.toFixed(2)}%
        </p>
      </div>
    </div>
  )
}

export default function Market() {
  const { data: recentSignals } = useQuery({
    queryKey: ['signals-recent-market'],
    queryFn: () => signalsApi.getSignals({ limit: 4 }),
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Market Overview</h1>
          <p className="text-sm text-text-secondary mt-0.5">Global market snapshot — US, ASX, and Crypto</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Activity className="h-3.5 w-3.5 text-bull animate-pulse" />
          Live data
        </div>
      </div>

      {/* Index grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Global Indices</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {INDICES.map(idx => (
            <IndexCard key={idx.symbol} {...idx} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trending assets */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Trending Assets</h2>
            </CardHeader>
            <div>
              {TRENDING.map(sym => <TrendingRow key={sym} symbol={sym} />)}
            </div>
          </Card>
        </div>

        {/* Sector performance */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">US Sector Performance</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {SECTORS.sort((a, b) => b.change_pct - a.change_pct).map(s => (
                <div key={s.sector}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-secondary">{s.sector}</span>
                    <span className={clsx('text-sm font-semibold', s.change_pct >= 0 ? 'text-bull' : 'text-bear')}>
                      {s.change_pct >= 0 ? '+' : ''}{s.change_pct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all', s.change_pct >= 0 ? 'bg-bull' : 'bg-bear')}
                      style={{ width: `${Math.min(100, Math.abs(s.change_pct) * 20)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Latest signals */}
        <div className="xl:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Latest Signals</h2>
          </div>
          {!recentSignals ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : recentSignals.length === 0 ? (
            <div className="bg-bg-card rounded-xl border border-border p-6 text-center text-text-secondary text-sm">
              No signals yet. Add assets to your watchlist.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSignals.map(sig => (
                <SignalCard key={sig.id} signal={sig} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-bg-card border border-border/50 px-4 py-3">
        <p className="text-xs text-text-muted text-center">
          Market data is delayed 15–20 minutes. For informational purposes only.
          Not financial advice.
        </p>
      </div>
    </div>
  )
}
