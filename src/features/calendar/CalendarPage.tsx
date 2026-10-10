import React from 'react'
import { Calendar, Plus, CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/Button'

export const CalendarPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Minha Agenda"
        subtitle="Cronograma pessoal, entregas agendadas, reuniões e alinhamentos de squad."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Minha Agenda' },
        ]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Compromisso</span>
          </Button>
        }
      />

      <EmptyState
        icon={CalendarDays}
        title="Nenhum compromisso agendado para o seu perfil"
        subtitle="Visualização Integrada de Prazos e Reuniões"
        description="Acompanhe seus prazos de entrega criativa, marcos contratuais e reuniões sincronizadas diretamente nesta visão de calendário."
        statusBadge="Fase 01: Design System & Rotas"
        features={[
          'Visualizações por Mês, Semana e Dia com filtros de squad',
          'Sincronização bidirecional com Google Calendar e Outlook',
          'Alertas de proximidade de deadline para entregas críticas',
          'Marcação automática de horários livres para gravação e calls',
        ]}
        actionLabel="Agendar Primeiro Compromisso"
        onAction={() => alert('Agendamento de compromissos estará disponível na integração com banco de dados.')}
      />
    </div>
  )
}
