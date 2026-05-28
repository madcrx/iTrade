import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Star,
  Zap,
  FlaskConical,
  BarChart3,
  Globe,
  Settings,
  X,
  TrendingUp,
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/market', icon: Globe, label: 'Market' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
  { to: '/strategies', icon: Zap, label: 'Strategies' },
  { to: '/backtest', icon: FlaskConical, label: 'Backtest' },
  { to: '/portfolio', icon: BarChart3, label: 'Portfolio' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-bg-secondary border-r border-border z-40',
          'flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              i<span className="text-accent-blue">Trade</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-bg-card rounded-lg text-text-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                )}
              >
                <Icon className={clsx('h-5 w-5 flex-shrink-0', isActive ? 'text-accent-blue' : '')} />
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 bg-accent-blue rounded-full" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border flex-shrink-0">
          <div className="px-3 py-2.5 rounded-lg bg-bg-card">
            <p className="text-xs text-text-muted font-medium mb-0.5">Signal Tool Only</p>
            <p className="text-xs text-text-muted leading-tight">
              iTrade generates signals. You place trades in your broker app.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
