// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: MEETING HUB TYPES
// ============================================================

export type MeetingType = 'internal' | 'client' | 'project' | 'planning' | 'review' | 'other'

export type MeetingStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export type LocationType = 'online' | 'in_person' | 'hybrid'

export type ParticipantType = 'internal' | 'external'

export type ResponseStatus = 'pending' | 'accepted' | 'declined' | 'tentative'

export interface MeetingParticipant {
  id: string
  agency_id: string
  meeting_id: string
  user_id?: string | null
  user_name?: string
  user_avatar?: string
  external_name?: string | null
  external_email?: string | null
  participant_type: ParticipantType
  response_status: ResponseStatus
  created_at: string
}

export interface MeetingAgendaItem {
  id: string
  agency_id: string
  meeting_id: string
  title: string
  description?: string | null
  position: number
  estimated_minutes: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface MeetingMinutes {
  id: string
  agency_id: string
  meeting_id: string
  content: string
  status: 'draft' | 'finalized'
  version: number
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
  finalized_at?: string | null
}

export interface MeetingDecision {
  id: string
  agency_id: string
  meeting_id: string
  title: string
  description?: string | null
  decision_status: 'active' | 'superseded' | 'cancelled'
  created_by?: string | null
  created_at: string
}

export interface MeetingActionItem {
  id: string
  agency_id: string
  meeting_id: string
  decision_id?: string | null
  title: string
  description?: string | null
  assigned_to?: string | null
  assignee_name?: string
  due_at?: string | null
  status: 'pending' | 'converted' | 'completed' | 'cancelled'
  task_id?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface MeetingActivity {
  id: string
  agency_id: string
  meeting_id: string
  actor_user_id?: string | null
  action: string
  metadata?: Record<string, any>
  created_at: string
}

export interface Meeting {
  id: string
  agency_id: string
  client_id?: string | null
  client_name?: string
  project_id?: string | null
  project_name?: string
  title: string
  description?: string | null
  meeting_type: MeetingType
  status: MeetingStatus
  starts_at: string
  ends_at: string
  timezone: string
  location_type: LocationType
  location_text?: string | null
  meeting_url?: string | null
  organizer_id?: string | null
  organizer_name?: string
  created_by?: string | null
  created_at: string
  updated_at: string
  cancelled_at?: string | null
  participants?: MeetingParticipant[]
  agenda?: MeetingAgendaItem[]
  minutes?: MeetingMinutes | null
  decisions?: MeetingDecision[]
  actions?: MeetingActionItem[]
}

export interface CalendarConnection {
  id: string
  agency_id: string
  user_id: string
  google_account_id: string
  calendar_id: string
  status: 'connected' | 'expired' | 'revoked' | 'error'
  scopes: string[]
  created_at: string
  updated_at: string
}

export interface MeetingCalendarEvent {
  id: string
  agency_id: string
  meeting_id: string
  connection_id?: string | null
  external_event_id: string
  external_calendar_id: string
  sync_status: 'pending' | 'synced' | 'error' | 'disconnected'
  last_synced_at: string
  created_at: string
}
