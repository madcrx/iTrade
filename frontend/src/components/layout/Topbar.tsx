import { Bell, Menu, ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useAuthStore } from '../../store/authStore'

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const [mockNotifications, setMockNotifications] = useState([
    { id: 1, text: 'New BUY signal: AAPL', time: '2m ago', unread: true },
    { id: 2, text: 'BTC signal triggered — strong bullish', time: '15m ago', unread: true },
    { id: 3, text: 'Backtest complete: RSI Strategy on TSLA', time: '1h ago', unread: false },
  ])

  const unreadCount = mockNotifications.filter((n) => n.unread).length

  const markAllRead = () => setMockNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))

  return (
    <header className="h-16 bg-bg-secondary border-b border-border flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-20">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-bg-card rounded-lg text-text-secondary transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 hover:bg-bg-card rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-bear text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border rounded-xl shadow-2xl z-20">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 hover:bg-bg-card transition-colors ${n.unread ? 'bg-accent-blue/3' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {n.unread && (
                          <div className="w-2 h-2 bg-accent-blue rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div className={n.unread ? '' : 'ml-4'}>
                          <p className="text-sm text-text-primary">{n.text}</p>
                          <p className="text-xs text-text-muted mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-border">
                  <button
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="text-xs text-accent-blue hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Mark all as read
                </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-bg-card rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-accent-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-accent-blue font-semibold text-sm">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm text-text-primary font-medium hidden sm:block max-w-[120px] truncate">
              {user?.full_name || 'User'}
            </span>
            <ChevronDown className="h-4 w-4 text-text-muted hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-border rounded-xl shadow-2xl z-20">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-text-primary truncate">{user?.full_name}</p>
                  <p className="text-xs text-text-muted truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => { logout(); setDropdownOpen(false) }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-bear hover:bg-bear/5 transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
