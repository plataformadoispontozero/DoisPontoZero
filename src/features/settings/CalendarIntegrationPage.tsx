// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: GOOGLE CALENDAR INTEGRATION PAGE
// ============================================================

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCalendarConnection, useToggleCalendarConnection } from '../calendar/hooks/useCalendarIntegration'

export const CalendarIntegrationPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: connection, isLoading } = useCalendarConnection()
  const toggleConnection = useToggleCalendarConnection()

  const isConnected = connection?.status === 'connected'

  const handleToggle = async () => {
    await toggleConnection.mutateAsync(!isConnected)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar às Configurações
        </Button>
        <div>
          <h1 className="text-xl font-bold text-content-primary flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-brand-primary" />
            Sincronização com Google Calendar
          </h1>
          <p className="text-xs text-content-secondary">
            Conecte sua conta do Google para sincronizar agendamentos do Meeting Hub automaticamente.
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-content-primary text-base">Google Calendar Sync</h2>
              <Badge variant={isConnected ? 'success' : 'neutral'}>
                {isConnected ? 'Conectado & Ativo' : 'Não Conectado'}
              </Badge>
            </div>
            <p className="text-xs text-content-secondary max-w-lg">
              Crie eventos automaticamente no seu calendário principal do Google ao agendar reuniões com clientes ou membros da agência.
            </p>
          </div>

          <Button
            variant={isConnected ? 'outline' : 'primary'}
            onClick={handleToggle}
            loading={toggleConnection.isPending}
          >
            {isConnected ? 'Desconectar Conta' : 'Conectar Google Calendar'}
          </Button>
        </div>

        {isConnected && (
          <div className="p-4 bg-surface-subtle border border-surface-border rounded-lg space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-content-tertiary">Conta Autorizada:</span>
              <span className="font-semibold text-content-primary">{connection.google_account_id}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-content-tertiary">Calendário Alvo:</span>
              <span className="font-semibold text-content-primary">{connection.calendar_id}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-content-tertiary">Escopos Autorizados:</span>
              <span className="font-mono text-[10px] text-brand-primary">calendar.events (read/write)</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
