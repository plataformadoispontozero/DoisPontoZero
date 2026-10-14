// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: NOTIFICATION TYPES
// ============================================================

export type NotificationType =
  | 'calendar_approved'
  | 'calendar_changes_requested'
  | 'calendar_production'
  | 'client_created'
  | 'task_production_started'
  | 'material_approved'
  | 'material_changes_requested'
  | 'member_birthday'
  | 'team_registration_pending'
  | 'meeting_invitation'
  | 'meeting_updated'
  | 'meeting_cancelled'
  | 'meeting_action_assigned'
  | 'chat_mention'
  | 'chat_direct_message'
  | 'chat_channel_message'

export interface AppNotification {
  id: string
  agency_id: string
  recipient_id: string
  type: NotificationType
  title: string
  body: string
  resource_type?: string | null
  resource_id?: string | null
  created_at: string
  read_at?: string | null
}
