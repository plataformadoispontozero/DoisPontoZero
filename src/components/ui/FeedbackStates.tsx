import * as React from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export const LoadingState: React.FC<{
  message?: string
  description?: string
  className?: string
}> = ({
  message = 'Carregando dados operacionais...',
  description = 'Aguarde um momento enquanto os registros são sincronizados.',
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-[#30303B] bg-[#1C1C24]/60 min-h-[220px]',
      className
    )}
    role="status"
    aria-live="polite"
  >
    <div className="w-10 h-10 rounded-xl bg-[#7952FF]/15 border border-[#7952FF]/30 flex items-center justify-center text-[#7952FF] mb-3">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
    <h4 className="font-heading text-sm font-semibold text-[#F8F9FC]">{message}</h4>
    {description && (
      <p className="text-xs text-[#A1A1B0] max-w-sm mt-1">{description}</p>
    )}
  </div>
)

export const ErrorState: React.FC<{
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}> = ({
  title = 'Falha na comunicação',
  message,
  onRetry,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-rose-500/30 bg-rose-500/10 min-h-[220px]',
      className
    )}
    role="alert"
  >
    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-[#FB7185] flex items-center justify-center mb-3">
      <AlertTriangle className="w-5 h-5" />
    </div>
    <h4 className="font-heading text-sm font-semibold text-[#F8F9FC]">{title}</h4>
    <p className="text-xs text-[#FB7185] max-w-sm mt-1 mb-4">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry} className="gap-2 text-xs">
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Tentar novamente</span>
      </Button>
    )}
  </div>
)

export const SuccessState: React.FC<{
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}> = ({ title, message, actionLabel, onAction, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 min-h-[220px]',
      className
    )}
  >
    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#34D399] flex items-center justify-center mb-3">
      <CheckCircle2 className="w-5 h-5" />
    </div>
    <h4 className="font-heading text-sm font-semibold text-[#F8F9FC]">{title}</h4>
    {message && (
      <p className="text-xs text-[#34D399] max-w-sm mt-1 mb-4">{message}</p>
    )}
    {actionLabel && onAction && (
      <Button variant="primary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
)
