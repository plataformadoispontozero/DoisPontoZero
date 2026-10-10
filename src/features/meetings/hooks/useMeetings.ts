// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: MEETING HUB HOOKS
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  Meeting,
  MeetingAgendaItem,
  MeetingMinutes,
  MeetingDecision,
  MeetingActionItem,
  MeetingParticipant,
  MeetingType,
  MeetingStatus,
  LocationType,
} from '@/types/meetings'

const DEMO_MEETINGS: Meeting[] = [
  {
    id: 'meet-001',
    agency_id: 'demo-agency',
    client_id: 'cli-001',
    client_name: 'Acme Corp',
    project_id: 'proj-001',
    project_name: 'Rebranding & Redes Sociais 2026',
    title: 'Alinhamento Mensal de Entregas & Pautas',
    description: 'Reunião de alinhamento com a diretoria de marketing sobre o calendário de conteúdo de novembro.',
    meeting_type: 'client',
    status: 'scheduled',
    starts_at: new Date(Date.now() + 86400000).toISOString(),
    ends_at: new Date(Date.now() + 90000000).toISOString(),
    timezone: 'America/Sao_Paulo',
    location_type: 'online',
    location_text: 'Google Meet',
    meeting_url: 'https://meet.google.com/abc-defg-hij',
    organizer_id: 'user-001',
    organizer_name: 'Lucas Mendes',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    participants: [
      {
        id: 'part-001',
        agency_id: 'demo-agency',
        meeting_id: 'meet-001',
        user_id: 'user-001',
        user_name: 'Lucas Mendes',
        participant_type: 'internal',
        response_status: 'accepted',
        created_at: new Date().toISOString(),
      },
      {
        id: 'part-002',
        agency_id: 'demo-agency',
        meeting_id: 'meet-001',
        external_name: 'Mariana Costa (Acme Corp)',
        external_email: 'mariana@acme.com',
        participant_type: 'external',
        response_status: 'accepted',
        created_at: new Date().toISOString(),
      },
    ],
    agenda: [
      {
        id: 'agenda-001',
        agency_id: 'demo-agency',
        meeting_id: 'meet-001',
        title: 'Review de métricas do mês anterior',
        description: 'Análise de engajamento e conversão de reels.',
        position: 0,
        estimated_minutes: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'agenda-002',
        agency_id: 'demo-agency',
        meeting_id: 'meet-001',
        title: 'Aprovação das pautas de Novembro',
        description: 'Validação dos pilares de conteúdo e datas estratégicas.',
        position: 1,
        estimated_minutes: 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    minutes: {
      id: 'min-001',
      agency_id: 'demo-agency',
      meeting_id: 'meet-001',
      content: 'Aprovadas as 12 peças de feed e 8 reels para a campanha de Black Friday. Foco em estética dark mode premium.',
      status: 'draft',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    decisions: [
      {
        id: 'dec-001',
        agency_id: 'demo-agency',
        meeting_id: 'meet-001',
        title: 'Formato dos Reels',
        description: 'Priorizar vídeos em 9:16 com legendas dinâmicas.',
        decision_status: 'active',
        created_at: new Date().toISOString(),
      },
    ],
    actions: [
      {
        id: 'act-001',
        agency_id: 'demo-agency',
        meeting_id: 'meet-001',
        decision_id: 'dec-001',
        title: 'Enviar guias de gravação para o cliente',
        description: 'Gravar orientações de iluminação e áudio.',
        assigned_to: 'user-001',
        assignee_name: 'Lucas Mendes',
        due_at: new Date(Date.now() + 172800000).toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'meet-002',
    agency_id: 'demo-agency',
    client_id: 'cli-002',
    client_name: 'Starlight Tech',
    project_id: 'proj-002',
    project_name: 'Manual de Marca & UI Kit',
    title: 'Apresentação de Identidade Visual V1',
    description: 'Defesa criativa do universo de marca e paleta de cores.',
    meeting_type: 'review',
    status: 'completed',
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() - 82800000).toISOString(),
    timezone: 'America/Sao_Paulo',
    location_type: 'online',
    location_text: 'Google Meet',
    meeting_url: 'https://meet.google.com/xyz-starlight',
    organizer_id: 'user-002',
    organizer_name: 'Fernanda Lima',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    participants: [],
    agenda: [],
    minutes: {
      id: 'min-002',
      agency_id: 'demo-agency',
      meeting_id: 'meet-002',
      content: 'Apresentação aprovada com unanimidade. Ajuste pontual na tonalidade do roxo secundário.',
      status: 'finalized',
      version: 1,
      finalized_at: new Date(Date.now() - 82000000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 82000000).toISOString(),
    },
    decisions: [
      {
        id: 'dec-002',
        agency_id: 'demo-agency',
        meeting_id: 'meet-002',
        title: 'Aprovação da Paleta Principal',
        description: 'Cores primárias aprovadas sem ressalvas.',
        decision_status: 'active',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    actions: [],
  },
]

let demoMeetingsStore = [...DEMO_MEETINGS]

export function useMeetings(filters?: { search?: string; status?: string; type?: string }) {
  return useQuery({
    queryKey: ['meetings', filters],
    queryFn: async (): Promise<Meeting[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          let query = supabase.from('meetings').select('*').order('starts_at', { ascending: true })
          if (filters?.status) query = query.eq('status', filters.status)
          if (filters?.type) query = query.eq('meeting_type', filters.type)
          if (filters?.search) query = query.ilike('title', `%${filters.search}%`)
          const { data } = await query
          if (data && data.length > 0) return data as Meeting[]
        } catch (err) {
          console.warn('Supabase fetch meetings error:', err)
        }
      }

      return demoMeetingsStore.filter((m) => {
        const matchSearch = !filters?.search || m.title.toLowerCase().includes(filters.search.toLowerCase())
        const matchStatus = !filters?.status || m.status === filters.status
        const matchType = !filters?.type || m.meeting_type === filters.type
        return matchSearch && matchStatus && matchType
      })
    },
  })
}

export function useSingleMeeting(meetingId?: string) {
  const queryClient = useQueryClient()

  const meetingQuery = useQuery({
    queryKey: ['meeting', meetingId],
    enabled: Boolean(meetingId),
    queryFn: async (): Promise<Meeting | null> => {
      if (!meetingId) return null

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.from('meetings').select('*').eq('id', meetingId).single()
          if (data) return data as Meeting
        } catch (err) {
          console.warn('Supabase fetch single meeting error:', err)
        }
      }

      return demoMeetingsStore.find((m) => m.id === meetingId) || null
    },
  })

  const meeting = meetingQuery.data || null

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Meeting>) => {
      if (!meetingId) return
      const idx = demoMeetingsStore.findIndex((m) => m.id === meetingId)
      if (idx !== -1) {
        demoMeetingsStore[idx] = {
          ...demoMeetingsStore[idx],
          ...updates,
          updated_at: new Date().toISOString(),
        }
      }
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
    },
  })

  const addAgendaItem = async (item: Partial<MeetingAgendaItem>) => {
    if (!meeting) return
    const newAgenda = [
      ...(meeting.agenda || []),
      {
        id: `agenda-${Date.now()}`,
        agency_id: meeting.agency_id,
        meeting_id: meeting.id,
        title: item.title || 'Novo Tópico',
        description: item.description || '',
        position: (meeting.agenda || []).length,
        estimated_minutes: item.estimated_minutes || 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    await updateMutation.mutateAsync({ agenda: newAgenda })
  }

  const updateAgendaItem = async (id: string, updates: Partial<MeetingAgendaItem>) => {
    if (!meeting) return
    const updatedAgenda = (meeting.agenda || []).map((a) => (a.id === id ? { ...a, ...updates } : a))
    await updateMutation.mutateAsync({ agenda: updatedAgenda })
  }

  const deleteAgendaItem = async (id: string) => {
    if (!meeting) return
    const updatedAgenda = (meeting.agenda || []).filter((a) => a.id !== id)
    await updateMutation.mutateAsync({ agenda: updatedAgenda })
  }

  const updateMinutes = async (content: string, finalize = false) => {
    if (!meeting) return
    const currentMin = meeting.minutes
    const updatedMinutes: MeetingMinutes = {
      id: currentMin?.id || `min-${Date.now()}`,
      agency_id: meeting.agency_id,
      meeting_id: meeting.id,
      content,
      status: finalize ? 'finalized' : 'draft',
      version: (currentMin?.version || 0) + 1,
      created_at: currentMin?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      finalized_at: finalize ? new Date().toISOString() : currentMin?.finalized_at,
    }
    await updateMutation.mutateAsync({ minutes: updatedMinutes })
  }

  const addDecision = async (decision: Partial<MeetingDecision>) => {
    if (!meeting) return
    const newDecisions = [
      ...(meeting.decisions || []),
      {
        id: `dec-${Date.now()}`,
        agency_id: meeting.agency_id,
        meeting_id: meeting.id,
        title: decision.title || 'Nova Decisão',
        description: decision.description || '',
        decision_status: 'active' as const,
        created_at: new Date().toISOString(),
      },
    ]
    await updateMutation.mutateAsync({ decisions: newDecisions })
  }

  const addActionItem = async (action: Partial<MeetingActionItem>) => {
    if (!meeting) return
    const newActions = [
      ...(meeting.actions || []),
      {
        id: `act-${Date.now()}`,
        agency_id: meeting.agency_id,
        meeting_id: meeting.id,
        decision_id: action.decision_id || null,
        title: action.title || 'Nova Ação',
        description: action.description || '',
        assigned_to: action.assigned_to || null,
        assignee_name: action.assignee_name || 'Lucas Mendes',
        due_at: action.due_at || new Date(Date.now() + 86400000).toISOString(),
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    await updateMutation.mutateAsync({ actions: newActions })
  }

  const convertActionToTask = async (actionId: string, projectId: string) => {
    if (!meeting) return
    const taskId = `task-conv-${Date.now()}`
    const updatedActions = (meeting.actions || []).map((a) =>
      a.id === actionId ? { ...a, status: 'converted' as const, task_id: taskId } : a
    )
    await updateMutation.mutateAsync({ actions: updatedActions })
    return taskId
  }

  return {
    meeting,
    isLoading: meetingQuery.isLoading,
    isError: meetingQuery.isError,
    updateMeeting: updateMutation.mutateAsync,
    addAgendaItem,
    updateAgendaItem,
    deleteAgendaItem,
    updateMinutes,
    addDecision,
    addActionItem,
    convertActionToTask,
  }
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      title: string
      description?: string
      meeting_type: MeetingType
      client_id?: string
      client_name?: string
      project_id?: string
      project_name?: string
      starts_at: string
      ends_at: string
      timezone?: string
      location_type: LocationType
      location_text?: string
      meeting_url?: string
      participants?: Partial<MeetingParticipant>[]
    }): Promise<Meeting> => {
      const newId = `meet-${Date.now()}`
      const newMeeting: Meeting = {
        id: newId,
        agency_id: 'demo-agency',
        client_id: payload.client_id || null,
        client_name: payload.client_name,
        project_id: payload.project_id || null,
        project_name: payload.project_name,
        title: payload.title,
        description: payload.description || '',
        meeting_type: payload.meeting_type,
        status: 'scheduled',
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        timezone: payload.timezone || 'America/Sao_Paulo',
        location_type: payload.location_type,
        location_text: payload.location_text || '',
        meeting_url: payload.meeting_url || '',
        organizer_id: 'user-001',
        organizer_name: 'Lucas Mendes',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants: (payload.participants || []).map((p, i) => ({
          id: `part-${newId}-${i}`,
          agency_id: 'demo-agency',
          meeting_id: newId,
          user_id: p.user_id || null,
          user_name: p.user_name || 'Membro Agência',
          external_name: p.external_name || null,
          external_email: p.external_email || null,
          participant_type: p.participant_type || 'internal',
          response_status: 'pending',
          created_at: new Date().toISOString(),
        })),
        agenda: [],
        minutes: null,
        decisions: [],
        actions: [],
      }

      demoMeetingsStore = [newMeeting, ...demoMeetingsStore]
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      return newMeeting
    },
  })
}
