import { useAuth } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: NOTIFICATION HOOKS
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { AppNotification } from '@/types/notifications'

const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    agency_id: 'demo-agency',
    recipient_id: 'user-001',
    type: 'meeting_invitation',
    title: 'Convite para Reunião de Alinhamento',
    body: 'Mariana Costa convidou você para "Alinhamento Mensal de Entregas & Pautas" amanhã às 14:00.',
    resource_type: 'meeting',
    resource_id: 'meet-001',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    read_at: null,
  },
  {
    id: 'notif-002',
    agency_id: 'demo-agency',
    recipient_id: 'user-001',
    type: 'chat_mention',
    title: 'Menção no canal #geral',
    body: 'Fernanda Lima mencionou você: "Excelente trabalho @Lucas! Vou agendar a call..."',
    resource_type: 'chat_channel',
    resource_id: 'chan-001',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read_at: null,
  },
  {
    id: 'notif-003',
    agency_id: 'demo-agency',
    recipient_id: 'user-001',
    type: 'meeting_action_assigned',
    title: 'Nova tarefa atribuída na reunião',
    body: 'Ação "Enviar guias de gravação para o cliente" foi atribuída a você.',
    resource_type: 'meeting',
    resource_id: 'meet-001',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    read_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

let demoNotificationsStore = [...DEMO_NOTIFICATIONS]

export function useNotifications() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['notifications'],
    initialData: isSupabaseConfigured ? undefined : demoNotificationsStore,
    queryFn: async (): Promise<AppNotification[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data , error: backendError1 } = await supabase.from('notifications').select('*').eq('agency_id', agencyId).eq('recipient_id', auth.user?.id || '').order('created_at', { ascending: false })
          if (backendError1) throw backendError1
          return data ?? [] as AppNotification[]
        } catch (err) {
          throw err
        }
      }
      return demoNotificationsStore
    },
  })
}

export function useMarkNotificationAsRead() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id',id).eq('agency_id',agencyId).eq('recipient_id',auth.user?.id || '').select('id').single()
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        return
      }
      const idx = demoNotificationsStore.findIndex((n) => n.id === id)
      if (idx !== -1) {
        demoNotificationsStore[idx].read_at = new Date().toISOString()
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('agency_id',agencyId).eq('recipient_id',auth.user?.id || '').is('read_at',null)
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        return
      }
      demoNotificationsStore = demoNotificationsStore.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      }))
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
