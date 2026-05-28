import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'buy' | 'sell' | 'success' | 'danger' | 'warning' | 'info' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        {
          'bg-border text-text-secondary': variant === 'default',
          'bg-bull/15 text-bull border border-bull/30': variant === 'buy',
          'bg-bear/15 text-bear border border-bear/30': variant === 'sell',
          'bg-bull/10 text-bull': variant === 'success',
          'bg-bear/10 text-bear': variant === 'danger',
          'bg-yellow-500/10 text-yellow-400': variant === 'warning',
          'bg-accent-blue/10 text-accent-blue': variant === 'info',
          'border border-border text-text-secondary bg-transparent': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

export function AssetClassBadge({ assetClass }: { assetClass: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    US_STOCK: { label: '🇺🇸 US', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
    ASX_STOCK: { label: '🇦🇺 ASX', className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
    CRYPTO: { label: '₿ Crypto', className: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    ETF: { label: '📊 ETF', className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  }
  const config = configs[assetClass] || { label: assetClass, className: 'bg-border text-text-secondary' }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full', config.className)}>
      {config.label}
    </span>
  )
}

export function SignalTypeBadge({ type }: { type: 'BUY' | 'SELL' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 text-sm font-bold rounded-full',
        type === 'BUY'
          ? 'bg-bull/20 text-bull border border-bull/40'
          : 'bg-bear/20 text-bear border border-bear/40'
      )}
    >
      {type === 'BUY' ? '▲ BUY' : '▼ SELL'}
    </span>
  )
}
