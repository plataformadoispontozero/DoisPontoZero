import type { AppNotification } from '@/types/notifications'
export type ReadFilter = 'all' | 'unread' | 'read'
export function filterNotificationHistory(notifications: AppNotification[], read: ReadFilter, type: string) {
  return notifications.filter(n => (read === 'all' || (read === 'unread' ? !n.read_at : !!n.read_at)) && (type === 'all' || n.type === type))
}
export function notificationDestination(notification: AppNotification): string | null {
  if (notification.resource_type === 'team_registration_request') return '/settings/team'
  if (!notification.resource_id) return null
  if (notification.resource_type === 'meeting') return `/meetings/${notification.resource_id}`
  if (notification.resource_type === 'chat_channel') return `/chat/channels/${notification.resource_id}`
  return null
}

export function notificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    meeting_invitation: 'Convites de reunião', meeting_updated: 'Reuniões atualizadas',
    meeting_cancelled: 'Reuniões canceladas', meeting_action_assigned: 'Ações de reunião',
    chat_mention: 'Menções no chat', chat_direct_message: 'Mensagens diretas',
    chat_channel_message: 'Mensagens de canal', team_registration_pending: 'Cadastros aguardando aprovação', team_registration_requested: 'Solicitações de cadastro',
    team_registration_request: 'Solicitações de cadastro', team_registration_approved: 'Cadastros aprovados',
    team_registration_rejected: 'Cadastros recusados',
  }
  return labels[type] || type.replaceAll('_', ' ')
}
