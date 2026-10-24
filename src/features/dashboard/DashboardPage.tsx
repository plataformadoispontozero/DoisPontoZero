import { isManagementRole } from '@/features/auth/access'
import { useAuth } from '@/features/auth/AuthProvider'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Users,
  Compass,
  Sparkles,
  Layers,
  FileCheck2,
} from 'lucide-react'
import { useDashboardData } from '@/features/dashboard/data/useDashboardData'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { Timeline } from '@/features/dashboard/components/Timeline'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { DepartmentWorkloadPanel } from './components/DepartmentWorkloadPanel'

export const DashboardPage: React.FC = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const {
    indicators,
    departmentWorkload,
    priorityTasks,
    recentProjects,
    upcomingMeetings,
    activities,
    isInitialEnvironment,
    error,
  } = useDashboardData()

  // Data formatada em português brasileiro (pt-BR)
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  // Capitaliza a primeira letra do dia da semana
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  if (isSupabaseConfigured && error) return <div role="alert">Não foi possível carregar os indicadores da agência. Verifique a conexão e o acesso.</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* A. CABEÇALHO */}
      <PageHeader
        title="Visão Geral"
        subtitle="Acompanhe a operação criativa da sua agência."
        badge={
          <Badge variant="accent" className="font-semibold text-[11px]">
            {capitalizedDate}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/briefings')}
              className="text-xs"
            >
              <Compass className="w-3.5 h-3.5 text-[#B8B8C0]" />
              <span>Novo Briefing</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(isManagementRole(auth.activeAgency?.roleName)?'/projects':'/tasks')}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Projeto</span>
            </Button>
          </div>
        }
      />

      {/* B. INDICADORES (4 Cards conectados à camada de dados) */}
      <section aria-labelledby="indicadores-operacionais">
        <SectionHeader
          title="Indicadores Operacionais"
          subtitle="Projetos, demandas e aprovações da agência"
          badge={
            isInitialEnvironment ? (
              <Badge variant="neutral" className="text-[10px]">
                Ambiente Inicial
              </Badge>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Projetos Ativos */}
          <Card className="hover:border-[#424252] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-[#B8B8C0]">
                Projetos ativos
              </CardTitle>
              <div className="p-2 rounded-lg bg-[#C74410]/10 text-[#C74410]">
                <FolderKanban className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-[#F8F9FC]">
                {indicators.activeProjects}
              </div>
              <p className="text-[11px] text-[#98989F] mt-1">
                {indicators.activeProjects ? 'Projetos em execução' : 'Nenhum projeto em andamento'}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Tarefas Pendentes */}
          <Card className="hover:border-[#424252] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-[#B8B8C0]">
                Tarefas pendentes
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-[#FBBF24]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-[#F8F9FC]">
                {indicators.pendingTasks}
              </div>
              <p className="text-[11px] text-[#98989F] mt-1">
                {indicators.pendingTasks ? 'Demandas aguardando conclusão' : 'Fila de produção limpa'}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Entregas da Semana */}
          <Card className="hover:border-[#424252] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-[#B8B8C0]">
                Entregas da semana
              </CardTitle>
              <div className="p-2 rounded-lg bg-[#FF8759]/10 text-[#FF8759]">
                <Clock className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-[#F8F9FC]">
                {indicators.weekDeliveries}
              </div>
              <p className="text-[11px] text-[#98989F] mt-1">
                {indicators.weekDeliveries ? 'Entregas previstas nos próximos 7 dias' : 'Sem entregas previstas nesta semana'}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Aprovações Aguardando */}
          <Card className="hover:border-[#424252] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-[#B8B8C0]">
                Aprovações aguardando
              </CardTitle>
              <div className="p-2 rounded-lg bg-[#34D399]/10 text-[#34D399]">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-[#F8F9FC]">
                {indicators.pendingApprovals}
              </div>
              <p className="text-[11px] text-[#98989F] mt-1">
                {indicators.pendingApprovals ? 'Calendários aguardando decisão' : 'Sem calendários pendentes de aceite'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <DepartmentWorkloadPanel workload={departmentWorkload ?? []} />

      {/* C. MINHAS PRIORIDADES */}
      <section aria-labelledby="suas-prioridades">
        <SectionHeader
          title="Suas prioridades"
          subtitle="Demandas críticas atribuídas a você"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tasks')}
              className="text-xs text-[#B8B8C0] hover:text-[#F8F9FC]"
            >
              <span>Ver todas as tarefas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          }
        />

        {priorityTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {priorityTasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-[#F8F9FC]">
                      {task.title}
                    </h4>
                    <span className="text-[11px] text-[#B8B8C0]">
                      {task.projectName} • {task.clientName}
                    </span>
                  </div>
                  <Badge variant="warning">{task.priority}</Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-[#30303B] bg-[#1C1C24]/40">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-[#252530] flex items-center justify-center text-[#B8B8C0] mb-3">
                <CheckCircle2 className="w-6 h-6 text-[#34D399]" />
              </div>
              <h4 className="font-heading text-sm font-semibold text-[#F8F9FC]">
                Nenhuma tarefa atribuída ainda.
              </h4>
              <p className="text-xs text-[#B8B8C0] max-w-sm mt-1 mb-4">
                Você não possui demandas alocadas para hoje. Explore os projetos da agência para visualizar o backlog operacional.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(isManagementRole(auth.activeAgency?.roleName)?'/projects':'/tasks')}
                className="gap-2 text-xs"
              >
                <span>Explorar projetos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Grid Duplo: PROJETOS RECENTES (2 cols) & REUNIÕES + ATIVIDADE (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* D. PROJETOS RECENTES */}
        <section className="lg:col-span-2 space-y-4" aria-labelledby="projetos-recentes">
          <SectionHeader
            title="Projetos recentes"
            subtitle="Campanhas e entregáveis em andamento"
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(isManagementRole(auth.activeAgency?.roleName)?'/projects':'/tasks')}
                className="text-xs text-[#B8B8C0] hover:text-[#F8F9FC]"
              >
                <span>Ver projetos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            }
          />

          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentProjects.map((project) => (
                <Card key={project.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#F8F9FC]">
                        {project.name}
                      </h4>
                      <p className="text-xs text-[#B8B8C0]">{project.client}</p>
                    </div>
                    <StatusIndicator status="in_progress" label={({planning:'Planejamento',in_progress:'Em produção',review:'Em revisão',completed:'Concluído',paused:'Em pausa'} as Record<string,string>)[project.status]||project.status} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-[#B8B8C0]">
                      <span>Progresso</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#252530] overflow-hidden">
                      <div
                        className="h-full bg-[#C74410] rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#98989F] pt-2 border-t border-[#30303B]">
                    <span>{project.owner.name?`Resp: ${project.owner.name}`:'Responsável não informado'}</span>
                    <span>{project.deadline?`Prazo: ${project.deadline}`:'Sem prazo definido'}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-[#30303B] bg-[#1C1C24]/40">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-[#252530] flex items-center justify-center text-[#B8B8C0] mb-3">
                  <FolderKanban className="w-6 h-6 text-[#C74410]" />
                </div>
                <h4 className="font-heading text-sm font-semibold text-[#F8F9FC]">
                  Nenhum projeto registrado no workspace
                </h4>
                <p className="text-xs text-[#B8B8C0] max-w-sm mt-1 mb-4">
                  Os projetos criados com squads, clientes e prazos de entrega aparecerão aqui com progresso dinâmico.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(isManagementRole(auth.activeAgency?.roleName)?'/projects':'/tasks')}
                  className="gap-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Primeiro Projeto</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* F. ATIVIDADE RECENTE */}
          <div className="pt-4 space-y-3">
            <SectionHeader
              title="Atividade recente"
              subtitle="Histórico operacional do workspace"
            />
            <Card className="p-4">
              <Timeline activities={activities} />
            </Card>
          </div>
        </section>

        {/* E. PRÓXIMAS REUNIÕES & STATUS DO SISTEMA (1 coluna lateral) */}
        <div className="space-y-6">
          {/* E. Próximas Reuniões */}
          <section className="space-y-3" aria-labelledby="proximas-reunioes">
            <SectionHeader
              title="Próximas reuniões"
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/meetings')}
                  className="text-xs text-[#B8B8C0] hover:text-[#F8F9FC]"
                >
                  <span>Agenda</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              }
            />

            {upcomingMeetings.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingMeetings.map((meeting) => (
                  <Card key={meeting.id} className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-semibold text-[#F8F9FC]">
                        {meeting.title}
                      </h4>
                      <Badge variant="accent" className="text-[10px]">
                        {meeting.platform}
                      </Badge>
                    </div>
                    {meeting.client && (
                      <p className="text-[11px] text-[#B8B8C0]">{meeting.client}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-[#98989F]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C74410]" />
                        {meeting.time}
                      </span>
                      <span>{meeting.attendees.length} participantes</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-[#30303B] bg-[#1C1C24]/40">
                <CardContent className="p-6 text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-[#252530] flex items-center justify-center text-[#B8B8C0] mb-2.5">
                    <Calendar className="w-5 h-5 text-[#FF8759]" />
                  </div>
                  <h4 className="font-heading text-xs font-semibold text-[#F8F9FC]">
                    Nenhuma reunião agendada para hoje
                  </h4>
                  <p className="text-[11px] text-[#B8B8C0] mt-1 mb-3">
                    Sincronize com Google Calendar ou crie pautas de alinhamento com clientes.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/meetings')}
                    className="text-xs"
                  >
                    Agendar Reunião
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>


        </div>
      </div>
    </div>
  )
}
