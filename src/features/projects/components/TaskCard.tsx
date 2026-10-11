import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Calendar,
  MessageSquare,
  Paperclip,
  CheckSquare,
  AlertCircle,
  Clock,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { Task } from '@/types/projects'
import { PRIORITY_CONFIG, formatDate, isOverdue } from '@/features/projects/utils/projectUtils'

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  isDragging?: boolean
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const priority = PRIORITY_CONFIG[task.priority]
  const overdue = isOverdue(task.due_date, task.completed_at)
  const checklistTotal = task.checklists?.reduce((a, c) => a + (c.items?.length ?? 0), 0) ?? 0
  const checklistDone = task.checklists?.reduce(
    (a, c) => a + (c.items?.filter((i) => i.is_completed).length ?? 0),
    0
  ) ?? 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-[#1C1C24] border border-[#30303B] rounded-xl p-3 cursor-pointer',
        'hover:border-[#C74410]/40 hover:shadow-lg hover:shadow-[#C74410]/5 transition-all duration-200',
        isDragging && 'shadow-2xl shadow-black/40 border-[#C74410]/60 rotate-1 scale-105',
        isSortableDragging && 'pointer-events-none'
      )}
      onClick={() => !isSortableDragging && onClick(task)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[#98989F] hover:text-[#B8B8C0]"
        onClick={(e) => e.stopPropagation()}
        aria-label="Arrastar tarefa"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Priority indicator */}
      <div className="flex items-start gap-2 mb-2 pr-5">
        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', priority.dotColor)} />
        <h4 className="text-xs font-medium text-[#F8F9FC] leading-snug line-clamp-2">
          {task.title}
        </h4>
      </div>

      {/* Client / context label */}
      {(task.client?.name || task.project?.name) && (
        <p className="text-[10px] text-[#98989F] mb-2 ml-3.5 truncate">
          {task.client?.name ?? task.project?.name}
        </p>
      )}

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex items-center gap-1 mb-2 ml-3.5">
          {task.assignees.slice(0, 4).map((a) => (
            <div
              key={a.id}
              className="w-5 h-5 rounded-full bg-[#252530] border border-[#424252] flex items-center justify-center text-[8px] font-bold text-[#B8B8C0] uppercase overflow-hidden shrink-0"
              title={a.profile?.full_name}
            >
              {a.profile?.avatar_url ? (
                <img
                  src={a.profile.avatar_url}
                  alt={a.profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                (a.profile?.full_name ?? '?')[0]
              )}
            </div>
          ))}
          {task.assignees.length > 4 && (
            <span className="text-[10px] text-[#98989F]">+{task.assignees.length - 4}</span>
          )}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap ml-3.5">
        {/* Priority badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium',
            priority.bg,
            priority.color
          )}
        >
          {priority.label}
        </span>

        {/* Due date */}
        {task.due_date && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-medium',
              overdue ? 'text-red-400' : 'text-[#98989F]'
            )}
          >
            {overdue ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <Calendar className="w-3 h-3" />
            )}
            {formatDate(task.due_date)}
          </span>
        )}

        {/* Checklist progress */}
        {checklistTotal > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#98989F]">
            <CheckSquare className="w-3 h-3" />
            {checklistDone}/{checklistTotal}
          </span>
        )}

        {/* Comments count */}
        {(task.comments_count ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#98989F]">
            <MessageSquare className="w-3 h-3" />
            {task.comments_count}
          </span>
        )}

        {/* Attachments count */}
        {(task.attachments_count ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#98989F]">
            <Paperclip className="w-3 h-3" />
            {task.attachments_count}
          </span>
        )}
      </div>

      {/* Overdue bar */}
      {overdue && (
        <div className="mt-2 ml-3.5">
          <div className="h-0.5 w-full rounded-full bg-red-500/30">
            <div className="h-full w-full rounded-full bg-red-400/60" />
          </div>
        </div>
      )}
    </div>
  )
}

// Drag overlay version (no sortable hooks)
export const TaskCardOverlay: React.FC<{ task: Task }> = ({ task }) => {
  const priority = PRIORITY_CONFIG[task.priority]

  return (
    <div className="bg-[#1C1C24] border border-[#C74410]/60 rounded-xl p-3 shadow-2xl shadow-black/50 rotate-2 scale-105 w-64">
      <div className="flex items-start gap-2 mb-1.5">
        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', priority.dotColor)} />
        <h4 className="text-xs font-medium text-[#F8F9FC] leading-snug line-clamp-2">
          {task.title}
        </h4>
      </div>
      <div className="ml-3.5 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex text-[10px] px-1.5 py-0.5 rounded-md font-medium',
            priority.bg,
            priority.color
          )}
        >
          {priority.label}
        </span>
        {task.due_date && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#98989F]">
            <Calendar className="w-3 h-3" />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}
