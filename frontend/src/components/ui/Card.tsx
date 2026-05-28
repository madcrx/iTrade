import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-bg-card rounded-xl border border-border',
        hover && 'hover:border-border-light hover:bg-bg-hover transition-colors cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('px-5 py-4 border-b border-border', className)}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('px-5 py-4', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('px-5 py-3 border-t border-border', className)}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changePositive?: boolean
  icon?: ReactNode
  className?: string
}

export function StatCard({ label, value, change, changePositive, icon, className }: StatCardProps) {
  return (
    <Card className={clsx('p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1 truncate">{value}</p>
          {change !== undefined && (
            <p className={clsx('text-xs mt-1 font-medium', changePositive ? 'text-bull' : 'text-bear')}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 p-2 bg-bg-secondary rounded-lg text-text-secondary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
