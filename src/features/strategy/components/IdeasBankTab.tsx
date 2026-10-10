// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Content Ideas Bank Tab
// ============================================================

import React, { useState } from 'react'
import {
  Plus,
  Lightbulb,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Tag,
  Hash,
  Send,
  Trash2,
  Edit2,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  useCreateIdea,
  useUpdateIdea,
} from '@/features/strategy/hooks/useStrategy'
import type {
  ContentIdea,
  EditorialPillar,
  IdeaStatus,
  ContentFormat,
  SocialChannel,
} from '@/types/strategy'
import {
  IDEA_STATUS_CONFIG,
  CONTENT_FORMAT_CONFIG,
  SOCIAL_CHANNEL_CONFIG,
} from '@/types/strategy'

interface IdeasBankTabProps {
  agencyId: string
  strategyId: string
  ideas: ContentIdea[]
  pillars: EditorialPillar[]
  channels: string[]
  onConvertToEditorialItem?: (idea: ContentIdea) => void
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Todas as Ideias' },
  { id: 'idea', label: 'Ideia' },
  { id: 'approved', label: 'Aprovadas' },
  { id: 'in_production', label: 'Em Produção' },
  { id: 'scheduled', label: 'Agendadas' },
  { id: 'discarded', label: 'Descartadas' },
]

