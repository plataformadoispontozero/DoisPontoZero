import * as React from 'react'
import { cn } from '@/lib/utils'

export type StatusType =
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'waiting'
  | 'warning'
  | 'error'
  | 'draft'

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  label?: string
  pulse?: boolean
  size?: 'sm' | 'md'
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  pulse = false,
  size = 'md',
  className,
  ...props
}) => {
  const statusColors: Record<StatusType, { dot: string; text: string }> = {
    active: { dot: 'bg-[#34D399]', text: 'text-[#34D399]' },
    in_progress: { dot: 'bg-[#7952FF]', text: 'text-[#B89EFF]' },
    completed: { dot: 'bg-[#B8FF65]', text: 'text-[#B8FF65]' },
    waiting: { dot: 'bg-[#FBBF24]', text: 'text-[#FBBF24]' },
    warning: { dot: 'bg-[#FBBF24]', text: 'text-[#FBBF24]' },
    error: { dot: 'bg-[#FB7185]', text: 'text-[#FB7185]' },
    draft: { dot: 'bg-[#717182]', text: 'text-[#A1A1B0]' },
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  }

  const config = statusColors[status] || statusColors.draft

  return (
    <div
      className={cn('inline-flex items-center gap-2 select-none', className)}
      {...props}
    >
      <span className="relative flex items-center justify-center">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', dotSizes[size], config.dot)} />
      </span>
      {label && (
        <span className={cn('text-xs font-medium', config.text)}>{label}</span>
      )}
    </div>
  )
}
