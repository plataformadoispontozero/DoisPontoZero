// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: NOTIFICATIONS PAGE & CENTRAL
// ============================================================

import React from 'react'
import { NotificationSoundControls } from './NotificationSoundControls'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Calendar, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from './hooks/useNotifications'

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: notifications, isLoading } = useNotifications()
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()

  const safeNotifications = notifications || []
  const unreadCount = safeNotifications.filter((n) => !n.read_at).length

  const handleNotificationClick = async (notif: (typeof safeNotifications)[0]) => {
    if (!notif.read_at) {
      await markAsRead.mutateAsync(notif.id)
    }

    if (notif.resource_type === 'meeting' && notif.resource_id) {
      navigate(`/meetings/${notif.resource_id}`)
    } else if (notif.resource_type === 'chat_channel' && notif.resource_id) {
      navigate(`/chat/channels/${notif.resource_id}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary flex items-center">
            <Bell className="w-6 h-6 mr-2.5 text-brand-primary" />
            Central de Notificações
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Convites de reunião, menções no chat e atribuições de tarefas.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutateAsync()}>
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <NotificationSoundControls />

      {isLoading ? (
        <div className="p-12 text-center text-xs text-content-tertiary">
          <div className="animate-spin w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-2" />
          Carregando notificações...
        </div>
      ) : safeNotifications.length === 0 ? (
        <Card className="p-12 text-center text-xs text-content-secondary border border-dashed">
          Você não possui nenhuma notificação no momento.
        </Card>
      ) : (
        <div className="space-y-3">
          {safeNotifications.map((notif) => {
            const isUnread = !notif.read_at
            return (
              <Card
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 cursor-pointer border transition-all flex items-start justify-between ${
                  isUnread
                    ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
                    : 'border-surface-border bg-surface-card hover:border-brand-primary/40'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-surface-subtle border border-surface-border text-brand-primary mt-0.5">
                    {notif.type.startsWith('meeting') ? <Calendar className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-content-primary text-sm">{notif.title}</span>
                      {isUnread && <Badge variant="accent">Nova</Badge>}
                    </div>
                    <p className="text-xs text-content-secondary">{notif.body}</p>
                    <span className="text-[10px] text-content-tertiary block">
                      {new Date(notif.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-content-tertiary self-center" />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
