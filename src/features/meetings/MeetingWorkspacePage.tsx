// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: MEETING WORKSPACE PAGE
// 5 Tabs: Visão Geral, Pauta, Ata, Decisões, Ações
// ============================================================

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  Kanban,
  Check,
  Edit2,
  Sparkles,
} from 'lucide-react'
import { useAuth, usePermission } from '@/features/auth/AuthProvider'
import { useAgencyTeam } from '@/features/settings/hooks/useAgencySettings'
import { toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { useSingleMeeting } from './hooks/useMeetings'
import { useProjects } from '../projects/hooks/useProjects'

export const MeetingWorkspacePage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const auth = useAuth()
  const team = useAgencyTeam(auth.activeAgency?.agencyId || '')
  const canEdit = usePermission('meetings.edit')

  const {
    meeting,
    isLoading,
    isError, refetch, saveError, isSaving,
    addAgendaItem,
    deleteAgendaItem,
    updateMinutes,
    addDecision,
    addActionItem,
    convertActionToTask,
  } = useSingleMeeting(meetingId)

  const { data: projects = [] } = useProjects()

  // Tab State: 'overview' | 'agenda' | 'minutes' | 'decisions' | 'actions'
  const [activeTab, setActiveTab] = useState<'overview' | 'agenda' | 'minutes' | 'decisions' | 'actions'>('overview')

  // Agenda Dialog State
  const [isAddAgendaOpen, setIsAddAgendaOpen] = useState(false)
  const [newAgendaTitle, setNewAgendaTitle] = useState('')
  const [newAgendaDesc, setNewAgendaDesc] = useState('')
  const [newAgendaMinutes, setNewAgendaMinutes] = useState(15)

  // Minutes State
  const [minutesText, setMinutesText] = useState<string | null>(null)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Decision State
  const [isAddDecisionOpen, setIsAddDecisionOpen] = useState(false)
  const [newDecisionTitle, setNewDecisionTitle] = useState('')
  const [newDecisionDesc, setNewDecisionDesc] = useState('')

  // Action Item State
  const [isAddActionOpen, setIsAddActionOpen] = useState(false)
  const [newActionTitle, setNewActionTitle] = useState('')
  const [newActionAssignee, setNewActionAssignee] = useState('')

  // Convert to Task State
  const [convertingActionId, setConvertingActionId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '')

  if (isError) return <div role="alert">Não foi possível carregar a reunião. <Button onClick={() => void refetch()}>Tentar novamente</Button></div>
  if (!isLoading && !meeting) return <div>Reunião não encontrada. <Button onClick={() => navigate('/meetings')}>Voltar às reuniões</Button></div>
  if (isLoading || !meeting) {
    return (
      <div className="p-12 text-center text-xs text-content-secondary">
        <div className="animate-spin w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-2" />
        Carregando detalhes da reunião...
      </div>
    )
  }

  const handleAddAgendaSubmit = async () => {
    if (!newAgendaTitle.trim()) return
    await addAgendaItem({
      title: newAgendaTitle,
      description: newAgendaDesc,
      estimated_minutes: newAgendaMinutes,
    })
    setNewAgendaTitle('')
    setNewAgendaDesc('')
    setIsAddAgendaOpen(false)
  }

  const handleSaveMinutes = async (finalize = false) => {
    const textToSave = minutesText ?? meeting.minutes?.content ?? ''
    await updateMinutes(textToSave, finalize)
    setIsFinalizing(false)
  }

  const handleAddDecisionSubmit = async () => {
    if (!newDecisionTitle.trim()) return
    await addDecision({
      title: newDecisionTitle,
      description: newDecisionDesc,
    })
    setNewDecisionTitle('')
    setNewDecisionDesc('')
    setIsAddDecisionOpen(false)
  }

  const handleAddActionSubmit = async () => {
    if (!newActionTitle.trim()) return
    await addActionItem({
      title: newActionTitle,
      assigned_to: newActionAssignee || null,
    })
    setNewActionTitle('')
    setIsAddActionOpen(false)
  }

  const handleConvertActionToTaskSubmit = async () => {
    if (!convertingActionId || !selectedProjectId) return
    const createdTaskId = await convertActionToTask(convertingActionId, selectedProjectId)
    setConvertingActionId(null)
    if (createdTaskId) {
      navigate(`/tasks/${createdTaskId}`)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {saveError && <p role="alert" className="rounded-lg border border-orange-500/40 p-3">{saveError instanceof Error ? saveError.message : 'Não foi possível salvar a reunião.'} <button className="underline" onClick={() => void refetch()}>Atualizar dados</button></p>}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant={meeting.status === 'completed' ? 'success' : 'accent'}>
                {meeting.status === 'completed' ? 'Concluída' : 'Agendada'}
              </Badge>
              <span className="text-[10px] font-bold text-brand-primary uppercase bg-brand-primary/10 px-2 py-0.5 rounded">
                {meeting.meeting_type}
              </span>
            </div>
            <h1 className="text-xl font-bold text-content-primary mt-1">{meeting.title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {meeting.meeting_url && (
            <a href={meeting.meeting_url} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <Video className="w-3.5 h-3.5 mr-1.5" />
                Entrar na Call
                <ExternalLink className="w-3 h-3 ml-1.5 opacity-60" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-surface-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Visão Geral
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'agenda'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Pauta ({(meeting.agenda || []).length})
        </button>

        <button
          onClick={() => setActiveTab('minutes')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'minutes'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Ata & Registro {meeting.minutes?.status === 'finalized' && '🔒'}
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'decisions'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Decisões ({(meeting.decisions || []).length})
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'actions'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Ações / Tarefas ({(meeting.actions || []).length})
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-content-primary">Detalhes do Agendamento</h3>
              <p className="text-xs text-content-secondary leading-relaxed">{meeting.description || 'Sem descrição cadastrada.'}</p>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-surface-border text-xs text-content-secondary">
                <div>
                  <span className="text-content-tertiary block">Data & Horário:</span>
                  <span className="font-semibold text-content-primary">
                    {new Date(meeting.starts_at).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
                  </span>
                </div>

                <div>
                  <span className="text-content-tertiary block">Localização:</span>
                  <span className="font-semibold text-content-primary">{meeting.location_text || meeting.location_type}</span>
                </div>

                {meeting.client_name && (
                  <div>
                    <span className="text-content-tertiary block">Cliente Vinculado:</span>
                    <span className="font-semibold text-content-primary">{meeting.client_name}</span>
                  </div>
                )}

                {meeting.project_name && (
                  <div>
                    <span className="text-content-tertiary block">Projeto Vinculado:</span>
                    <span className="font-semibold text-content-primary">{meeting.project_name}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Decisions Summary */}
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-content-primary">Principais Decisões Tomadas</h3>
              {(meeting.decisions || []).length === 0 ? (
                <p className="text-xs text-content-tertiary">Nenhuma decisão registrada nesta reunião ainda.</p>
              ) : (
                <div className="space-y-2">
                  {(meeting.decisions || []).map((dec) => (
                    <div key={dec.id} className="p-3 bg-surface-subtle border border-surface-border rounded-lg text-xs space-y-1">
                      <span className="font-bold text-content-primary">{dec.title}</span>
                      {dec.description && <p className="text-content-secondary">{dec.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar Participants */}
          <div className="space-y-4">
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-content-primary">Participantes ({(meeting.participants || []).length})</h3>
              <div className="space-y-2">
                {(meeting.participants || []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded bg-surface-subtle border border-surface-border text-xs">
                    <div>
                      <span className="font-semibold text-content-primary block">{team.members.find(m => m.user_id === p.user_id)?.full_name || p.user_name || p.external_name || 'Membro'}</span>
                      <span className="text-[10px] text-content-tertiary">{p.external_email || p.participant_type}</span>
                    </div>
                    <Badge variant={p.response_status === 'accepted' ? 'success' : 'neutral'}>{p.response_status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PAUTA */}
      {activeTab === 'agenda' && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-content-primary">Tópicos da Pauta</h3>
            <Button variant="primary" size="sm" disabled={!canEdit || isSaving} onClick={() => setIsAddAgendaOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Tópico
            </Button>
          </div>

          {(meeting.agenda || []).length === 0 ? (
            <Card className="p-8 text-center text-xs text-content-secondary border border-dashed">
              Nenhum tópico cadastrado na pauta. Clique em "Adicionar Tópico" para organizar a reunião.
            </Card>
          ) : (
            <div className="space-y-3">
              {(meeting.agenda || []).map((item, idx) => (
                <Card key={item.id} className="p-4 border border-surface-border flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-content-primary text-sm">{item.title}</h4>
                      <Badge variant="neutral">{item.estimated_minutes} min</Badge>
                    </div>
                    {item.description && <p className="text-xs text-content-secondary pl-7">{item.description}</p>}
                  </div>
                  <button disabled={!canEdit || isSaving} onClick={() => void deleteAgendaItem(item.id).catch(() => toast.error("Não foi possível remover a pauta."))} className="text-content-tertiary hover:text-rose-400 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATA */}
      {activeTab === 'minutes' && (
        <div className="space-y-4 max-w-3xl">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-content-primary flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-brand-primary" />
                  Ata da Reunião
                </h3>
                <p className="text-xs text-content-secondary">
                  {meeting.minutes?.status === 'finalized'
                    ? `Finalizada em ${new Date(meeting.minutes.finalized_at || '').toLocaleString('pt-BR')}`
                    : 'Modo rascunho. Registre as discussões e conclusões.'}
                </p>
              </div>
              <Badge variant={meeting.minutes?.status === 'finalized' ? 'success' : 'neutral'}>
                {meeting.minutes?.status === 'finalized' ? 'Finalizada (Imutável)' : 'Rascunho'}
              </Badge>
            </div>

            <textarea
              rows={10}
              disabled={!canEdit || isSaving || meeting.minutes?.status === 'finalized'}
              value={minutesText ?? meeting.minutes?.content ?? ''}
              onChange={(e) => setMinutesText(e.target.value)}
              placeholder="Digite o resumo das discussões, acordos e direcionamentos alinhados durante a call..."
              className="w-full p-4 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary leading-relaxed disabled:opacity-80"
            />

            {meeting.minutes?.status !== 'finalized' && (
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="ghost" size="sm" disabled={!canEdit || isSaving} onClick={() => void handleSaveMinutes(false).catch(() => toast.error("Não foi possível salvar a ata."))}>
                  Salvar Rascunho
                </Button>
                <Button variant="primary" size="sm" disabled={!canEdit || isSaving} onClick={() => void handleSaveMinutes(true).catch(() => toast.error("Não foi possível salvar a ata."))}>
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  Finalizar Ata
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: DECISÕES */}
      {activeTab === 'decisions' && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-content-primary">Decisões Aprovadas</h3>
            <Button variant="primary" size="sm" disabled={!canEdit || isSaving} onClick={() => setIsAddDecisionOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Registrar Decisão
            </Button>
          </div>

          {(meeting.decisions || []).length === 0 ? (
            <Card className="p-8 text-center text-xs text-content-secondary border border-dashed">
              Nenhuma decisão registrada ainda. Clique acima para documentar deliberações.
            </Card>
          ) : (
            <div className="space-y-3">
              {(meeting.decisions || []).map((dec) => (
                <Card key={dec.id} className="p-4 border border-surface-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary text-sm">{dec.title}</span>
                    <Badge variant="success">Ativa</Badge>
                  </div>
                  {dec.description && <p className="text-xs text-content-secondary">{dec.description}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AÇÕES */}
      {activeTab === 'actions' && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-content-primary">Action Items (Pendências)</h3>
            <Button variant="primary" size="sm" disabled={!canEdit || isSaving} onClick={() => setIsAddActionOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Action Item
            </Button>
          </div>

          {(meeting.actions || []).length === 0 ? (
            <Card className="p-8 text-center text-xs text-content-secondary border border-dashed">
              Nenhum action item cadastrado. Crie tarefas derivadas das conversas de alinhamento.
            </Card>
          ) : (
            <div className="space-y-3">
              {(meeting.actions || []).map((act) => (
                <Card key={act.id} className="p-4 border border-surface-border flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-content-primary text-sm block">{act.title}</span>
                    <div className="flex items-center space-x-3 text-xs text-content-tertiary">
                      <span>Responsável: {team.members.find(m => m.user_id === act.assigned_to)?.full_name || act.assignee_name || 'Sem responsável'}</span>
                      <span>Prazo: {act.due_at ? new Date(act.due_at).toLocaleDateString('pt-BR') : 'Não definido'}</span>
                    </div>
                  </div>

                  <div>
                    {act.status === 'converted' ? (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/tasks/${act.task_id}`)}>
                        <Kanban className="w-3.5 h-3.5 mr-1 text-brand-primary" />
                        Abrir Tarefa
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canEdit || isSaving || act.status !== 'pending'}
                        onClick={() => {
                          setSelectedProjectId(meeting.project_id || '')
                          setConvertingActionId(act.id)
                        }}
                      >
                        Criar tarefa no Kanban
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIALOG: ADD AGENDA ITEM */}
      <Dialog open={isAddAgendaOpen} onOpenChange={setIsAddAgendaOpen}>
        <div className="p-6 space-y-4">
          <h3 className="text-base font-bold text-content-primary">Adicionar Tópico da Pauta</h3>
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Título *</label>
            <input
              type="text"
              value={newAgendaTitle}
              onChange={(e) => setNewAgendaTitle(e.target.value)}
              placeholder="Ex: Aprovação de peças do feed"
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Duração Estimada (minutos)</label>
            <input
              type="number"
              value={newAgendaMinutes}
              onChange={(e) => setNewAgendaMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddAgendaOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void handleAddAgendaSubmit().catch(() => toast.error("Não foi possível concluir. Confira os dados e o acesso."))} disabled={!canEdit || isSaving || !newAgendaTitle.trim()}>
              Adicionar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* DIALOG: ADD DECISION */}
      <Dialog open={isAddDecisionOpen} onOpenChange={setIsAddDecisionOpen}>
        <div className="p-6 space-y-4">
          <h3 className="text-base font-bold text-content-primary">Registrar Nova Decisão</h3>
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Título da Decisão *</label>
            <input
              type="text"
              value={newDecisionTitle}
              onChange={(e) => setNewDecisionTitle(e.target.value)}
              placeholder="Ex: Formato oficial dos Reels aprovado"
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Detalhes / Justificativa</label>
            <textarea
              rows={3}
              value={newDecisionDesc}
              onChange={(e) => setNewDecisionDesc(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddDecisionOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void handleAddDecisionSubmit().catch(() => toast.error("Não foi possível concluir. Confira os dados e o acesso."))} disabled={!canEdit || isSaving || !newDecisionTitle.trim()}>
              Registrar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* DIALOG: ADD ACTION ITEM */}
      <Dialog open={isAddActionOpen} onOpenChange={setIsAddActionOpen}>
        <div className="p-6 space-y-4">
          <h3 className="text-base font-bold text-content-primary">Adicionar Action Item</h3>
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Ação / Pendência *</label>
            <input
              type="text"
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
              placeholder="Ex: Enviar guias de gravação para o cliente"
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>

          <label className="block text-xs">Responsável<select aria-label="Responsável pela ação" value={newActionAssignee} onChange={e => setNewActionAssignee(e.target.value)} disabled={team.isLoading || team.isError} className="mt-1 w-full rounded border border-white/20 bg-zinc-900 p-2"><option value="">Sem responsável</option>{team.members.filter(m => m.status === 'active').map(m => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></label>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddActionOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void handleAddActionSubmit().catch(() => toast.error("Não foi possível concluir. Confira os dados e o acesso."))} disabled={!canEdit || isSaving || !newActionTitle.trim()}>
              Adicionar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* DIALOG: CONVERT ACTION TO TASK */}
      <Dialog open={Boolean(convertingActionId)} onOpenChange={() => setConvertingActionId(null)}>
        <div className="p-6 space-y-4">
          <h3 className="text-base font-bold text-content-primary">Criar Tarefa no Kanban</h3>
          <p className="text-xs text-content-secondary">Selecione para qual projeto esta tarefa será direcionada.</p>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Projeto Destino *</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
            >
              <option value="">Escolha um projeto</option>
              {projects.filter(p => !meeting.client_id || p.client_id === meeting.client_id).map((p: { id: string; name: string }) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setConvertingActionId(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void handleConvertActionToTaskSubmit().catch(() => toast.error("Não foi possível concluir. Confira os dados e o acesso."))} disabled={!canEdit || isSaving || !selectedProjectId}>
              Criar Tarefa Agora
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
