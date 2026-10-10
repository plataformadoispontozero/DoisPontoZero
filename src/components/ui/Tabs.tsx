import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
  activeTab: string
  setActiveTab: (id: string) => void
}

const TabsContext = React.createContext<TabsContextType | null>(null)

export const Tabs: React.FC<{
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}> = ({ defaultValue, value, onValueChange, children, className }) => {
  const [internalTab, setInternalTab] = React.useState(defaultValue)
  const activeTab = value !== undefined ? value : internalTab

  const setActiveTab = (tab: string) => {
    if (value === undefined) {
      setInternalTab(tab)
    }
    onValueChange?.(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full space-y-4', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div
    className={cn(
      'inline-flex items-center gap-1 rounded-xl bg-[#1C1C24] border border-[#30303B] p-1 text-xs text-[#A1A1B0]',
      className
    )}
    role="tablist"
  >
    {children}
  </div>
)

export const TabsTrigger: React.FC<{
  value: string
  children: React.ReactNode
  className?: string
}> = ({ value, children, className }) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer',
        isActive
          ? 'bg-[#252530] text-[#F8F9FC] shadow-sm font-semibold'
          : 'text-[#A1A1B0] hover:text-[#F8F9FC] hover:bg-[#252530]/50',
        className
      )}
    >
      {children}
    </button>
  )
}

export const TabsContent: React.FC<{
  value: string
  children: React.ReactNode
  className?: string
}> = ({ value, children, className }) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.activeTab !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn('animate-in fade-in duration-200 outline-none', className)}
    >
      {children}
    </div>
  )
}
