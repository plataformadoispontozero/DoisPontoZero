import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/AuthProvider'
import type { OperationalIndicators, UserPriorityTask, RecentProject, UpcomingMeeting, OperationalActivity } from '@/features/dashboard/types'

const empty = { indicators: { activeProjects: 0, pendingTasks: 0, weekDeliveries: 0, pendingApprovals: 0 } as OperationalIndicators,
  priorityTasks: [] as UserPriorityTask[], recentProjects: [] as RecentProject[], upcomingMeetings: [] as UpcomingMeeting[], activities: [] as OperationalActivity[] }

export function useDashboardData() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''
  const query = useQuery({
    queryKey: ['dashboard', agencyId, auth.user?.id], enabled: !!agencyId,
    queryFn: async () => {
      if (!supabase || !isSupabaseConfigured) return empty
      const now = new Date(); const end = new Date(now); end.setDate(end.getDate() + 7)
      const [active, pending, deliveries, approvals, projects, tasks, meetings, history] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'active'),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).in('status', ['open','in_progress','review']),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).in('status', ['open','in_progress','review']).gte('due_date', now.toISOString().slice(0,10)).lte('due_date', end.toISOString().slice(0,10)),
        supabase.from('monthly_editorial_campaigns').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'pending'),
        supabase.from('projects').select('id,name,status,due_date,clients(name)').eq('agency_id', agencyId).order('updated_at', { ascending: false }).limit(5),
        supabase.from('tasks').select('id,title,priority,status,due_date,projects(name,clients(name)),task_assignees!inner(user_id)').eq('agency_id', agencyId).eq('task_assignees.user_id', auth.user?.id || '').in('status',['open','in_progress','review']).order('due_date', { ascending: true }).limit(5),
        supabase.from('meetings').select('id,title,starts_at,location_type,meeting_url').eq('agency_id', agencyId).eq('status','scheduled').gte('starts_at', now.toISOString()).order('starts_at', { ascending: true }).limit(3),
        supabase.from('audit_logs').select('id,action,entity_type,created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(5),
      ])
      for (const response of [active,pending,deliveries,approvals,projects,tasks,meetings,history]) if (response.error) throw new Error(response.error.message)
      return {
        indicators: { activeProjects: active.count ?? 0, pendingTasks: pending.count ?? 0, weekDeliveries: deliveries.count ?? 0, pendingApprovals: approvals.count ?? 0 },
        priorityTasks: (tasks.data ?? []).map((task: any): UserPriorityTask => ({ id: task.id, title: task.title, projectName: task.projects?.name || '', clientName: task.projects?.clients?.name || '', deadline: task.due_date || '', priority: task.priority === 'normal' ? 'medium' : task.priority, status: task.status === 'open' ? 'todo' : task.status })),
        recentProjects: (projects.data ?? []).map((project: any): RecentProject => ({ id: project.id, name: project.name, client: project.clients?.name || '', status: ({ active:'in_progress', on_hold:'paused', archived:'completed' } as Record<string,string>)[project.status] as RecentProject['status'] || project.status, owner: { name: '' }, deadline: project.due_date || '', progress: 0 })),
        upcomingMeetings: (meetings.data ?? []).map((meeting: any): UpcomingMeeting => ({ id: meeting.id, title: meeting.title, date: new Date(meeting.starts_at).toLocaleDateString('pt-BR'), time: new Date(meeting.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), attendees: [], platform: meeting.location_type === 'in_person' ? 'Presencial' : 'Google Meet' })),
        activities: (history.data ?? []).map((item: any): OperationalActivity => ({ id: item.id, title: item.action, description: item.entity_type, timestamp: new Date(item.created_at).toLocaleString('pt-BR'), type: 'system' })),
      }
    },
  })
  return { ...(query.data ?? empty), isLoading: query.isLoading, error: query.error, isInitialEnvironment: !isSupabaseConfigured, refresh: async () => { await query.refetch() } }
}
