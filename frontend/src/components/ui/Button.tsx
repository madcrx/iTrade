import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
          'w-full': fullWidth,
        },
        {
          'bg-accent-blue hover:bg-accent-blue-hover text-white shadow-sm hover:shadow-md': variant === 'primary',
          'bg-bg-card hover:bg-bg-hover text-text-primary border border-border': variant === 'secondary',
          'text-text-secondary hover:text-text-primary hover:bg-bg-card': variant === 'ghost',
          'bg-bear/10 hover:bg-bear/20 text-bear border border-bear/30': variant === 'danger',
          'bg-bull/10 hover:bg-bull/20 text-bull border border-bull/30': variant === 'success',
          'border border-border text-text-primary hover:bg-bg-card': variant === 'outline',
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  )
}
