import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Calendar as CalendarIcon,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { TaskListView } from '@/features/projects/components/TaskListView'
import { TaskCalendarView } from '@/features/projects/components/TaskCalendarView'
import { TaskDetailPanel } from '@/features/projects/components/TaskDetailPanel'
import { CreateTaskDialog } from '@/features/projects/components/CreateTaskDialog'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import type { Task, BoardColumn, Priority, TaskStatus } from '@/types/projects'

const MOCK_AGENCY_ID = 'demo-agency'

// Fallback demo columns
const DEMO_COLUMNS: BoardColumn[] = [
  {
    id: 'col-backlog',
    agency_id: MOCK_AGENCY_ID,
    board_id: 'board-1',
    name: 'Backlog Criativo',
    color: '#717182',
    position: 1000,
    category: 'backlog',
    wip_limit: null,
    is_system: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'col-in-progress',
    agency_id: MOCK_AGENCY_ID,
    board_id: 'board-1',
    name: 'Em Produção',
    color: '#7952FF',
    position: 2000,
    category: 'in_progress',
    wip_limit: 4,
    is_system: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'col-review',
    agency_id: MOCK_AGENCY_ID,
    board_id: 'board-1',
    name: 'Revisão Criativa',
    color: '#FBBF24',
    position: 3000,
    category: 'review',
    wip_limit: 3,
    is_system: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'col-done',
    agency_id: MOCK_AGENCY_ID,
    board_id: 'board-1',
    name: 'Aprovado & Concluído',
    color: '#34D399',
    position: 4000,
    category: 'done',
    wip_limit: null,
    is_system: true,
    created_at: new Date().toISOString(),
  },
]

// Fallback demo tasks
const DEMO_TASKS: Task[] = [
  {
    id: 'task-1',
    agency_id: MOCK_AGENCY_ID,
    project_id: 'proj-1',
    board_id: 'board-1',
    column_id: 'col-backlog',
    parent_task_id: null,
    title: 'Definição da paleta de cores e tipografia de suporte',
    description: 'Validar contrastes no Figma com o Brand Book oficial do cliente.',
    priority: 'normal',
    status: 'open',
    position: 1000,
    start_date: null,
    due_date: '2026-03-25',
    completed_at: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [],
    checklists: [],
    comments_count: 2,
    attachments_count: 1,
    links_count: 1,
  },
  {
    id: 'task-2',
    agency_id: MOCK_AGENCY_ID,
    project_id: 'proj-1',
    board_id: 'board-1',
    column_id: 'col-in-progress',
    parent_task_id: null,
    title: 'Roteiro e storyboard para vídeo manifesto de 30s',
    description: 'Alinhar narrativa com a equipe de estratégia antes do voice over.',
    priority: 'urgent',
    status: 'in_progress',
    position: 2000,
    start_date: '2026-03-10',
    due_date: '2026-03-20',
    completed_at: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [],
    checklists: [],
    comments_count: 4,
    attachments_count: 2,
    links_count: 2,
  },
  {
    id: 'task-3',
    agency_id: MOCK_AGENCY_ID,
    project_id: 'proj-1',
    board_id: 'board-1',
    column_id: 'col-in-progress',
    parent_task_id: null,
    title: 'Grid de 9 posts para Instagram Reels e Carrossel',
    description: 'Mockups estáticos em alta resolução no Canva e Figma.',
    priority: 'high',
    status: 'in_progress',
    position: 3000,
    start_date: null,
    due_date: '2026-03-22',
    completed_at: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [],
    checklists: [],
    comments_count: 1,
    attachments_count: 0,
    links_count: 1,
  },
  {
    id: 'task-4',
    agency_id: MOCK_AGENCY_ID,
    project_id: 'proj-1',
    board_id: 'board-1',
    column_id: 'col-review',
    parent_task_id: null,
    title: 'Copywriting das legendas e headlines de anúncio',
    description: 'Revisão ortográfica e aprovação pelo Head de Conteúdo.',
    priority: 'normal',
    status: 'review',
    position: 4000,
    start_date: null,
    due_date: '2026-03-18',
    completed_at: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [],
    checklists: [],
    comments_count: 3,
    attachments_count: 1,
    links_count: 0,
  },
  {
    id: 'task-5',
    agency_id: MOCK_AGENCY_ID,
    project_id: 'proj-1',
    board_id: 'board-1',
    column_id: 'col-done',
    parent_task_id: null,
    title: 'Briefing estratégico e alinhamento de personas',
    description: 'Documento assinado pelo cliente em kick-off.',
    priority: 'normal',
    status: 'done',
    position: 5000,
    start_date: null,
    due_date: '2026-03-05',
    completed_at: '2026-03-05T14:00:00Z',
    archived_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [],
    checklists: [],
    comments_count: 0,
    attachments_count: 2,
    links_count: 1,
  },
]

