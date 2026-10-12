import { useAgencyId, useAuth } from '@/features/auth/AuthProvider'
import { toast } from '@/components/ui/Toast'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: NEW MEETING WIZARD
// ============================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Video, MapPin, Users, Check, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCreateMeeting } from './hooks/useMeetings'
import { useClients } from '../clients/hooks/useClients'
import { useProjects } from '../projects/hooks/useProjects'
import type { MeetingType, LocationType } from '@/types/meetings'
import type { Client } from '@/types/projects'

export const NewMeetingPage: React.FC = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const { data: clients } = useClients(useAgencyId())
  const { data: projects = [] } = useProjects()
  const createMeetingMutation = useCreateMeeting()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('client')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('14:00')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [locationType, setLocationType] = useState<LocationType>('online')
  const [locationText, setLocationText] = useState('Google Meet')
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/new')
  const [externalEmail, setExternalEmail] = useState('')

  const safeClients: Client[] = clients || []
  const safeProjects = projects || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const startIso = new Date(`${startDate}T${startTime}:00`).toISOString()
    const endIso = new Date(new Date(startIso).getTime() + durationMinutes * 60000).toISOString()

    const client = safeClients.find((c) => c.id === selectedClientId)
    const project = safeProjects.find((p: { id: string }) => p.id === selectedProjectId)

    const participants: Array<{
      user_id?: string
      user_name?: string
      external_name?: string
      external_email?: string
      participant_type: 'internal' | 'external'
    }> = [
      { user_id: auth.user?.id, user_name: auth.name, participant_type: 'internal' },
    ]
    if (externalEmail) {
      participants.push({ external_name: externalEmail, external_email: externalEmail, participant_type: 'external' })
    }

    try {
    const created = await createMeetingMutation.mutateAsync({
      title,
      description,
      meeting_type: meetingType,
      client_id: selectedClientId || undefined,
      client_name: client?.name,
      project_id: selectedProjectId || undefined,
      project_name: project?.name,
      starts_at: startIso,
      ends_at: endIso,
      location_type: locationType,
      location_text: locationText,
      meeting_url: meetingUrl,
      participants,
    })

    navigate(`/meetings/${created.id}`)
    } catch { toast.error('Não foi possível criar a reunião. Verifique o acesso e a integração do backend.') }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-xl font-bold text-content-primary">Agendar Nova Reunião</h1>
          <p className="text-xs text-content-secondary">Defina horários, pauta inicial e convide participantes.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-content-primary flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-brand-primary" />
            Informações Principais
          </h2>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Título da Reunião *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Alinhamento Estratégico - Campanha Q4"
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Descrição / Objetivo</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumo do objetivo principal desta reunião..."
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Tipo de Reunião</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="client">Cliente</option>
                <option value="internal">Interna</option>
                <option value="project">Projeto</option>
                <option value="planning">Planejamento</option>
                <option value="review">Review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Cliente (Opcional)</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="">Selecione um cliente...</option>
                {safeClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Projeto (Opcional)</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="">Selecione um projeto...</option>
                {safeProjects.map((p: { id: string; name: string }) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-content-primary flex items-center">
            <Clock className="w-4 h-4 mr-2 text-brand-primary" />
            Data & Localização
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Data</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Horário Inicial</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Duração Estimada</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1 hora e 30 min</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Formato</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as LocationType)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="online">Online</option>
                <option value="in_person">Presencial</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Local / Plataforma</label>
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Ex: Google Meet ou Sala Principal"
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Link da Reunião</label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-content-primary flex items-center">
            <Users className="w-4 h-4 mr-2 text-brand-primary" />
            Participantes Externos
          </h2>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Convidar por E-mail (Cliente/Convidado)</label>
            <input
              type="email"
              value={externalEmail}
              onChange={(e) => setExternalEmail(e.target.value)}
              placeholder="cliente@empresa.com.br"
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate('/meetings')}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={createMeetingMutation.isPending}>
            Confirmar Agendamento
          </Button>
        </div>
      </form>
    </div>
  )
}
