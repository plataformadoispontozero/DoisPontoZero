// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: NOTIFICATIONS PAGE & CENTRAL
// ============================================================

import React, { useState } from 'react'
import { filterNotificationHistory, notificationDestination, notificationTypeLabel, type ReadFilter } from './notificationHistory'
import { NotificationSoundControls } from './NotificationSoundControls'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Calendar, MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from './hooks/useNotifications'

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: notifications, isLoading, isError, refetch } = useNotifications()
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [actionError, setActionError] = useState('')
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()

  const safeNotifications = notifications || []
  const unreadCount = safeNotifications.filter((n) => !n.read_at).length

  const filteredNotifications = filterNotificationHistory(safeNotifications, readFilter, typeFilter)
  const types = [...new Set(safeNotifications.map(n => n.type))]
  const handleNotificationClick = async (notif: (typeof safeNotifications)[0]) => {
    try {
      setActionError('')
      if (!notif.read_at) await markAsRead.mutateAsync(notif.id)
      const destination = notificationDestination(notif)
      if (destination) navigate(destination)
    } catch { setActionError('Não foi possível marcar a notificação como lida. Tente novamente.') }
  }
  const markAll = async () => {
    try { setActionError(''); await markAllAsRead.mutateAsync() }
    catch { setActionError('Não foi possível atualizar as notificações. Tente novamente.') }
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
            Histórico dos avisos enviados a você nesta agência e preferências de som.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" disabled={markAllAsRead.isPending} onClick={() => void markAll()}>
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <NotificationSoundControls />
      <section aria-label="Relatório de notificações" className="rounded-xl border border-surface-border p-5 space-y-4">
        <h2 className="font-semibold">Histórico e relatório</h2>
        <p className="text-sm text-content-secondary">As preferências de som são salvas para seu usuário neste navegador. Este relatório mostra somente seus avisos, sem incluir notificações de outros membros.</p>
        {!isError && !isLoading && <p className="text-sm">{safeNotifications.length} recebidas · {unreadCount} não lidas · {safeNotifications.length - unreadCount} lidas</p>}
        <div className="flex flex-wrap gap-4">
          <label className="text-sm">Leitura<select aria-label="Filtrar por leitura" className="block mt-1 rounded-lg border border-surface-border bg-surface-card p-2" value={readFilter} onChange={e => setReadFilter(e.target.value as ReadFilter)}><option value="all">Todas</option><option value="unread">Não lidas</option><option value="read">Lidas</option></select></label>
          <label className="text-sm">Tipo<select aria-label="Filtrar por tipo" className="block mt-1 rounded-lg border border-surface-border bg-surface-card p-2" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="all">Todos os tipos</option>{types.map(type => <option value={type} key={type}>{notificationTypeLabel(type)}</option>)}</select></label>
        </div>
      </section>
      {actionError && <p role="alert" className="text-red-400">{actionError}</p>}
      {isError && <Card className="p-5"><p role="alert">Não foi possível carregar o histórico. Verifique a conexão e tente novamente.</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></Card>}

      {isError ? null : isLoading ? (
        <div className="p-12 text-center text-xs text-content-tertiary">
          <div className="animate-spin w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-2" />
          Carregando notificações...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center text-xs text-content-secondary border border-dashed">
          Nenhuma notificação encontrada para os filtros selecionados.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.read_at
            return (
              <Card
                key={notif.id}
                role="button"
                tabIndex={0}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void handleNotificationClick(notif) } }}
                onClick={() => void handleNotificationClick(notif)}
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
