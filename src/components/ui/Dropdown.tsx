import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = React.createContext<DropdownContextType | null>(null)

export const Dropdown: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export const DropdownTrigger: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error('DropdownTrigger must be used within Dropdown')

  return (
    <div
      onClick={() => context.setOpen(!context.open)}
      className={cn('inline-flex cursor-pointer', className)}
      aria-haspopup="true"
      aria-expanded={context.open}
    >
      {children}
    </div>
  )
}

export const DropdownContent: React.FC<{
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}> = ({ children, align = 'right', className }) => {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error('DropdownContent must be used within Dropdown')

  if (!context.open) return null

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[200px] rounded-xl border border-[#30303B] bg-[#1C1C24] p-1.5 text-[#F8F9FC] shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
      role="menu"
    >
      {children}
    </div>
  )
}

export const DropdownItem: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  danger?: boolean
}> = ({ children, onClick, disabled, className, danger }) => {
  const context = React.useContext(DropdownContext)

  const handleClick = () => {
    if (disabled) return
    onClick?.()
    context?.setOpen(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-left transition-colors duration-150',
        danger
          ? 'text-[#FB7185] hover:bg-rose-500/15'
          : 'text-[#A1A1B0] hover:text-[#F8F9FC] hover:bg-[#252530]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      role="menuitem"
    >
      {children}
    </button>
  )
}

export const DropdownSeparator: React.FC = () => (
  <div className="h-px bg-[#30303B] my-1" />
)
