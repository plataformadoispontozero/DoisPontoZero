// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: MEETING HUB HOME PAGE
// ============================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Plus,
  Search,
  Video,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { usePermission } from '@/features/auth/AuthProvider'
import { useMeetings } from './hooks/useMeetings'

export const MeetingsPage: React.FC = () => {
  const navigate = useNavigate()
  const canCreate = usePermission('meetings.create')
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const { data: meetings, isLoading, isError, refetch } = useMeetings({
    search: search || undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    type: selectedType !== 'all' ? selectedType : undefined,
  })

  const safeMeetings = meetings || []
  const weeklyCount = safeMeetings.length
  const scheduledCount = safeMeetings.filter((m) => m.status === 'scheduled').length
  const pendingMinutesCount = safeMeetings.filter((m) => m.minutes?.status !== 'finalized').length
  const openActionsCount = safeMeetings.reduce((acc, m) => acc + (m.actions?.filter((a) => a.status === 'pending').length || 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-content-primary flex items-center">
            <CalendarDays className="w-6 h-6 mr-2.5 text-brand-primary" />
            Meeting Hub
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Organize conversas, pautas, atas de decisão e próximos passos em um só lugar.
          </p>
        </div>
        <Button variant="primary" disabled={!canCreate} onClick={() => navigate('/meetings/new')}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Reunião
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-brand-primary">
          <span className="text-xs text-content-tertiary font-medium">Reuniões da Semana</span>
          <div className="text-2xl font-bold text-content-primary mt-1">{weeklyCount}</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs text-content-tertiary font-medium">Próximas Agendadas</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{scheduledCount}</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <span className="text-xs text-content-tertiary font-medium">Atas Pendentes</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingMinutesCount}</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <span className="text-xs text-content-tertiary font-medium">Ações em Aberto</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">{openActionsCount}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-surface-card p-3 rounded-xl border border-surface-border">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título de reunião..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="scheduled">Agendadas</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluídas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
          >
            <option value="all">Todos os Tipos</option>
            <option value="internal">Interna</option>
            <option value="client">Cliente</option>
            <option value="project">Projeto</option>
            <option value="planning">Planejamento</option>
            <option value="review">Review</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      {isError ? (<div role="alert" className="rounded-xl border border-orange-500/30 p-5">Não foi possível carregar as reuniões. <Button onClick={() => void refetch()}>Tentar novamente</Button></div>) : isLoading ? (
        <div className="p-12 text-center text-xs text-content-secondary">
          <div className="animate-spin w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-2" />
          Carregando agendamentos...
        </div>
      ) : safeMeetings.length === 0 ? (
        <Card className="p-12 text-center space-y-3 border border-dashed border-surface-border">
          <CalendarDays className="w-12 h-12 text-content-tertiary mx-auto" />
          <h3 className="text-base font-semibold text-content-primary">Nenhuma reunião encontrada</h3>
          <p className="text-xs text-content-secondary max-w-sm mx-auto">
            Agende reuniões de alinhamento com clientes ou squads internas e mantenha pautas e atas organizadas.
          </p>
          <Button variant="outline" size="sm" disabled={!canCreate} onClick={() => navigate('/meetings/new')}>
            Agendar Primeira Reunião
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeMeetings.map((m) => (
            <Card
              key={m.id}
              onClick={() => navigate(`/meetings/${m.id}`)}
              className="p-5 cursor-pointer border border-surface-border hover:border-brand-primary/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={m.status === 'completed' ? 'success' : m.status === 'cancelled' ? 'neutral' : 'accent'}>
                    {m.status === 'completed' ? 'Concluída' : m.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                  </Badge>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                    {m.meeting_type}
                  </span>
                </div>

                <h3 className="font-bold text-content-primary text-base leading-snug">{m.title}</h3>
                {m.description && <p className="text-xs text-content-secondary line-clamp-2">{m.description}</p>}
              </div>

              <div className="pt-3 border-t border-surface-border/60 space-y-2 text-xs text-content-secondary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{new Date(m.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  {m.client_name && <span className="font-semibold text-content-primary truncate max-w-[140px]">{m.client_name}</span>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-content-tertiary">
                    {m.location_type === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    <span>{m.location_text || m.location_type}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-content-tertiary">
                    <Users className="w-3.5 h-3.5" />
                    <span>{m.participants?.length || 0} participantes</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
