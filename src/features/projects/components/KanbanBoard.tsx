import React, { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  closestCorners,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { KanbanColumnComponent } from '@/features/projects/components/KanbanColumn'
import { TaskCardOverlay } from '@/features/projects/components/TaskCard'
import { useMoveTask } from '@/features/tasks/hooks/useTasks'
import { getPositionBetween, getPositionAtEnd, getPositionAtStart } from '@/features/projects/utils/projectUtils'
import type { ProjectBoard, Task, BoardColumn } from '@/types/projects'
import { toast } from '@/components/ui/Toast'

interface KanbanBoardProps {
  board: ProjectBoard
  projectId: string
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Task) => void
  onColumnMenu?: (column: BoardColumn) => void
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  board,
  projectId,
  onAddTask,
  onTaskClick,
  onColumnMenu,
}) => {
  const moveTaskMutation = useMoveTask()

  // Local optimistic state for columns+tasks
  const [columns, setColumns] = useState<BoardColumn[]>(
    (board.columns ?? []).map((col) => ({
      ...col,
      tasks: col.tasks ?? [],
    }))
  )

  // Keep columns in sync with prop changes (e.g. after refetch)
  React.useEffect(() => {
    setColumns(
      (board.columns ?? []).map((col) => ({
        ...col,
        tasks: col.tasks ?? [],
      }))
    )
  }, [board])

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const prevColumns = useRef<BoardColumn[]>(columns)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // 6px move before drag starts
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Find task across all columns
  const findTaskColumn = useCallback(
    (taskId: string): BoardColumn | undefined => {
      return columns.find((col) =>
        (col.tasks as Task[])?.some((t) => t.id === taskId)
      )
    },
    [columns]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = event.active.id as string
      const col = findTaskColumn(taskId)
      if (!col) return
      const task = (col.tasks as Task[]).find((t) => t.id === taskId)
      if (task) {
        setActiveTask(task)
        prevColumns.current = columns // snapshot for rollback
      }
    },
    [columns, findTaskColumn]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeTaskId = active.id as string
      const overId = over.id as string

      setColumns((prev) => {
        const sourceCol = prev.find((col) =>
          (col.tasks as Task[]).some((t) => t.id === activeTaskId)
        )
        // overId can be a column id or a task id
        const destCol =
          prev.find((col) => col.id === overId) ??
          prev.find((col) => (col.tasks as Task[]).some((t) => t.id === overId))

        if (!sourceCol || !destCol || sourceCol.id === destCol.id) return prev

        const sourceTask = (sourceCol.tasks as Task[]).find((t) => t.id === activeTaskId)!

        return prev.map((col) => {
          if (col.id === sourceCol.id) {
            return {
              ...col,
              tasks: (col.tasks as Task[]).filter((t) => t.id !== activeTaskId),
            }
          }
          if (col.id === destCol.id) {
            const overTaskIndex = (col.tasks as Task[]).findIndex((t) => t.id === overId)
            const newTasks = [...(col.tasks as Task[])]
            if (overTaskIndex >= 0) {
              newTasks.splice(overTaskIndex, 0, { ...sourceTask, column_id: col.id })
            } else {
              newTasks.push({ ...sourceTask, column_id: col.id })
            }
            return { ...col, tasks: newTasks }
          }
          return col
        })
      })
    },
    []
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTask(null)

      if (!over) return

      const activeTaskId = active.id as string
      const overId = over.id as string

      // Find destination column and task position
      const destCol = columns.find((col) =>
        col.id === overId || (col.tasks as Task[]).some((t) => t.id === overId)
      )

      if (!destCol) return

      const destTasks = destCol.tasks as Task[]
      const overTaskIndex = destTasks.findIndex((t) => t.id === overId)
      const activeTaskIndex = destTasks.findIndex((t) => t.id === activeTaskId)

      // Calculate new position
      let newPosition: number
      if (destTasks.length === 0 || (destTasks.length === 1 && destTasks[0].id === activeTaskId)) {
        newPosition = 1000
      } else if (overTaskIndex === -1) {
        // dropped on column itself → append at end
        newPosition = getPositionAtEnd(destTasks.filter((t) => t.id !== activeTaskId))
      } else if (overTaskIndex === 0) {
        newPosition = getPositionAtStart(destTasks.filter((t) => t.id !== activeTaskId))
      } else {
        const taskBefore = destTasks[overTaskIndex - 1]
        const taskAfter = destTasks[overTaskIndex]
        if (taskBefore && taskAfter && taskBefore.id !== activeTaskId && taskAfter.id !== activeTaskId) {
          newPosition = getPositionBetween(taskBefore.position, taskAfter.position)
        } else {
          newPosition = getPositionAtEnd(destTasks.filter((t) => t.id !== activeTaskId))
        }
      }

      // Persist via RPC
      try {
        await moveTaskMutation.mutateAsync({
          taskId: activeTaskId,
          columnId: destCol.id,
          position: newPosition,
          projectId,
        })
      } catch (err) {
        // Rollback optimistic update
        setColumns(prevColumns.current)
        toast.error('Erro ao mover tarefa. Posição revertida.')
        console.error(err)
      }
    },
    [columns, moveTaskMutation, projectId]
  )

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.4' } },
    }),
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div
        className="flex gap-4 h-full overflow-x-auto pb-4 pt-1 px-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#30303B transparent' }}
      >
        {columns.map((col) => (
          <KanbanColumnComponent
            key={col.id}
            column={col}
            tasks={(col.tasks as Task[]) ?? []}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
            onColumnMenu={onColumnMenu}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation} modifiers={[restrictToWindowEdges]}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
