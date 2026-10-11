import { isSupabaseConfigured } from '@/lib/supabase/client'
import { useAgencyId } from '@/features/auth/AuthProvider'
import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  FolderKanban,
  Kanban,
  List,
  MoreVertical,
  Plus,
  Settings,
  Share2,
  Users,
  Activity,
  FileText,
  Paperclip,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { KanbanBoard } from '@/features/projects/components/KanbanBoard'
import { TaskListView } from '@/features/projects/components/TaskListView'
import { TaskCalendarView } from '@/features/projects/components/TaskCalendarView'
import { CreateTaskDialog } from '@/features/projects/components/CreateTaskDialog'
import { TaskDetailPanel } from '@/features/projects/components/TaskDetailPanel'
import { useProject, useProjectBoard, useProjectProgress } from '@/features/projects/hooks/useProjects'
import {
  PROJECT_STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
} from '@/features/projects/utils/projectUtils'
import type { Project, ProjectBoard, Task, BoardColumn } from '@/types/projects'

const MOCK_AGENCY_ID = 'demo-agency'

export const ProjectWorkspacePage: React.FC = () => {
  const MOCK_AGENCY_ID = useAgencyId()

  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // Queries
  const { data: projectData, isLoading: isProjectLoading } = useProject(projectId)
  const { data: boardData, isLoading: isBoardLoading } = useProjectBoard(projectId)
  const { data: progressData } = useProjectProgress(projectId)

  // Local state for modals & panels
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [defaultColumnId, setDefaultColumnId] = useState<string | undefined>(undefined)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('kanban')

  // Fallback demo project if none returned from query
  const project: Project = projectData ?? {
    id: projectId || 'demo-project',
    agency_id: MOCK_AGENCY_ID,
    client_id: 'client-1',
    name: 'Campanha de Verão 2026',
    slug: 'campanha-verao-2026',
    description: 'Desenvolvimento criativo completo: key visual, social media, landing page e motion graphics.',
    status: 'active',
    priority: 'high',
    start_date: '2026-03-01',
    due_date: '2026-04-15',
    completed_at: null,
    archived_at: null,
    owner_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'client-1',
      agency_id: MOCK_AGENCY_ID,
      name: 'Natura & Co',
      slug: 'natura',
      logo_url: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    members: [],
  }

  // Fallback demo board with columns & sample creative tasks
  const defaultColumns: BoardColumn[] = [
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
      tasks: [
        {
          id: 'task-1',
          agency_id: MOCK_AGENCY_ID,
          project_id: project.id,
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
      ],
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
      tasks: [
        {
          id: 'task-2',
          agency_id: MOCK_AGENCY_ID,
          project_id: project.id,
          board_id: 'board-1',
          column_id: 'col-in-progress',
          parent_task_id: null,
          title: 'Roteiro e storyboard para vídeo manifesto de 30s',
          description: 'Alinhar narrativa com a equipe de estratégia antes do voice over.',
          priority: 'urgent',
          status: 'in_progress',
          position: 1000,
          start_date: '2026-03-10',
          due_date: '2026-03-20',
          completed_at: null,
          archived_at: null,
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: [],
          checklists: [
            {
              id: 'chk-1',
              task_id: 'task-2',
              agency_id: MOCK_AGENCY_ID,
              title: 'Cenas',
              position: 1000,
              items: [
                {
                  id: 'item-1',
                  checklist_id: 'chk-1',
                  agency_id: MOCK_AGENCY_ID,
                  title: 'Abertura com transição de produto',
                  is_completed: true,
                  completed_by: 'user-1',
                  completed_at: new Date().toISOString(),
                  position: 1000,
                },
                {
                  id: 'item-2',
                  checklist_id: 'chk-1',
                  agency_id: MOCK_AGENCY_ID,
                  title: 'Lettering institucional',
                  is_completed: false,
                  completed_by: null,
                  completed_at: null,
                  position: 2000,
                },
              ],
            },
          ],
          comments_count: 4,
          attachments_count: 2,
          links_count: 2,
        },
        {
          id: 'task-3',
          agency_id: MOCK_AGENCY_ID,
          project_id: project.id,
          board_id: 'board-1',
          column_id: 'col-in-progress',
          parent_task_id: null,
          title: 'Grid de 9 posts para Instagram Reels e Carrossel',
          description: 'Mockups estáticos em alta resolução no Canva e Figma.',
          priority: 'high',
          status: 'in_progress',
          position: 2000,
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
      ],
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
      tasks: [
        {
          id: 'task-4',
          agency_id: MOCK_AGENCY_ID,
          project_id: project.id,
          board_id: 'board-1',
          column_id: 'col-review',
          parent_task_id: null,
          title: 'Copywriting das legendas e headlines de anúncio',
          description: 'Revisão ortográfica e aprovação pelo Head de Conteúdo.',
          priority: 'normal',
          status: 'review',
          position: 1000,
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
      ],
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
      tasks: [
        {
          id: 'task-5',
          agency_id: MOCK_AGENCY_ID,
          project_id: project.id,
          board_id: 'board-1',
          column_id: 'col-done',
          parent_task_id: null,
          title: 'Briefing estratégico e alinhamento de personas',
          description: 'Documento assinado pelo cliente em kick-off.',
          priority: 'normal',
          status: 'done',
          position: 1000,
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
      ],
    },
  ]

  const board: ProjectBoard = boardData ?? {
    id: 'board-1',
    agency_id: MOCK_AGENCY_ID,
    project_id: project.id,
    name: 'Quadro Principal',
    is_default: true,
    created_at: new Date().toISOString(),
    columns: defaultColumns,
  }

  // Flatten all tasks for List and Calendar views
  const allTasks: Task[] = (board.columns ?? []).flatMap((col) => col.tasks ?? [])

  const handleOpenNewTask = (colId?: string) => {
    setDefaultColumnId(colId ?? board.columns?.[0]?.id)
    setCreateTaskOpen(true)
  }

  const handleTaskClick = (task: Task | string) => {
    const id = typeof task === 'string' ? task : task.id
    setSelectedTaskId(id)
  }

  const statusCfg = PROJECT_STATUS_CONFIG[project.status]
  const priorityCfg = PRIORITY_CONFIG[project.priority]

  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((t) => t.status === 'done' || t.column_id === 'col-done').length
  const percentCompleted = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (isSupabaseConfigured && (!projectData || !boardData)) return <div role="alert">Recurso indisponível, carregando ou sem permissão. Nenhum exemplo substitui o recurso da agência.</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-[#1C1C24] border border-[#30303B] rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#30303B]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#98989F]">
              <button
                onClick={() => navigate('/projects')}
                className="hover:text-[#F8F9FC] transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Projetos</span>
              </button>
              <span>/</span>
              {project.client && (
                <>
                  <span className="text-[#B8B8C0] font-medium">{project.client.name}</span>
                  <span>/</span>
                </>
              )}
              <span className="text-[#F8F9FC] truncate max-w-[200px]">{project.name}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-1">
              <h1 className="font-heading text-xl md:text-2xl font-bold text-[#F8F9FC]">
                {project.name}
              </h1>
              <Badge variant="outline" className={statusCfg.color}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor} mr-1.5`} />
                {statusCfg.label}
              </Badge>
              <Badge variant="outline" className={priorityCfg.color}>
                <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dotColor} mr-1.5`} />
                {priorityCfg.label}
              </Badge>
            </div>

            {project.description && (
              <p className="text-xs text-[#B8B8C0] max-w-2xl pt-1">{project.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenNewTask()}
              className="h-9 px-4 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nova Tarefa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${project.id}/settings`)}
              className="h-9 w-9 p-0 text-[#B8B8C0] hover:text-[#F8F9FC]"
              title="Configurações do Projeto"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Project Meta Bar: Dates, Progress, Team */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 items-center">
          {/* Dates */}
          <div className="flex items-center gap-3 text-xs text-[#B8B8C0]">
            <Calendar className="w-4 h-4 text-[#C74410]" />
            <div>
              <span className="text-[#98989F] block text-[10px] uppercase font-semibold">Prazo de Entrega</span>
              <span>{formatDate(project.due_date)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#98989F] text-[10px] uppercase font-semibold">Progresso Geral</span>
              <span className="text-[#F8F9FC] font-bold text-xs">{percentCompleted}%</span>
            </div>
            <div className="w-full bg-[#14141A] rounded-full h-2 overflow-hidden border border-[#30303B]/60">
              <div
                className="bg-gradient-to-r from-[#C74410] to-[#FF8759] h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentCompleted}%` }}
              />
            </div>
          </div>

          {/* Team Members */}
          <div className="flex items-center justify-start sm:justify-end gap-2">
            <span className="text-[10px] uppercase font-semibold text-[#98989F] mr-1">Equipe:</span>
            <div className="flex -space-x-2">
              <Avatar name="Diretor de Arte" size="sm" className="w-7 h-7 text-[10px] ring-2 ring-[#1C1C24]" />
              <Avatar name="Copywriter" size="sm" className="w-7 h-7 text-[10px] ring-2 ring-[#1C1C24]" />
              <Avatar name="Motion Designer" size="sm" className="w-7 h-7 text-[10px] ring-2 ring-[#1C1C24]" />
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs: Quadro (Kanban), Lista, Calendário */}
      <Tabs defaultValue="kanban" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b border-[#30303B] pb-3">
          <TabsList className="bg-[#1C1C24] p-1">
            <TabsTrigger value="kanban" className="text-xs gap-1.5">
              <Kanban className="w-3.5 h-3.5" />
              <span>Quadro</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs gap-1.5">
              <List className="w-3.5 h-3.5" />
              <span>Lista ({allTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </TabsTrigger>
          </TabsList>

          <div className="text-xs text-[#98989F] hidden sm:block">
            {allTasks.length} {allTasks.length === 1 ? 'tarefa no fluxo' : 'tarefas no fluxo'}
          </div>
        </div>

        {/* Quadro Tab (Kanban) */}
        <TabsContent value="kanban" className="pt-2">
          <KanbanBoard
            board={board}
            projectId={project.id}
            onAddTask={(columnId) => handleOpenNewTask(columnId)}
            onTaskClick={(task) => handleTaskClick(task)}
          />
        </TabsContent>

        {/* Lista Tab */}
        <TabsContent value="list" className="pt-2">
          <TaskListView
            tasks={allTasks}
            columns={board.columns ?? []}
            onSelectTask={(id) => handleTaskClick(id)}
            onNewTask={() => handleOpenNewTask()}
          />
        </TabsContent>

        {/* Calendário Tab */}
        <TabsContent value="calendar" className="pt-2">
          <TaskCalendarView
            tasks={allTasks}
            columns={board.columns ?? []}
            onSelectTask={(id) => handleTaskClick(id)}
            onNewTask={() => handleOpenNewTask()}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs and Panels */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        columns={board.columns ?? []}
        defaultColumnId={defaultColumnId}
        projectId={project.id}
        boardId={board.id}
        agencyId={project.agency_id}
      />

      <TaskDetailPanel
        taskId={selectedTaskId}
        projectId={project.id}
        agencyId={project.agency_id}
        columns={board.columns ?? []}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}
