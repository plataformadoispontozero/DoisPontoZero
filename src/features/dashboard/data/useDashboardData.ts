import { useState } from 'react'
import type {
  OperationalIndicators,
  UserPriorityTask,
  RecentProject,
  UpcomingMeeting,
  OperationalActivity,
} from '@/features/dashboard/types'

export interface DashboardDataState {
  indicators: OperationalIndicators
  priorityTasks: UserPriorityTask[]
  recentProjects: RecentProject[]
  upcomingMeetings: UpcomingMeeting[]
  activities: OperationalActivity[]
  isLoading: boolean
  error: Error | null
  isInitialEnvironment: boolean
}

export function useDashboardData(): DashboardDataState & {
  refresh: () => Promise<void>
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error] = useState<Error | null>(null)

  // Estado Inicial Honesto (Sem Supabase conectado ainda)
  const indicators: OperationalIndicators = {
    activeProjects: 0,
    pendingTasks: 0,
    weekDeliveries: 0,
    pendingApprovals: 0,
  }

  // Estado vazio: Nenhuma tarefa atribuída ainda
  const priorityTasks: UserPriorityTask[] = []

  // Estado vazio: Nenhum projeto cadastrado no banco local
  const recentProjects: RecentProject[] = []

  // Reuniões: Estado vazio ou agenda sincronizada do dia
  const upcomingMeetings: UpcomingMeeting[] = []

  // Atividades do histórico operacional (log honesto de inicialização do sistema)
  const activities: OperationalActivity[] = [
    {
      id: 'act-1',
      title: 'Sistema Dois.Zero inicializado em modo local',
      description: 'Design system e tokens de agência criativa carregados com sucesso.',
      timestamp: 'Hoje, 06:00',
      type: 'system',
    },
    {
      id: 'act-2',
      title: 'Configurações de Workspace aplicadas',
      description: 'Workspace Matriz Criativa pronto para novos clientes e squads.',
      timestamp: 'Hoje, 06:01',
      type: 'system',
    },
  ]

  const refresh = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsLoading(false)
  }

  return {
    indicators,
    priorityTasks,
    recentProjects,
    upcomingMeetings,
    activities,
    isLoading,
    error,
    isInitialEnvironment: true,
    refresh,
  }
}
