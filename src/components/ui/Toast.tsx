// Simple toast utility — wraps native browser approach with state management
// For a full implementation, this would use a toast library. Here we create
// a lightweight singleton-based system compatible with the project stack.

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

// -------------------------
// Internal state store
// -------------------------
let _addToast: ((message: string, variant: ToastVariant) => void) | null = null

export const toast = {
  success: (message: string) => _addToast?.(message, 'success'),
  error: (message: string) => _addToast?.(message, 'error'),
  info: (message: string) => _addToast?.(message, 'info'),
  warning: (message: string) => _addToast?.(message, 'warning'),
}

// -------------------------
// Provider
// -------------------------
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    _addToast = addToast
    return () => { _addToast = null }
  }, [addToast])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </>
  )
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; border: string; text: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-[#34D399]" />,
    border: 'border-[#34D399]/30',
    text: 'text-[#34D399]',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-red-400" />,
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
  info: {
    icon: <Info className="w-4 h-4 text-[#7952FF]" />,
    border: 'border-[#7952FF]/30',
    text: 'text-[#7952FF]',
  },
  warning: {
    icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
}

const ToastItem: React.FC<{
  toast: ToastItem
  onDismiss: (id: string) => void
}> = ({ toast: t, onDismiss }) => {
  const config = VARIANT_CONFIG[t.variant]

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-[#1C1C24] border shadow-xl shadow-black/40 min-w-[280px] max-w-sm',
        'animate-in slide-in-from-right duration-300',
        config.border
      )}
      role="alert"
    >
      {config.icon}
      <p className="flex-1 text-sm text-[#F8F9FC] leading-snug">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="shrink-0 text-[#717182] hover:text-[#F8F9FC] transition-colors"
        aria-label="Fechar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
