import React from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/Button'

export const MeetingsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Reuniões & Alinhamentos"
        subtitle="Gestão de dailies, reuniões de apresentação para clientes, pautas e atas de decisão."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Reuniões' },
        ]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Agendar Reunião</span>
          </Button>
        }
      />

      <EmptyState
        icon={CalendarDays}
        title="Nenhuma reunião agendada no momento"
        subtitle="Sincronização de Calendário & Atas Inteligentes"
        description="Conecte Google Calendar ou Outlook para sincronizar agendamentos, registrar decisões de alinhamento com clientes e transformar anotações em tarefas."
        statusBadge="Fase 01: Design System & Rotas"
        features={[
          'Integração nativa com Google Calendar e Microsoft 365',
          'Gravação de atas inteligentes e decisões aprovadas em call',
          'Conversão automática de pontos de ação em tarefas de projeto',
          'Lembretes automáticos via e-mail e WhatsApp para clientes',
        ]}
        actionLabel="Agendar Reunião de Alinhamento"
        onAction={() => alert('Integração de reuniões estará disponível em fase posterior.')}
      />
    </div>
  )
}
