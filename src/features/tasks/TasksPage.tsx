import { ClientTaskGroups } from './ClientTaskGroups'
import { useTask } from '@/features/tasks/hooks/useTasks'
import { useProjectBoard, useProjects } from '@/features/projects/hooks/useProjects'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { useAgencyId, usePermission } from '@/features/auth/AuthProvider'
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
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
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
    color: '#98989F',
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
    color: '#C74410',
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
  const MOCK_AGENCY_ID = useAgencyId()
  const canCreateTask=usePermission('tasks.create')
  const projectsQuery=useProjects()
  const projects=projectsQuery.data||[]

  const { taskId } = useParams<{ taskId?: string }>()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId ?? null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [chooseTaskProjectOpen,setChooseTaskProjectOpen]=useState(false)
  const [requestedCreateProjectId,setRequestedCreateProjectId]=useState('')

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
    status: undefined,
    priority: priorityFilter || undefined,
  })

  const { data: selectedTaskData } = useTask(selectedTaskId ?? undefined)
  const activeTask = selectedTaskData ?? serverTasks.find(task => task.id === selectedTaskId)
  const { data: activeBoard } = useProjectBoard(activeTask?.project_id)
  const createProject = projects.find(project=>project.id===requestedCreateProjectId)||projects[0]
  const createBoardQuery=useProjectBoard(isSupabaseConfigured&&(chooseTaskProjectOpen||createTaskOpen)?createProject?.id:undefined)
  const openCreateTask = () => {if(canCreateTask){if(isSupabaseConfigured)setChooseTaskProjectOpen(true);else setCreateTaskOpen(true)}}

  // Demo fixtures are limited to the unconfigured local environment.
  const tasksToDisplay = isSupabaseConfigured ? serverTasks : DEMO_TASKS

  const filteredTasks = tasksToDisplay.filter((t) => {
    if (search && !`${t.title} ${t.project?.client?.name||''}`.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && statusFilter !== 'done' && t.status !== statusFilter) return false
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
              disabled={!canCreateTask}
              onClick={openCreateTask}
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
          <span className="text-[11px] font-semibold text-[#98989F] uppercase tracking-wider">
            Total de Tarefas
          </span>
          <p className="font-heading text-xl font-bold text-[#F8F9FC]">{tasksToDisplay.length}</p>
        </div>
        <div className="bg-[#1C1C24] p-4 rounded-2xl border border-[#30303B] space-y-1">
          <span className="text-[11px] font-semibold text-[#C74410] uppercase tracking-wider">
            Em Produção
          </span>
          <p className="font-heading text-xl font-bold text-[#C74410]">
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
              <span>Clientes em produção</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* List View */}
        <TabsContent value="list" className="pt-2">
          <div className="mb-5 flex flex-wrap gap-3"><Input aria-label="Buscar cliente ou demanda" placeholder="Buscar cliente ou demanda…" value={search} onChange={e=>setSearch(e.target.value)}/><label className="text-sm"><input type="checkbox" checked={statusFilter==='done'} onChange={e=>setStatusFilter(e.target.checked?'done':'')}/> Incluir clientes com entregas concluídas</label></div>
          <ClientTaskGroups tasks={filteredTasks} activeOnly={statusFilter!=='done'} onSelect={task=>handleSelectTask(task.id)}/>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="pt-2">
          <TaskCalendarView
            tasks={filteredTasks}
            columns={isSupabaseConfigured ? activeBoard?.columns ?? [] : DEMO_COLUMNS}
            onSelectTask={(id) => handleSelectTask(id)}
            onNewTask={openCreateTask}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <Dialog open={chooseTaskProjectOpen} onOpenChange={setChooseTaskProjectOpen}>
        <DialogHeader onClose={()=>setChooseTaskProjectOpen(false)}><DialogTitle>Escolha o projeto da tarefa</DialogTitle></DialogHeader>
        <DialogContent className="space-y-3">
          <p className="text-sm text-[#B8B8C0]">A tarefa será criada no quadro do projeto selecionado.</p>
          {projectsQuery.isLoading?<p role="status">Carregando projetos…</p>:projectsQuery.isError?<p role="alert">Não foi possível carregar os projetos. Atualize a página e tente novamente.</p>:projects.length===0?<p>Nenhum projeto disponível para sua conta.</p>:<Select aria-label="Projeto da nova tarefa" value={createProject?.id||''} onChange={event=>setRequestedCreateProjectId(event.target.value)} options={projects.map(project=>({value:project.id,label:project.name}))}/>}
          {createBoardQuery.isError&&<p role="alert">Não foi possível carregar o quadro deste projeto.</p>}
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={()=>setChooseTaskProjectOpen(false)}>Cancelar</Button>
          <Button variant="primary" size="sm" disabled={!createProject||projectsQuery.isLoading||projectsQuery.isError||createBoardQuery.isLoading||createBoardQuery.isError||!createBoardQuery.data?.id||!createBoardQuery.data?.columns?.length} onClick={()=>{setChooseTaskProjectOpen(false);setCreateTaskOpen(true)}}>Continuar</Button>
        </DialogFooter>
      </Dialog>
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        columns={isSupabaseConfigured ? createBoardQuery.data?.columns ?? [] : DEMO_COLUMNS}
        projectId={isSupabaseConfigured ? createProject?.id ?? '' : 'proj-1'}
        boardId={isSupabaseConfigured ? createBoardQuery.data?.id ?? '' : 'board-1'}
        agencyId={MOCK_AGENCY_ID}
      />

      <TaskDetailPanel
        taskId={selectedTaskId}
        projectId={isSupabaseConfigured ? activeTask?.project_id ?? '' : 'proj-1'}
        agencyId={MOCK_AGENCY_ID}
        columns={isSupabaseConfigured ? activeBoard?.columns ?? [] : DEMO_COLUMNS}
        open={!!selectedTaskId}
        onClose={() => handleSelectTask(null)}
      />
    </div>
  )
}
