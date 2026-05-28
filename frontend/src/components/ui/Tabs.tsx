import { type ReactNode, createContext, useContext, useState } from 'react'
import { clsx } from 'clsx'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue>({ activeTab: '', setActiveTab: () => {} })

interface TabsProps {
  defaultTab: string
  children: ReactNode
  className?: string
  onChange?: (tab: string) => void
}

export function Tabs({ defaultTab, children, className, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleChange = (tab: string) => {
    setActiveTab(tab)
    onChange?.(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: ReactNode
  className?: string
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1 p-1 bg-bg-primary rounded-lg border border-border',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabProps {
  id: string
  children: ReactNode
  className?: string
}

export function Tab({ id, children, className }: TabProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === id

  return (
    <button
      onClick={() => setActiveTab(id)}
      className={clsx(
        'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
        isActive
          ? 'bg-accent-blue text-white shadow-sm'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-card',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabPanelProps {
  id: string
  children: ReactNode
  className?: string
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== id) return null

  return (
    <div className={clsx('animate-fade-in', className)}>
      {children}
    </div>
  )
}

// Simpler inline tab variant used in some places
interface SimpleTabsProps {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function SimpleTabs({ tabs, active, onChange, className }: SimpleTabsProps) {
  return (
    <div className={clsx('flex items-center gap-1 p-1 bg-bg-primary rounded-lg border border-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
            active === tab.id
              ? 'bg-accent-blue text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
