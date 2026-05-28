import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { clsx } from 'clsx'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggle } = useThemeStore()

  return (
    <button
      onClick={toggle}
      className={clsx(
        'p-2 rounded-lg transition-colors',
        'text-text-secondary hover:text-text-primary hover:bg-bg-card',
        className
      )}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