export const TasksPage: React.FC = () => {
  const { taskId } = useParams<{ taskId?: string }>()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId ?? null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  // Sync state if URL param changes
  useEffect(() => {
    if (taskId) {
      setSelectedTaskId(taskId)
    }
  }, [taskId])

  const handleSelectTask = (id: string | null) => {
    setSelectedTaskId(id)
    if (id) {
      navigate(`/tasks/${id}`, { replace: false })
    } else {
      navigate('/tasks', { replace: false })
    }
  }

  // Supabase query
  const { data: serverTasks = [] } = useTasks({
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  })

  // Fallback to DEMO_TASKS when server query returns empty
  const tasksToDisplay = serverTasks.length > 0 ? serverTasks : DEMO_TASKS

  const filteredTasks = tasksToDisplay.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && t.status !== statusFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Tarefas & Produção"
        subtitle="Gerenciamento operacional de entregáveis criativos, checklists técnicos e prazos da agência."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Tarefas' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateTaskOpen(true)}
              className="h-9 px-4 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Nova Tarefa</span>
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#1C1C24] p-4 rounded-2xl border border-[#30303B] space-y-1">
          <span className="text-[11px] font-semibold text-[#717182] uppercase tracking-wider">
            Total de Tarefas
          </span>
          <p className="font-heading text-xl font-bold text-[#F8F9FC]">{tasksToDisplay.length}</p>
        </div>
        <div className="bg-[#1C1C24] p-4 rounded-2xl border border-[#30303B] space-y-1">
          <span className="text-[11px] font-semibold text-[#7952FF] uppercase tracking-wider">
            Em Produção
          </span>
          <p className="font-heading text-xl font-bold text-[#7952FF]">
            {tasksToDisplay.filter((t) => t.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-[#1C1C24] p-4 rounded-2xl border border-[#30303B] space-y-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Em Revisão
          </span>
          <p className="font-heading text-xl font-bold text-amber-400">
            {tasksToDisplay.filter((t) => t.status === 'review').length}
          </p>
        </div>
        <div className="bg-[#1C1C24] p-4 rounded-2xl border border-[#30303B] space-y-1">
          <span className="text-[11px] font-semibold text-[#34D399] uppercase tracking-wider">
            Concluídas
          </span>
          <p className="font-heading text-xl font-bold text-[#34D399]">
            {tasksToDisplay.filter((t) => t.status === 'done').length}
          </p>
        </div>
      </div>

      {/* Tabs and Views */}
      <Tabs defaultValue="list" value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
        <div className="flex items-center justify-between border-b border-[#30303B] pb-3">
          <TabsList className="bg-[#1C1C24] p-1">
            <TabsTrigger value="list" className="text-xs gap-1.5">
              <List className="w-3.5 h-3.5" />
              <span>Lista ({filteredTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* List View */}
        <TabsContent value="list" className="pt-2">
          <TaskListView
            tasks={filteredTasks}
            columns={DEMO_COLUMNS}
            onSelectTask={(id) => handleSelectTask(id)}
            onNewTask={() => setCreateTaskOpen(true)}
          />
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="pt-2">
          <TaskCalendarView
            tasks={filteredTasks}
            columns={DEMO_COLUMNS}
            onSelectTask={(id) => handleSelectTask(id)}
            onNewTask={() => setCreateTaskOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        columns={DEMO_COLUMNS}
        projectId="proj-1"
        boardId="board-1"
        agencyId={MOCK_AGENCY_ID}
      />

      <TaskDetailPanel
        taskId={selectedTaskId}
        projectId="proj-1"
        agencyId={MOCK_AGENCY_ID}
        columns={DEMO_COLUMNS}
        open={!!selectedTaskId}
        onClose={() => handleSelectTask(null)}
      />
    </div>
  )
}
