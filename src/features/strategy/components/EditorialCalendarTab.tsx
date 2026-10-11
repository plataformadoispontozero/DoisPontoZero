// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Editorial Calendar & Pautas Tab
// ============================================================

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Calendar as CalendarIcon,
  List,
  Search,
  Filter,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  Share2,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  useCreateEditorialItem,
  useUpdateEditorialItem,
  useDeleteEditorialItem,
} from '@/features/strategy/hooks/useStrategy'
import type {
  EditorialItem,
  EditorialPillar,
  EditorialStatus,
  ContentIdea,
} from '@/types/strategy'
import {
  EDITORIAL_STATUS_CONFIG,
  CONTENT_FORMAT_CONFIG,
  SOCIAL_CHANNEL_CONFIG,
} from '@/types/strategy'

interface EditorialCalendarTabProps {
  agencyId: string
  strategyId: string
  items: EditorialItem[]
  pillars: EditorialPillar[]
  channels: string[]
  onOpenGenerator: () => void
  prefillIdea?: ContentIdea | null
  onClearPrefill?: () => void
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Todas as Pautas' },
  { id: 'draft', label: 'Rascunho' },
  { id: 'in_review', label: 'Em Revisão' },
  { id: 'approved', label: 'Aprovadas' },
  { id: 'scheduled', label: 'Agendadas' },
  { id: 'published', label: 'Publicadas' },
]

