import React from 'react'
import { Activity, Clock } from 'lucide-react'
import type { OperationalActivity } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

interface TimelineProps {
  activities: OperationalActivity[]
  emptyMessage?: string
  className?: string
}

export const Timeline: React.FC<TimelineProps> = ({
  activities,
  emptyMessage = 'Nenhuma atividade registrada no histórico operacional.',
  className,
}) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-[#30303B] rounded-xl bg-[#1C1C24]/40">
        <Activity className="w-6 h-6 text-[#717182] mb-2" />
        <p className="text-xs text-[#A1A1B0]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#30303B]', className)}>
      {activities.map((item) => (
        <div key={item.id} className="relative group">
          {/* Timeline Dot */}
          <span className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-[#7952FF] ring-4 ring-[#1C1C24] group-hover:bg-[#B8FF65] transition-colors" />

          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-xs font-semibold text-[#F8F9FC] leading-snug">
                {item.title}
              </h5>
              <span className="text-[10px] text-[#717182] whitespace-nowrap flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {item.timestamp}
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1B0] leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
