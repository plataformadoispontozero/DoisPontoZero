import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { TaskCard } from '@/features/projects/components/TaskCard'
import { KanbanColumnComponent } from '@/features/projects/components/KanbanColumn'
import { TaskListView } from '@/features/projects/components/TaskListView'
import { DndContext } from '@dnd-kit/core'
import type { Task, BoardColumn } from '@/types/projects'

const mockTask: Task = {
  id: 'task-test-1',
  agency_id: 'agency-1',
  project_id: 'proj-1',
  board_id: 'board-1',
  column_id: 'col-1',
  parent_task_id: null,
  title: 'Key Visual da Campanha 2026',
  description: 'Criar composições visuais em alta resolução.',
  priority: 'urgent',
  status: 'in_progress',
  position: 1000,
  start_date: null,
  due_date: '2026-04-10',
  completed_at: null,
  archived_at: null,
  created_by: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assignees: [],
  checklists: [],
  comments_count: 3,
  attachments_count: 2,
  links_count: 1,
}

const mockColumn: BoardColumn = {
  id: 'col-1',
  agency_id: 'agency-1',
  board_id: 'board-1',
  name: 'Em Produção',
  color: '#7952FF',
  position: 1000,
  category: 'in_progress',
  wip_limit: 5,
  is_system: true,
  created_at: new Date().toISOString(),
  tasks: [mockTask],
}

describe('Fase 04: Projects & Tasks components', () => {
  it('renders TaskCard with title, priority badge and metrics', () => {
    const handleTaskClick = vi.fn()

    render(
      <AppProviders>
        <DndContext>
          <TaskCard task={mockTask} onClick={handleTaskClick} />
        </DndContext>
      </AppProviders>
    )

    expect(screen.getByText('Key Visual da Campanha 2026')).toBeInTheDocument()
    expect(screen.getByText('Urgente')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // comments
    expect(screen.getByText('2')).toBeInTheDocument() // attachments
  })

  it('renders KanbanColumn with column name and task counter', () => {
    const handleAddTask = vi.fn()
    const handleTaskClick = vi.fn()

    render(
      <AppProviders>
        <DndContext>
          <KanbanColumnComponent
            column={mockColumn}
            onAddTask={handleAddTask}
            onTaskClick={handleTaskClick}
          />
        </DndContext>
      </AppProviders>
    )

    expect(screen.getByText('Em Produção')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Key Visual da Campanha 2026')).toBeInTheDocument()
  })

  it('renders TaskListView with tasks table and filters', () => {
    const handleSelectTask = vi.fn()

    render(
      <AppProviders>
        <TaskListView
          tasks={[mockTask]}
          columns={[mockColumn]}
          onSelectTask={handleSelectTask}
        />
      </AppProviders>
    )

    expect(screen.getByPlaceholderText('Buscar tarefas...')).toBeInTheDocument()
    const matchingTasks = screen.getAllByText('Key Visual da Campanha 2026')
    expect(matchingTasks.length).toBeGreaterThan(0)

    // Click row triggers onSelectTask
    fireEvent.click(matchingTasks[0])
    expect(handleSelectTask).toHaveBeenCalledWith('task-test-1')
  })
})
