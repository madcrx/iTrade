import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-bg-secondary border rounded-lg text-text-primary placeholder-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue',
              'transition-colors text-sm py-2.5',
              leftIcon ? 'pl-10 pr-4' : 'px-4',
              rightIcon ? 'pr-10' : '',
              error ? 'border-bear focus:ring-bear/30' : 'border-border',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-bear">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={clsx(
            'w-full bg-bg-secondary border rounded-lg text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue',
            'transition-colors text-sm py-2.5 px-4',
            error ? 'border-bear' : 'border-border',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-bear">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full bg-bg-secondary border rounded-lg text-text-primary placeholder-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue',
            'transition-colors text-sm py-2.5 px-4 resize-none',
            error ? 'border-bear' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-bear">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
