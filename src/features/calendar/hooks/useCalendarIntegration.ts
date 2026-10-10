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
  return useQuery({
    queryKey: ['calendar_connection'],
    queryFn: async (): Promise<CalendarConnection | null> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.from('calendar_connections').select('*').eq('user_id', 'user-001').single()
          if (data) return data as CalendarConnection
        } catch (err) {
          console.warn('Supabase fetch calendar connection error:', err)
        }
      }
      return demoCalendarStore
    },
  })
}

export function useToggleCalendarConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connect: boolean) => {
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