export const EditorialCalendarTab: React.FC<EditorialCalendarTabProps> = ({
  agencyId,
  strategyId,
  items,
  pillars,
  channels,
  onOpenGenerator,
  prefillIdea,
  onClearPrefill,
}) => {
  const createItem = useCreateEditorialItem(agencyId, strategyId)
  const updateItem = useUpdateEditorialItem(strategyId)
  const deleteItem = useDeleteEditorialItem(strategyId)

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPillarId, setSelectedPillarId] = useState<string>('all')

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EditorialItem | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pillarId, setPillarId] = useState<string>('')
  const [contentFormat, setContentFormat] = useState('carrossel')
  const [channel, setChannel] = useState(channels[0] || 'instagram')
  const [copyText, setCopyText] = useState('')
  const [hook, setHook] = useState('')
  const [cta, setCta] = useState('')
  const [visualNotes, setVisualNotes] = useState('')
  const [hashtagsStr, setHashtagsStr] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('10:00')

  // Trigger form open if prefillIdea is provided
  useEffect(() => {
    if (prefillIdea) {
      setEditingItem(null)
      setTitle(prefillIdea.title)
      setDescription(prefillIdea.description || '')
      setPillarId(prefillIdea.pillar_id || pillars[0]?.id || '')
      setContentFormat(prefillIdea.content_format || 'carrossel')
      setChannel(prefillIdea.channel || channels[0] || 'instagram')
      setHook(prefillIdea.hook || '')
      setCta(prefillIdea.cta || '')
      setVisualNotes('')
      setHashtagsStr(prefillIdea.hashtags?.join(' ') || '')
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      setScheduledDate(tomorrow)
      setScheduledTime('10:00')
      setIsDialogOpen(true)
    }
  }, [prefillIdea, pillars, channels])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setPillarId(pillars[0]?.id || '')
    setContentFormat('carrossel')
    setChannel(channels[0] || 'instagram')
    setCopyText('')
    setHook('')
    setCta('')
    setVisualNotes('')
    setHashtagsStr('')
    const today = new Date().toISOString().split('T')[0]
    setScheduledDate(today)
    setScheduledTime('10:00')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item: EditorialItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description || '')
    setPillarId(item.pillar_id || '')
    setContentFormat(item.content_format || 'carrossel')
    setChannel(item.channel || 'instagram')
    setCopyText(item.copy_text || '')
    setHook(item.hook || '')
    setCta(item.cta || '')
    setVisualNotes(item.visual_notes || '')
    setHashtagsStr(item.hashtags?.join(' ') || '')
    setScheduledDate(item.scheduled_date || '')
    setScheduledTime(item.scheduled_time || '10:00')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim()) return

    const hashtags = hashtagsStr
      .split(/[\s,]+/)
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .filter((h) => h.length > 1)

    if (editingItem) {
      await updateItem.mutateAsync({
        itemId: editingItem.id,
        updates: {
          title: title.trim(),
          description: description.trim() || null,
          pillar_id: pillarId || null,
          content_format: contentFormat,
          channel,
          copy_text: copyText.trim() || null,
          hook: hook.trim() || null,
          cta: cta.trim() || null,
          visual_notes: visualNotes.trim() || null,
          hashtags,
          scheduled_date: scheduledDate || null,
          scheduled_time: scheduledTime || null,
        },
      })
    } else {
      await createItem.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        pillar_id: pillarId || null,
        idea_id: prefillIdea?.id || null,
        content_format: contentFormat,
        channel,
        copy_text: copyText.trim() || undefined,
        hook: hook.trim() || undefined,
        cta: cta.trim() || undefined,
        visual_notes: visualNotes.trim() || undefined,
        hashtags,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
      })
      if (onClearPrefill) onClearPrefill()
    }

    setIsDialogOpen(false)
  }

  const handleStatusChange = async (itemId: string, newStatus: EditorialStatus) => {
    await updateItem.mutateAsync({
      itemId,
      updates: { status: newStatus },
    })
  }

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta pauta editorial?')) {
      await deleteItem.mutateAsync(itemId)
    }
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false
    if (selectedPillarId !== 'all' && item.pillar_id !== selectedPillarId) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchCopy = item.copy_text?.toLowerCase().includes(q)
      const matchDesc = item.description?.toLowerCase().includes(q)
      return matchTitle || matchCopy || matchDesc
    }
    return true
  })

  // Group items by date for calendar/chronological view
  const itemsByDate = filteredItems.reduce<Record<string, EditorialItem[]>>((acc, item) => {
    const d = item.scheduled_date || 'Sem data'
    if (!acc[d]) acc[d] = []
    acc[d].push(item)
    return acc
  }, {})

  const sortedDates = Object.keys(itemsByDate).sort()

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#98989F]" />
            <Input
              placeholder="Buscar pautas, temas, copies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9 bg-[#1C1C24] border-[#30303B]"
            />
          </div>

          {pillars.length > 0 && (
            <select
              className="h-9 rounded-md bg-[#1C1C24] border border-[#30303B] px-3 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
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

          {/* View switcher */}
          <div className="hidden sm:flex items-center rounded-lg bg-[#1C1C24] p-1 border border-[#30303B]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#C74410] text-white'
                  : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[#C74410] text-white'
                  : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
              }`}
              title="Visualização por Data"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenGenerator}
            className="gap-1.5 text-[#C74410] border-[#C74410]/30 hover:bg-[#C74410]/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerar Grade</span>
          </Button>

          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Nova Pauta</span>
          </Button>
        </div>
      </div>

      {/* Status Chips */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#30303B] pb-3">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.id === 'all'
              ? items.length
              : items.filter((i) => i.status === f.id).length
          const active = selectedStatus === f.id
          return (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'bg-[#C74410] text-white shadow-sm'
                  : 'bg-[#1C1C24] text-[#B8B8C0] hover:text-[#F8F9FC] border border-[#30303B]'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-[#13131A] text-[#98989F]'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content Rendering */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="Nenhuma pauta agendada"
          description={
            search || selectedStatus !== 'all' || selectedPillarId !== 'all'
              ? 'Nenhum resultado corresponde aos filtros selecionados.'
              : 'O calendário editorial organiza as publicações da marca com copies, hooks e formatos detalhados.'
          }
          actionLabel="Criar Pauta Editorial"
          onAction={handleOpenCreate}
        />
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const pillar = pillars.find((p) => p.id === item.pillar_id)
            const statusConfig = EDITORIAL_STATUS_CONFIG[item.status] || EDITORIAL_STATUS_CONFIG.draft
            const formatConfig = item.content_format
              ? CONTENT_FORMAT_CONFIG[item.content_format as keyof typeof CONTENT_FORMAT_CONFIG]
              : null
            const channelConfig = item.channel
              ? SOCIAL_CHANNEL_CONFIG[item.channel as keyof typeof SOCIAL_CHANNEL_CONFIG]
              : null

            return (
              <Card
                key={item.id}
                className="bg-[#1C1C24] border-[#30303B] hover:border-[#C74410]/40 transition-colors group"
              >
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Date / Channel / Format */}
                  <div className="flex items-start md:items-center gap-3.5 flex-1">
                    <div className="text-center p-2 rounded-lg bg-[#13131A] border border-[#30303B] min-w-[70px] flex-shrink-0">
                      <span className="block text-[10px] uppercase font-bold text-[#98989F]">
                        {item.scheduled_date
                          ? new Date(item.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                              weekday: 'short',
                            })
                          : 'Sem'}
                      </span>
                      <span className="block text-sm font-bold text-[#F8F9FC]">
                        {item.scheduled_date
                          ? new Date(item.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          : '--'}
                      </span>
                      {item.scheduled_time && (
                        <span className="block text-[10px] text-[#B8B8C0]">
                          {item.scheduled_time}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {pillar && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white"
                            style={{ backgroundColor: pillar.color }}
                          >
                            {pillar.name}
                          </span>
                        )}
                        {channelConfig && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#13131A] text-[#B8B8C0] border border-[#30303B]">
                            {channelConfig.label}
                          </span>
                        )}
                        {formatConfig && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#13131A] text-[#B8B8C0] border border-[#30303B]">
                            {formatConfig.label}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-[#F8F9FC] group-hover:text-[#C74410] transition-colors truncate">
                        {item.title}
                      </h4>

                      {item.copy_text && (
                        <p className="text-xs text-[#B8B8C0] line-clamp-1">
                          {item.copy_text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#30303B]">
                    <div className="flex items-center gap-1.5">
                      <select
                        className="h-7 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-[11px] text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as EditorialStatus)
                        }
                      >
                        {Object.entries(EDITORIAL_STATUS_CONFIG).map(([k, cfg]) => (
                          <option key={k} value={k}>
                            {cfg.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-md text-[#98989F] hover:text-[#F8F9FC] hover:bg-[#30303B]/60"
                        title="Editar pauta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-md text-[#98989F] hover:text-red-400 hover:bg-red-500/10"
                        title="Excluir pauta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Calendar / Date-grouped View */
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dateItems = itemsByDate[dateStr]
            const formattedDate =
              dateStr !== 'Sem data'
                ? new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Pautas sem data definida'

            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#B8B8C0] uppercase tracking-wider">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#C74410]" />
                  <span>{formattedDate}</span>
                  <span className="text-[10px] text-[#98989F]">({dateItems.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dateItems.map((item) => {
                    const pillar = pillars.find((p) => p.id === item.pillar_id)
                    const statusConfig =
                      EDITORIAL_STATUS_CONFIG[item.status] || EDITORIAL_STATUS_CONFIG.draft
                    const formatConfig = item.content_format
                      ? CONTENT_FORMAT_CONFIG[
                          item.content_format as keyof typeof CONTENT_FORMAT_CONFIG
                        ]
                      : null
                    const channelConfig = item.channel
                      ? SOCIAL_CHANNEL_CONFIG[
                          item.channel as keyof typeof SOCIAL_CHANNEL_CONFIG
                        ]
                      : null

                    return (
                      <Card
                        key={item.id}
                        className="bg-[#1C1C24] border-[#30303B] hover:border-[#C74410]/40 transition-colors"
                      >
                        <CardContent className="p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {pillar && (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white truncate max-w-[100px]"
                                  style={{ backgroundColor: pillar.color }}
                                >
                                  {pillar.name}
                                </span>
                              )}
                              {channelConfig && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#13131A] text-[#B8B8C0] border border-[#30303B]">
                                  {channelConfig.label}
                                </span>
                              )}
                            </div>

                            <Badge
                              variant={statusConfig.badgeVariant}
                              className="text-[10px] px-1.5 py-0.2"
                            >
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <h5 className="text-xs font-semibold text-[#F8F9FC] line-clamp-2">
                            {item.title}
                          </h5>

                          {item.copy_text && (
                            <p className="text-[11px] text-[#B8B8C0] line-clamp-2 bg-[#13131A] p-2 rounded border border-[#30303B]/60 italic">
                              "{item.copy_text}"
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-[#30303B]/60 text-[10px] text-[#98989F]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#C74410]" />
                              {item.scheduled_time || '10:00'}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="hover:text-[#F8F9FC]"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog Create/Edit Editorial Item */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-[#1C1C24] border-[#30303B] text-[#F8F9FC] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#F8F9FC]">
              {editingItem ? 'Editar Pauta Editorial' : 'Nova Pauta Editorial'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[#B8B8C0]">Título da Pauta / Assunto *</label>
              <Input
                placeholder="Ex: Carrossel com 5 tendências de IA no design"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-[#B8B8C0]">Pilar Editorial</label>
                <select
                  className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
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
                <label className="font-medium text-[#B8B8C0]">Canal de Veiculação</label>
                <select
                  className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
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
                <label className="font-medium text-[#B8B8C0]">Formato de Conteúdo</label>
                <select
                  className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
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

              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-1.5">
                  <label className="font-medium text-[#B8B8C0]">Data</label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-[#B8B8C0]">Hora</label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#B8B8C0]">Copywriting / Legenda Completa</label>
              <Textarea
                placeholder="Insira o texto completo do post..."
                value={copyText}
                onChange={(e) => setCopyText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-[#B8B8C0]">Gancho de Abertura (Hook)</label>
                <Input
                  placeholder="Primeira frase impactante..."
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#B8B8C0]">Chamada para Ação (CTA)</label>
                <Input
                  placeholder="Chamada de encerramento..."
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#B8B8C0]">Instruções Visuais / Direção de Arte</label>
              <Textarea
                placeholder="Ex: Foto de fundo escura com tipografia bold em branco. Logo no canto inferior..."
                value={visualNotes}
                onChange={(e) => setVisualNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#B8B8C0]">Hashtags</label>
              <Input
                placeholder="#estrategia #socialmedia #marketing"
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
              disabled={!title.trim() || createItem.isPending || updateItem.isPending}
            >
              {editingItem ? 'Salvar Pauta' : 'Criar Pauta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
