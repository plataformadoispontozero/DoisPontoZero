import { useQuery } from '@tanstack/react-query'
import { useAuth, usePermission } from '@/features/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'

export interface AgendaEntry { id: string; title: string; date: string; kind: 'meeting' | 'task'; href: string }
export function useAgenda(start: Date, end: Date) {
  const auth = useAuth()
  const canViewTasks = usePermission('tasks.view')
  const agencyId = auth.activeAgency?.agencyId ?? ''
  const from = start.toISOString(); const to = end.toISOString()
  return useQuery({
    queryKey: ['agency-agenda', agencyId, auth.user?.id, from, to, canViewTasks],
    enabled: !!agencyId,
    queryFn: async (): Promise<AgendaEntry[]> => {
      if (!supabase || !auth.user) return []
      const meetings = await supabase.from('meetings').select('id,title,starts_at,organizer_id,meeting_participants(user_id)')
        .eq('agency_id', agencyId).neq('status', 'cancelled').gte('starts_at', from).lt('starts_at', to).order('starts_at')
      if (meetings.error) throw meetings.error
      const entries: AgendaEntry[] = (meetings.data ?? []).filter((m: any) => m.organizer_id === auth.user!.id || m.meeting_participants?.some((p: any) => p.user_id === auth.user!.id))
        .map((m: any) => ({id: m.id, title: m.title, date: m.starts_at, kind: 'meeting', href: `/meetings/${m.id}`}))
      if (canViewTasks) {
        const localDate = (value: Date) => `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`
        const tasks = await supabase.from('tasks').select('id,title,due_date,task_assignees!inner(user_id)')
          .eq('agency_id',agencyId).eq('task_assignees.user_id',auth.user.id).in('status',['open','in_progress','review'])
          .gte('due_date',localDate(start)).lt('due_date',localDate(end)).order('due_date')
        if (tasks.error) throw tasks.error
        for (const task of tasks.data ?? []) entries.push({id:task.id,title:task.title,date:`${task.due_date}T12:00:00`,kind:'task',href:`/tasks/${task.id}`})
      }
      return entries.sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
    },
  })
}
