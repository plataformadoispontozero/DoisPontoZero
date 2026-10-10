import React from 'react'
import { LucideIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  description: string
  actionLabel?: string
  onAction?: () => void
  statusBadge?: string
  features?: string[]
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  description,
  actionLabel,
  onAction,
  statusBadge = 'Ambiente Inicial (Fase 01)',
  features = [],
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl border border-dashed border-[#30303B] bg-[#1C1C24]/50 max-w-2xl mx-auto my-6',
        className
      )}
    >
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-[#7952FF]/10 border border-[#7952FF]/20 flex items-center justify-center text-[#7952FF] shadow-inner">
          <Icon className="w-7 h-7" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#B8FF65] text-[#101014] flex items-center justify-center shadow">
          <Sparkles className="w-3 h-3" />
        </div>
      </div>

      {statusBadge && (
        <div className="inline-flex mb-2.5">
          <Badge variant="default" className="text-[11px] py-0.5">
            {statusBadge}
          </Badge>
        </div>
      )}

      <h3 className="font-heading text-lg md:text-xl font-bold text-[#F8F9FC] tracking-tight mb-1.5">
        {title}
      </h3>

      {subtitle && (
        <p className="text-xs font-medium text-[#B89EFF] mb-2.5">
          {subtitle}
        </p>
      )}

      <p className="text-xs text-[#A1A1B0] max-w-md leading-relaxed mb-5">
        {description}
      </p>

      {features.length > 0 && (
        <div className="w-full bg-[#101014]/60 rounded-xl p-3.5 border border-[#30303B] mb-5 text-left">
          <span className="text-[11px] font-semibold text-[#A1A1B0] uppercase tracking-wider block mb-2">
            Escopo funcional previsto:
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#F8F9FC]">
            {features.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF65] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {actionLabel && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            className="shadow-sm"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
