import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <h3 className="font-heading text-sm md:text-base font-semibold tracking-tight text-[#F8F9FC]">
          {title}
        </h3>
        {badge}
        {subtitle && (
          <span className="text-xs text-[#717182] hidden md:inline">
            • {subtitle}
          </span>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
