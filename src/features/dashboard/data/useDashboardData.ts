import { useState, useEffect } from 'react'
import type {
  OperationalIndicators,
  UserPriorityTask,
  RecentProject,
  UpcomingMeeting,
  OperationalActivity,
} from '@/features/dashboard/types'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'

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
  const [error, setError] = useState<Error | null>(null)
  const [indicators, setIndicators] = useState<OperationalIndicators>({
    activeProjects: 0,
    pendingTasks: 0,
    weekDeliveries: 0,
    pendingApprovals: 0,
  })
  const [priorityTasks, setPriorityTasks] = useState<UserPriorityTask[]>([])
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([])
  const [activities, setActivities] = useState<OperationalActivity[]>([])

  const loadData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      // Estado inicial honesto: nenhuma atividade artificial gerada
      setIndicators({
        activeProjects: 0,
        pendingTasks: 0,
        weekDeliveries: 0,
        pendingApprovals: 0,
      })
      setPriorityTasks([])
      setRecentProjects([])
      setUpcomingMeetings([])
      setActivities([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const [projectsRes, tasksRes, meetingsRes, historyRes] = await Promise.all([
        supabase.from('projects').select('id, name, status, updated_at', { count: 'exact' }).limit(5),
        supabase.from('tasks').select('id, title, priority, status, due_date', { count: 'exact' }).eq('status', 'in_progress').limit(5),
        supabase.from('meetings').select('id, title, starts_at, status').limit(3),
        supabase.from('agency_settings_history').select('id, setting_type, changed_at, snapshot').order('changed_at', { ascending: false }).limit(5),
      ])

      const activeProjectsCount = projectsRes.count || (projectsRes.data ? projectsRes.data.length : 0)
      const pendingTasksCount = tasksRes.count || (tasksRes.data ? tasksRes.data.length : 0)

      setIndicators({
        activeProjects: activeProjectsCount,
        pendingTasks: pendingTasksCount,
        weekDeliveries: 0,
        pendingApprovals: 0,
      })

      // Atividades reais mapeadas a partir de eventos auditados
      const realActivities: OperationalActivity[] = []
      if (historyRes.data && historyRes.data.length > 0) {
        historyRes.data.forEach((item: any) => {
          realActivities.push({
            id: item.id,
            title: `Configuração atualizada: ${item.setting_type}`,
            description: 'Parâmetros operacionais do workspace sincronizados.',
            timestamp: new Date(item.changed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            type: 'system',
          })
        })
      }

      setActivities(realActivities)
    } catch (err: any) {
      setError(err)
      setActivities([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    indicators,
    priorityTasks,
    recentProjects,
    upcomingMeetings,
    activities,
    isLoading,
    error,
    isInitialEnvironment: !isSupabaseConfigured,
    refresh: loadData,
  }
}