export const IdeasBankTab: React.FC<IdeasBankTabProps> = ({
  agencyId,
  strategyId,
  ideas,
  pillars,
  channels,
  onConvertToEditorialItem,
}) => {
  const createIdea = useCreateIdea(agencyId, strategyId)
  const updateIdea = useUpdateIdea(strategyId)

  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPillarId, setSelectedPillarId] = useState<string>('all')

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pillarId, setPillarId] = useState<string>(pillars[0]?.id || '')
  const [contentFormat, setContentFormat] = useState('carrossel')
  const [channel, setChannel] = useState(channels[0] || 'instagram')
  const [hook, setHook] = useState('')
  const [cta, setCta] = useState('')
  const [hashtagsStr, setHashtagsStr] = useState('')
  const [priority, setPriority] = useState('normal')

  const handleOpenCreate = () => {
    setEditingIdea(null)
    setTitle('')
    setDescription('')
    setPillarId(pillars[0]?.id || '')
    setContentFormat('carrossel')
    setChannel(channels[0] || 'instagram')
    setHook('')
    setCta('')
    setHashtagsStr('')
    setPriority('normal')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (idea: ContentIdea) => {
    setEditingIdea(idea)
    setTitle(idea.title)
    setDescription(idea.description || '')
    setPillarId(idea.pillar_id || '')
    setContentFormat(idea.content_format || 'carrossel')
    setChannel(idea.channel || 'instagram')
    setHook(idea.hook || '')
    setCta(idea.cta || '')
    setHashtagsStr(idea.hashtags?.join(' ') || '')
    setPriority(idea.priority || 'normal')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim()) return

    const hashtags = hashtagsStr
      .split(/[\s,]+/)
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .filter((h) => h.length > 1)

    if (editingIdea) {
      await updateIdea.mutateAsync({
        ideaId: editingIdea.id,
        updates: {
          title: title.trim(),
          description: description.trim() || null,
          pillar_id: pillarId || null,
          content_format: contentFormat,
          channel: channel,
          hook: hook.trim() || null,
          cta: cta.trim() || null,
          hashtags,
          priority,
        },
      })
    } else {
      await createIdea.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        pillar_id: pillarId || null,
        content_format: contentFormat,
        channel: channel,
        hook: hook.trim() || undefined,
        cta: cta.trim() || undefined,
        hashtags,
        priority,
      })
    }

    setIsDialogOpen(false)
  }

  const handleStatusChange = async (ideaId: string, newStatus: IdeaStatus) => {
    await updateIdea.mutateAsync({
      ideaId,
      updates: { status: newStatus },
    })
  }

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    if (selectedStatus !== 'all' && idea.status !== selectedStatus) return false
    if (selectedPillarId !== 'all' && idea.pillar_id !== selectedPillarId) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = idea.title.toLowerCase().includes(q)
      const matchDesc = idea.description?.toLowerCase().includes(q)
      const matchHook = idea.hook?.toLowerCase().includes(q)
      return matchTitle || matchDesc || matchHook
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#717182]" />
            <Input
              placeholder="Buscar ideias no banco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9 bg-[#1C1C24] border-[#30303B]"
            />
          </div>

          {/* Pillar Filter */}
          {pillars.length > 0 && (
            <select
              className="h-9 rounded-md bg-[#1C1C24] border border-[#30303B] px-3 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
              value={selectedPillarId}
              onChange={(e) => setSelectedPillarId(e.target.value)}
            >
              <option value="all">Todos os Pilares</option>
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1.5 self-start md:self-auto">
          <Plus className="w-4 h-4" />
          <span>Nova Ideia</span>
        </Button>
      </div>

      {/* Status Chips */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#30303B] pb-3">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.id === 'all'
              ? ideas.length
              : ideas.filter((i) => i.status === f.id).length
          const active = selectedStatus === f.id
          return (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'bg-[#7952FF] text-white shadow-sm'
                  : 'bg-[#1C1C24] text-[#A1A1B0] hover:text-[#F8F9FC] border border-[#30303B]'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-[#13131A] text-[#717182]'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Nenhuma ideia encontrada"
          description={
            search || selectedStatus !== 'all' || selectedPillarId !== 'all'
              ? 'Tente remover os filtros para visualizar outras ideias.'
              : 'O banco de ideias guarda conceitos e formatos para serem amadurecidos e transformados em pautas reais.'
          }
          actionLabel="Adicionar Primeira Ideia"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => {
            const pillar = pillars.find((p) => p.id === idea.pillar_id)
            const statusConfig = IDEA_STATUS_CONFIG[idea.status] || IDEA_STATUS_CONFIG.idea
            const formatConfig = idea.content_format
              ? CONTENT_FORMAT_CONFIG[idea.content_format as keyof typeof CONTENT_FORMAT_CONFIG]
              : null
            const channelConfig = idea.channel
              ? SOCIAL_CHANNEL_CONFIG[idea.channel as keyof typeof SOCIAL_CHANNEL_CONFIG]
              : null

            return (
              <Card
                key={idea.id}
                className="bg-[#1C1C24] border-[#30303B] hover:border-[#7952FF]/40 transition-colors flex flex-col justify-between group"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pillar && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white truncate max-w-[120px]"
                          style={{ backgroundColor: pillar.color }}
                        >
                          {pillar.name}
                        </span>
                      )}
                      {formatConfig && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#13131A] text-[#A1A1B0] border border-[#30303B]">
                          {formatConfig.label}
                        </span>
                      )}
                      {channelConfig && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#13131A] text-[#A1A1B0] border border-[#30303B]">
                          {channelConfig.label}
                        </span>
                      )}
                    </div>

                    <Badge variant={statusConfig.badgeVariant} className="text-[10px] px-2 py-0.5">
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#F8F9FC] group-hover:text-[#7952FF] transition-colors leading-snug">
                      {idea.title}
                    </h4>
                    {idea.description && (
                      <p className="text-xs text-[#A1A1B0] mt-1 line-clamp-2 leading-relaxed">
                        {idea.description}
                      </p>
                    )}
                  </div>

                  {/* Hook / CTA previews */}
                  {(idea.hook || idea.cta) && (
                    <div className="space-y-1 bg-[#13131A]/60 p-2.5 rounded-lg border border-[#30303B]/60 text-[11px]">
                      {idea.hook && (
                        <p className="text-[#A1A1B0]">
                          <span className="text-[#7952FF] font-semibold">Gancho:</span>{' '}
                          <span className="italic">{idea.hook}</span>
                        </p>
                      )}
                      {idea.cta && (
                        <p className="text-[#A1A1B0]">
                          <span className="text-emerald-400 font-semibold">CTA:</span> {idea.cta}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Hashtags */}
                  {idea.hashtags && idea.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.hashtags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] text-[#717182]">
                          {tag}
                        </span>
                      ))}
                      {idea.hashtags.length > 3 && (
                        <span className="text-[10px] text-[#717182]">
                          +{idea.hashtags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Origin */}
                  {idea.suggested_by && idea.suggested_by !== 'manual' && (
                    <div className="flex items-center gap-1 text-[10px] text-[#7952FF]">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        {idea.suggested_by === 'editorial_engine'
                          ? 'Sugerido pelo Gerador Editorial'
                          : 'Extraído do Briefing'}
                      </span>
                    </div>
                  )}
                </CardContent>

                {/* Footer Actions */}
                <div className="px-4 py-2.5 border-t border-[#30303B]/60 bg-[#13131A]/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(idea)}
                      className="p-1 rounded-md text-[#717182] hover:text-[#F8F9FC] hover:bg-[#30303B]/60"
                      title="Editar ideia"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {idea.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(idea.id, 'approved')}
                        className="p-1 rounded-md text-[#717182] hover:text-emerald-400 hover:bg-emerald-500/10"
                        title="Aprovar ideia"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {idea.status !== 'discarded' && (
                      <button
                        onClick={() => handleStatusChange(idea.id, 'discarded')}
                        className="p-1 rounded-md text-[#717182] hover:text-red-400 hover:bg-red-500/10"
                        title="Descartar ideia"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {onConvertToEditorialItem && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onConvertToEditorialItem(idea)}
                      className="text-[11px] h-7 gap-1 px-2.5 hover:text-[#7952FF]"
                    >
                      <span>Gerar Pauta</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog Create/Edit Idea */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-[#1C1C24] border-[#30303B] text-[#F8F9FC]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#F8F9FC]">
              {editingIdea ? 'Editar Ideia de Conteúdo' : 'Nova Ideia no Banco'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Título da Ideia *</label>
              <Input
                placeholder="Ex: 5 erros fatais ao precificar serviços criativos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Pilar Editorial</label>
                <select
                  className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
                  value={pillarId}
                  onChange={(e) => setPillarId(e.target.value)}
                >
                  <option value="">Sem pilar específico</option>
                  {pillars.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Canal Principal</label>
                <select
                  className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  {Object.entries(SOCIAL_CHANNEL_CONFIG).map(([k, cfg]) => (
                    <option key={k} value={k}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Formato de Conteúdo</label>
                <select
                  className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
                  value={contentFormat}
                  onChange={(e) => setContentFormat(e.target.value)}
                >
                  {Object.entries(CONTENT_FORMAT_CONFIG).map(([k, cfg]) => (
                    <option key={k} value={k}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Prioridade</label>
                <select
                  className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="high">Alta Prioridade</option>
                  <option value="normal">Normal</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Descrição / Linha de Raciocínio</label>
              <Textarea
                placeholder="Qual o desdobramento deste conteúdo?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Gancho de Abertura (Hook)</label>
                <Input
                  placeholder="Ex: Pare de perder margem de lucro..."
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Chamada para Ação (CTA)</label>
                <Input
                  placeholder="Ex: Comente 'PROPOSTA' para receber..."
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Hashtags (separadas por espaço)</label>
              <Input
                placeholder="#marketing #design #agencia"
                value={hashtagsStr}
                onChange={(e) => setHashtagsStr(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!title.trim() || createIdea.isPending || updateIdea.isPending}
            >
              {editingIdea ? 'Salvar Alterações' : 'Salvar Ideia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
