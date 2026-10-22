import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/IconButton'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

const openDialogs: symbol[] = []
let previousBodyOverflow = ''

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, className }) => {
  const changeRef = React.useRef(onOpenChange)
  React.useLayoutEffect(() => { changeRef.current = onOpenChange }, [onOpenChange])
  React.useLayoutEffect(() => {
    if (!open) return
    const token = Symbol('dialog')
    if (openDialogs.length === 0) previousBodyOverflow = document.body.style.overflow
    openDialogs.push(token)
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openDialogs.at(-1) === token) {
        event.preventDefault()
        event.stopImmediatePropagation()
        changeRef.current(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      const index = openDialogs.indexOf(token)
      if (index >= 0) openDialogs.splice(index, 1)
      if (openDialogs.length === 0) document.body.style.overflow = previousBodyOverflow
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      {/* Content */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn('relative z-50 w-full max-w-lg rounded-2xl border border-[#30303B] bg-[#1C1C24] p-6 shadow-2xl animate-in zoom-in-95 duration-200', className)}
      >
        {children}
      </div>
    </div>
  )
}

export const DialogHeader: React.FC<{
  children: React.ReactNode
  className?: string
  onClose?: () => void
}> = ({ children, className, onClose }) => (
  <div className={cn('flex items-start justify-between gap-4 pb-4 border-b border-[#30303B]', className)}>
    <div className="space-y-1">{children}</div>
    {onClose && (
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Fechar diálogo"
        onClick={onClose}
        className="text-[#B8B8C0] hover:text-[#F8F9FC] shrink-0"
      >
        <X className="w-4 h-4" />
      </IconButton>
    )}
  </div>
)

export const DialogTitle: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <h2 className={cn('font-heading text-lg font-bold text-[#F8F9FC] leading-none', className)}>
    {children}
  </h2>
)

export const DialogDescription: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <p className={cn('text-xs text-[#B8B8C0]', className)}>{children}</p>
)

export const DialogBody: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('py-4 text-xs text-[#F8F9FC]', className)}>{children}</div>
)

export const DialogContent = DialogBody

export const DialogFooter: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('flex items-center justify-end gap-2 pt-4 border-t border-[#30303B]', className)}>
    {children}
  </div>
)
