import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/IconButton'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'left' | 'right'
  children: React.ReactNode
  className?: string
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  side = 'right',
  children,
  className,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col w-full max-w-sm bg-[#1C1C24] border-[#30303B] shadow-2xl transition-transform duration-300 ease-in-out',
          side === 'left' ? 'left-0 border-r animate-in slide-in-from-left' : 'right-0 border-l animate-in slide-in-from-right',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export const SheetHeader: React.FC<{
  children: React.ReactNode
  onClose?: () => void
  className?: string
}> = ({ children, onClose, className }) => (
  <div className={cn('flex items-center justify-between p-5 border-b border-[#30303B]', className)}>
    <div className="space-y-1">{children}</div>
    {onClose && (
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Fechar painel"
        onClick={onClose}
        className="text-[#A1A1B0] hover:text-[#F8F9FC]"
      >
        <X className="w-5 h-5" />
      </IconButton>
    )}
  </div>
)

export const SheetTitle: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <h3 className={cn('font-heading text-base font-bold text-[#F8F9FC]', className)}>
    {children}
  </h3>
)

export const SheetDescription: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <p className={cn('text-xs text-[#A1A1B0]', className)}>{children}</p>
)

export const SheetContent: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('flex-1 overflow-y-auto p-5', className)}>{children}</div>
)

export const SheetFooter: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('p-5 border-t border-[#30303B] flex items-center justify-end gap-2', className)}>
    {children}
  </div>
)
