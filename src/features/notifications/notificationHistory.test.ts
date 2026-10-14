import { describe, expect, it } from 'vitest'
import { filterNotificationHistory, notificationDestination } from './notificationHistory'
import type { AppNotification } from '@/types/notifications'
const notifications: AppNotification[] = [
  { id: '1', agency_id: 'agency', recipient_id: 'me', type: 'meeting_invitation', title: 'Reunião', body: '', created_at: '2026-10-12', read_at: null, resource_type: 'meeting', resource_id: 'meeting-1' },
  { id: '2', agency_id: 'agency', recipient_id: 'me', type: 'chat_mention', title: 'Menção', body: '', created_at: '2026-10-11', read_at: '2026-10-12' },
]
describe('notification history', () => {
  it('combines read status and type without mutating the source', () => {
    expect(filterNotificationHistory(notifications, 'unread', 'all').map(n => n.id)).toEqual(['1'])
    expect(filterNotificationHistory(notifications, 'read', 'chat_mention').map(n => n.id)).toEqual(['2'])
    expect(filterNotificationHistory(notifications, 'unread', 'chat_mention')).toEqual([])
    expect(notifications).toHaveLength(2)
  })
  it('opens registration approval management without requiring a user link', () => {
    expect(notificationDestination({ ...notifications[0], resource_type: 'team_registration_request', resource_id: null })).toBe('/settings/team')
    expect(notificationDestination(notifications[0])).toBe('/meetings/meeting-1')
    expect(notificationDestination(notifications[1])).toBeNull()
    expect(notificationDestination({...notifications[0],resource_type:'editorial_campaign',resource_id:'campaign-id'})).toBe('/editorial?campaignId=campaign-id')
    expect(notificationDestination({...notifications[0],resource_type:'task',resource_id:'task-id'})).toBe('/tasks/task-id')
    expect(notificationDestination({...notifications[0],resource_type:'client',resource_id:'client-id'})).toBe('/clients/client-id')
  })
})
