import { useAuth } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: GOOGLE CALENDAR INTEGRATION HOOKS
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { CalendarConnection } from '@/types/meetings'

const DEMO_CALENDAR_CONNECTION: CalendarConnection = {
  id: 'calconn-001',
  agency_id: 'demo-agency',
  user_id: 'user-001',
  google_account_id: 'google-user-12345',
  calendar_id: 'primary',
  status: 'connected',
  scopes: ['https://www.googleapis.com/auth/calendar.events'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

let demoCalendarStore: CalendarConnection | null = DEMO_CALENDAR_CONNECTION

export function useCalendarConnection() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['calendar_connection'],
    queryFn: async (): Promise<CalendarConnection | null> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data , error: backendError1 } = await supabase.from('calendar_connections').select('*').eq('agency_id', agencyId).eq('user_id', auth.user?.id || '').maybeSingle()
          if (backendError1) throw backendError1
          return data as CalendarConnection
        } catch (err) {
          throw err
        }
      }
      return demoCalendarStore
    },
  })
}

export function useToggleCalendarConnection() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connect: boolean) => {
      if (isSupabaseConfigured) throw new Error('Integração OAuth ainda não configurada no backend. Nenhuma conexão foi criada ou revogada.')
      if (connect) {
        demoCalendarStore = DEMO_CALENDAR_CONNECTION
      } else {
        demoCalendarStore = null
      }
      queryClient.invalidateQueries({ queryKey: ['calendar_connection'] })
      return demoCalendarStore
    },
  })
}
