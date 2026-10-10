// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: CLIENT HUB MEETINGS TAB
// ============================================================

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Plus, Clock, Users, ArrowRight, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useMeetings } from '../../meetings/hooks/useMeetings'

interface ClientMeetingsTabProps {
  clientId: string
  clientName: string
}

export const ClientMeetingsTab: React.FC<ClientMeetingsTabProps> = ({ clientId, clientName }) => {
  const navigate = useNavigate()
  const { data: meetings, isLoading } = useMeetings()

  const clientMeetings = (meetings || []).filter((m) => m.client_id === clientId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-content-primary flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-brand-primary" />
            Reuniões & Alinhamentos ({clientMeetings.length})
          </h3>
          <p className="text-xs text-content-secondary">
            Histórico de conversas, pautas e atas de decisão vinculadas a {clientName}.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => navigate('/meetings/new')}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Agendar Reunião
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-content-secondary">Carregando reuniões...</div>
      ) : clientMeetings.length === 0 ? (
        <Card className="p-8 text-center space-y-3 border border-dashed border-surface-border">
          <CalendarDays className="w-10 h-10 text-content-tertiary mx-auto" />
          <h4 className="text-sm font-semibold text-content-primary">Nenhuma reunião registrada para este cliente</h4>
          <p className="text-xs text-content-secondary max-w-sm mx-auto">
            Agende reuniões de alinhamento para registrar deliberações e atas de projeto.
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate('/meetings/new')}>
            Agendar Primeira Reunião
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientMeetings.map((m) => (
            <Card
              key={m.id}
              onClick={() => navigate(`/meetings/${m.id}`)}
              className="p-4 space-y-3 hover:border-brand-primary/40 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={m.status === 'completed' ? 'success' : 'accent'}>
                    {m.status === 'completed' ? 'Concluída' : 'Agendada'}
                  </Badge>
                  <h4 className="font-bold text-content-primary text-sm mt-1">{m.title}</h4>
                </div>
                <ArrowRight className="w-4 h-4 text-content-tertiary" />
              </div>

              <div className="flex items-center justify-between text-xs text-content-secondary pt-2 border-t border-surface-border">
                <span>{new Date(m.starts_at).toLocaleDateString('pt-BR')}</span>
                <span>{m.participants?.length || 0} participantes</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
