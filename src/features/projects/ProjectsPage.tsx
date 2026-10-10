import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Flag,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Archive,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useProjects, useProjectProgress } from '@/features/projects/hooks/useProjects'
import {
  PRIORITY_CONFIG,
  PROJECT_STATUS_CONFIG,
  formatDate,
  isOverdue,
} from '@/features/projects/utils/projectUtils'
import { cn } from '@/lib/utils'
import type { Project, Priority, ProjectStatus } from '@/types/projects'

const MOCK_AGENCY_ID = 'demo-agency'

const STATUS_ICONS: Record<ProjectStatus, React.ReactNode> = {
  planning: <Clock className="w-3 h-3" />,
  active: <CheckCircle2 className="w-3 h-3" />,
  on_hold: <Pause className="w-3 h-3" />,
  completed: <CheckCircle2 className="w-3 h-3" />,
  archived: <Archive className="w-3 h-3" />,
}

// -------------------------
// Project Card (Grid view)
// -------------------------
const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({
  project,
  onClick,
}) => {
  const { data: progress } = useProjectProgress(project.id)
  const statusConfig = PROJECT_STATUS_CONFIG[project.status]
  const priorityConfig = PRIORITY_CONFIG[project.priority]
  const overdue = isOverdue(project.due_date)

  return (
    <Card
      className="cursor-pointer hover:border-[#7952FF]/40 hover:shadow-lg hover:shadow-[#7952FF]/5 transition-all duration-200 group"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-semibold text-[#F8F9FC] truncate group-hover:text-[#B89EFF] transition-colors">
              {project.name}
            </h3>
            {project.client?.name && (
              <p className="text-xs text-[#717182] mt-0.5 truncate">{project.client.name}</p>
            )}
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium shrink-0',
              statusConfig.bg,
              statusConfig.color
            )}
          >
            {STATUS_ICONS[project.status]}
            {statusConfig.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#717182]">
            <span>
              {progress
                ? `${progress.done_tasks}/${progress.total_tasks} tarefas`
                : 'Sem tarefas'}
            </span>
            <span className="font-medium text-[#A1A1B0]">
              {progress ? `${progress.progress_pct}%` : '—'}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#252530] overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                (progress?.progress_pct ?? 0) === 100
                  ? 'bg-[#34D399]'
                  : 'bg-[#7952FF]'
              )}
              style={{ width: `${progress?.progress_pct ?? 0}%` }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Priority */}
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium',
                priorityConfig.bg,
                priorityConfig.color
              )}
            >
              <Flag className="w-2.5 h-2.5" />
              {priorityConfig.label}
            </span>

            {/* Members count */}
            {project.members && project.members.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#717182]">
                <Users className="w-3 h-3" />
                {project.members.length}
              </span>
            )}
          </div>

          {/* Due date */}
          {project.due_date && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-medium',
                overdue ? 'text-red-400' : 'text-[#717182]'
              )}
            >
              {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {formatDate(project.due_date)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// -------------------------
// Project Row (List view)
// -------------------------
const ProjectRow: React.FC<{ project: Project; onClick: () => void }> = ({
  project,
  onClick,
}) => {
  const { data: progress } = useProjectProgress(project.id)
  const statusConfig = PROJECT_STATUS_CONFIG[project.status]
  const priorityConfig = PRIORITY_CONFIG[project.priority]
  const overdue = isOverdue(project.due_date)

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl border border-[#30303B] bg-[#1C1C24] hover:border-[#7952FF]/40 cursor-pointer transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusConfig.dotColor }} />

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[#F8F9FC] group-hover:text-[#B89EFF] transition-colors truncate block">
          {project.name}
        </span>
        {project.client?.name && (
          <span className="text-xs text-[#717182]">{project.client.name}</span>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span
          className={cn(
            'hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium',
            statusConfig.bg,
            statusConfig.color
          )}
        >
          {statusConfig.label}
        </span>

        <span
          className={cn(
            'hidden md:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium',
            priorityConfig.bg,
            priorityConfig.color
          )}
        >
          {priorityConfig.label}
        </span>

        {/* Progress */}
        <div className="hidden lg:flex items-center gap-2 w-28">
          <div className="flex-1 h-1.5 rounded-full bg-[#252530] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7952FF]"
              style={{ width: `${progress?.progress_pct ?? 0}%` }}
            />
          </div>
          <span className="text-[10px] text-[#717182] w-8 text-right">
            {progress ? `${progress.progress_pct}%` : '—'}
          </span>
        </div>

        {project.due_date && (
          <span
            className={cn(
              'hidden sm:inline-flex items-center gap-1 text-[10px]',
              overdue ? 'text-red-400' : 'text-[#717182]'
            )}
          >
            <Calendar className="w-3 h-3" />
            {formatDate(project.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}

// -------------------------
// Main Page
// -------------------------
export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')

  const { data: projects, isLoading } = useProjects(MOCK_AGENCY_ID)

  const filtered = (projects ?? []).filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Projetos & Demandas"
        subtitle="Organize entregas, equipes e clientes em um único espaço de trabalho."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Projetos' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/projects/new')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Projeto</span>
            </Button>
          </div>
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#717182]" />
          <input
            type="search"
            placeholder="Buscar projetos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-9 bg-[#1C1C24] border border-[#30303B] rounded-lg text-sm text-[#F8F9FC] placeholder:text-[#717182] focus:outline-none focus:border-[#7952FF] transition-colors"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'planning', 'active', 'on_hold', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all duration-150',
                statusFilter === s
                  ? 'bg-[#7952FF] text-white'
                  : 'bg-[#1C1C24] border border-[#30303B] text-[#A1A1B0] hover:border-[#424252]'
              )}
            >
              {s === 'all'
                ? 'Todos'
                : PROJECT_STATUS_CONFIG[s as ProjectStatus].label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[#1C1C24] border border-[#30303B] rounded-lg p-0.5 ml-auto">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'grid'
                ? 'bg-[#252530] text-[#F8F9FC]'
                : 'text-[#717182] hover:text-[#A1A1B0]'
            )}
            aria-label="Vista em grade"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'list'
                ? 'bg-[#252530] text-[#F8F9FC]'
                : 'text-[#717182] hover:text-[#A1A1B0]'
            )}
            aria-label="Vista em lista"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          className={cn(
            view === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        search || statusFilter !== 'all' ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-8 h-8 text-[#717182] mb-3" />
            <h3 className="text-sm font-semibold text-[#F8F9FC] mb-1">
              Nenhum projeto encontrado
            </h3>
            <p className="text-xs text-[#A1A1B0]">
              Tente outros filtros ou limpe a busca.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
              }}
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={FolderKanban}
            title="Nenhum projeto em andamento"
            subtitle="Gestão de Entregas & Produção Criativa"
            description="Crie projetos para organizar entregas criativas por cliente, definir responsáveis, prazos e acompanhar o progresso das demandas no quadro Kanban."
            statusBadge="Fluxo Operacional Ativo"
            features={[
              'Quadros Kanban com colunas e categorias configuráveis',
              'Tarefas com checklists, comentários e links externos',
              'Progresso calculado em tempo real',
              'Filtros ágeis por status, prioridade e responsável',
            ]}
            actionLabel="Criar Primeiro Projeto"
            onAction={() => navigate('/projects/new')}
          />
        )
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
