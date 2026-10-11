import React, { useState } from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus, MoreHorizontal, Dot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { TaskCard } from '@/features/projects/components/TaskCard'
import type { BoardColumn, Task } from '@/types/projects'
import { COLUMN_CATEGORY_CONFIG } from '@/features/projects/utils/projectUtils'

interface KanbanColumnProps {
  column: BoardColumn
  tasks?: Task[]
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Task) => void
  onColumnMenu?: (column: BoardColumn) => void
}

export const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
  column,
  tasks = column.tasks ?? [],
  onAddTask,
  onTaskClick,
  onColumnMenu,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const categoryConfig = COLUMN_CATEGORY_CONFIG[column.category]

  return (
    <div className="flex flex-col w-72 shrink-0 h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-xs font-semibold text-[#F8F9FC] truncate max-w-[140px]">
            {column.name}
          </h3>
          <span className="text-[10px] font-medium text-[#98989F] bg-[#252530] px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTask(column.id)}
            className="p-1 rounded-md text-[#98989F] hover:text-[#F8F9FC] hover:bg-[#252530] transition-colors"
            aria-label={`Adicionar tarefa em ${column.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {onColumnMenu && (
            <button
              onClick={() => onColumnMenu(column)}
              className="p-1 rounded-md text-[#98989F] hover:text-[#F8F9FC] hover:bg-[#252530] transition-colors"
              aria-label={`Menu da coluna ${column.name}`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Column Body - droppable zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 min-h-[200px] p-2 rounded-xl transition-colors duration-150',
          'bg-[#14141A] border border-[#1E1E28]',
          isOver && 'bg-[#C74410]/5 border-[#C74410]/30'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div
            className={cn(
              'flex-1 flex flex-col items-center justify-center p-6 rounded-lg',
              'border-2 border-dashed border-[#252530] text-[#424252]',
              isOver && 'border-[#C74410]/40 text-[#C74410]/60'
            )}
          >
            <span className="text-[10px] text-center">
              {isOver ? 'Soltar aqui' : 'Sem tarefas'}
            </span>
          </div>
        )}

        {/* Add task quick button at bottom */}
        <button
          onClick={() => onAddTask(column.id)}
          className="flex items-center gap-1.5 w-full p-2 rounded-lg text-[10px] text-[#98989F] hover:text-[#F8F9FC] hover:bg-[#252530] transition-colors group"
        >
          <Plus className="w-3 h-3" />
          <span>Adicionar tarefa</span>
        </button>
      </div>
    </div>
  )
}
