import { clsx } from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={clsx(
        'animate-spin text-accent-blue',
        {
          'h-4 w-4': size === 'sm',
          'h-6 w-6': size === 'md',
          'h-10 w-10': size === 'lg',
        },
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  )
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={clsx('skeleton h-4 rounded', className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-bg-hover rounded w-1/3" />
          <div className="h-4 bg-bg-hover rounded w-1/4" />
        </div>
        <div className="h-8 bg-bg-hover rounded-full w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-bg-hover rounded" />
        <div className="h-4 bg-bg-hover rounded w-4/5" />
        <div className="h-4 bg-bg-hover rounded w-3/5" />
      </div>
      <div className="flex gap-3 mt-4">
        <div className="h-9 bg-bg-hover rounded-lg flex-1" />
        <div className="h-9 bg-bg-hover rounded-lg flex-1" />
      </div>
    </div>
  )
}
