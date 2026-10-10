// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Pillars Management Tab
// ============================================================

import React, { useState } from 'react'
import {
  Plus,
  Layers,
  Edit2,
  Trash2,
  Percent,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  useCreatePillar,
  useUpdatePillar,
  useDeletePillar,
} from '@/features/strategy/hooks/useStrategy'
import type { EditorialPillar } from '@/types/strategy'
import { DEFAULT_PILLAR_COLORS, CONTENT_FORMAT_CONFIG } from '@/types/strategy'

interface PillarsTabProps {
  agencyId: string
  strategyId: string
  pillars: EditorialPillar[]
  isLoading?: boolean
}

const FREQUENCY_OPTIONS = [
  'Diário (7x/semana)',
  '5x por semana',
  '3x por semana',
  '2x por semana',
  '1x por semana',
  'Quinzenal',
  'Mensal',
]

export const PillarsTab: React.FC<PillarsTabProps> = ({
  agencyId,
  strategyId,
  pillars,
  isLoading,
}) => {
  const createPillar = useCreatePillar(agencyId, strategyId)
  const updatePillar = useUpdatePillar(strategyId)
  const deletePillar = useDeletePillar(strategyId)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPillar, setEditingPillar] = useState<EditorialPillar | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(DEFAULT_PILLAR_COLORS[0])
  const [percentage, setPercentage] = useState(25)
  const [postingFrequency, setPostingFrequency] = useState('3x por semana')
  const [contentFormats, setContentFormats] = useState<string[]>(['carrossel', 'reels'])
  const [exampleTopics, setExampleTopics] = useState<string[]>([])
  const [tempTopic, setTempTopic] = useState('')

  // Calculate total percentage
  const totalPercentage = pillars.reduce((acc, p) => acc + (p.percentage || 0), 0)
  const is100Percent = totalPercentage === 100

  const handleOpenCreate = () => {
    setEditingPillar(null)
    setName('')
    setDescription('')
    // Pick the next unused color
    const usedColors = pillars.map((p) => p.color)
    const nextColor = DEFAULT_PILLAR_COLORS.find((c) => !usedColors.includes(c)) || DEFAULT_PILLAR_COLORS[0]
    setColor(nextColor)
    const remaining = Math.max(0, 100 - totalPercentage)
    setPercentage(remaining > 0 ? remaining : 20)
    setPostingFrequency('3x por semana')
    setContentFormats(['carrossel', 'reels'])
    setExampleTopics([])
    setTempTopic('')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (pillar: EditorialPillar) => {
    setEditingPillar(pillar)
    setName(pillar.name)
    setDescription(pillar.description || '')
    setColor(pillar.color || DEFAULT_PILLAR_COLORS[0])
    setPercentage(pillar.percentage || 0)
    setPostingFrequency(pillar.posting_frequency || '3x por semana')
    setContentFormats(pillar.content_formats || [])
    setExampleTopics(pillar.example_topics || [])
    setTempTopic('')
    setIsDialogOpen(true)
  }

  const handleAddTopic = () => {
    if (tempTopic.trim()) {
      setExampleTopics([...exampleTopics, tempTopic.trim()])
      setTempTopic('')
    }
  }

  const handleRemoveTopic = (index: number) => {
    setExampleTopics(exampleTopics.filter((_, i) => i !== index))
  }

  const toggleFormat = (fmtKey: string) => {
    if (contentFormats.includes(fmtKey)) {
      setContentFormats(contentFormats.filter((f) => f !== fmtKey))
    } else {
      setContentFormats([...contentFormats, fmtKey])
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return

    if (editingPillar) {
      await updatePillar.mutateAsync({
        pillarId: editingPillar.id,
        updates: {
          name: name.trim(),
          description: description.trim() || null,
          color,
          percentage: Number(percentage),
          posting_frequency: postingFrequency,
          content_formats: contentFormats,
          example_topics: exampleTopics,
        },
      })
    } else {
      await createPillar.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        percentage: Number(percentage),
        posting_frequency: postingFrequency,
        content_formats: contentFormats,
        example_topics: exampleTopics,
        position: pillars.length,
      })
    }

    setIsDialogOpen(false)
  }

  const handleDelete = async (pillarId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este pilar editorial?')) {
      await deletePillar.mutateAsync(pillarId)
    }
  }

  const handleCreateDefaultPresets = async () => {
    const presets = [
      {
        name: 'Autoridade & Conteúdo Técnico',
        description: 'Conteúdos densos, cases, análises e dados de mercado para gerar respeito e posicionamento líder.',
        color: '#7952FF',
        percentage: 35,
        posting_frequency: '3x por semana',
        content_formats: ['carrossel', 'artigo', 'video'],
        example_topics: ['Como resolver gargalos operacionais', 'Tendências do nicho para o próximo ano', 'Framework passo a passo'],
      },
      {
        name: 'Conexão & Bastidores',
        description: 'Humanização da marca, cultura da equipe, processos internos e dia a dia de produção.',
        color: '#10B981',
        percentage: 25,
        posting_frequency: '2x por semana',
        content_formats: ['stories', 'reels', 'post'],
        example_topics: ['Rotina do estúdio', 'Histórias de superação em projetos', 'Erros que cometemos e o que aprendemos'],
      },
      {
        name: 'Conversão & Prova Social',
        description: 'Depoimentos, resultados tangíveis de clientes, ofertas e chamadas para ação assertivas.',
        color: '#F59E0B',
        percentage: 20,
        posting_frequency: '2x por semana',
        content_formats: ['carrossel', 'post', 'stories'],
        example_topics: ['Antes e Depois de clientes', 'Depoimentos em vídeo', 'Demonstração de solução'],
      },
      {
        name: 'Comunidade & Engajamento',
        description: 'Perguntas, enquetes, memes inteligentes do setor e discussões que estimulam comentários.',
        color: '#EC4899',
        percentage: 20,
        posting_frequency: '2x por semana',
        content_formats: ['stories', 'thread', 'post'],
        example_topics: ['Enquetes sobre dilemas comuns', 'Meme sobre rotina criativa', 'Pergunta aberta nos stories'],
      },
    ]

    for (const preset of presets) {
      await createPillar.mutateAsync(preset)
    }
  }

  return (
    <div className="space-y-6">
      {/* Distribution Overview Card */}
      <Card className="bg-[#1C1C24] border-[#30303B]">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#F8F9FC] flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#7952FF]" />
                Distribuição Editorial por Pilares
              </h3>
              <p className="text-xs text-[#A1A1B0] mt-0.5">
                O equilíbrio percentual define a frequência e o volume de sugestões na grade de conteúdo.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  is100Percent
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {is100Percent ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Total: 100% (Balanceado)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      Total: {totalPercentage}% ({100 - totalPercentage > 0 ? `faltam ${100 - totalPercentage}%` : `excesso de ${totalPercentage - 100}%`})
                    </span>
                  </>
                )}
              </div>

              <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Novo Pilar</span>
              </Button>
            </div>
          </div>

          {/* Distribution Bar */}
          {pillars.length > 0 ? (
            <div className="space-y-3">
              <div className="h-3 w-full bg-[#13131A] rounded-full overflow-hidden flex border border-[#30303B]">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    style={{
                      width: `${pillar.percentage}%`,
                      backgroundColor: pillar.color,
                    }}
                    title={`${pillar.name}: ${pillar.percentage}%`}
                    className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:opacity-90"
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 pt-1">
                {pillars.map((pillar) => (
                  <div key={pillar.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <span className="font-medium text-[#F8F9FC]">{pillar.name}</span>
                    <span className="text-[#A1A1B0]">({pillar.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-[#717182]">
              Nenhum pilar cadastrado ainda. Crie pilares para distribuir seu conteúdo.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pillars Grid */}
      {pillars.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nenhum pilar editorial definido"
          description="Os pilares sustentam a estratégia de conteúdo da marca. Adicione temas recorrentes ou use nosso modelo padrão recomendado."
          actionLabel="Adicionar Sugestões Padrão (4 Pilares)"
          onAction={handleCreateDefaultPresets}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((pillar) => (
            <Card
              key={pillar.id}
              className="bg-[#1C1C24] border-[#30303B] hover:border-[#7952FF]/40 transition-colors group relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: pillar.color }}
              />

              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: pillar.color }}
                    >
                      {pillar.percentage}%
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#F8F9FC] group-hover:text-[#7952FF] transition-colors">
                        {pillar.name}
                      </h4>
                      {pillar.posting_frequency && (
                        <p className="text-[11px] text-[#A1A1B0] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#717182]" />
                          {pillar.posting_frequency}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(pillar)}
                      className="p-1.5 rounded-lg text-[#A1A1B0] hover:text-[#F8F9FC] hover:bg-[#30303B]/60 transition-colors"
                      title="Editar pilar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(pillar.id)}
                      className="p-1.5 rounded-lg text-[#A1A1B0] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir pilar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {pillar.description && (
                  <p className="text-xs text-[#A1A1B0] leading-relaxed mb-4">
                    {pillar.description}
                  </p>
                )}

                {/* Formats Badges */}
                {pillar.content_formats && pillar.content_formats.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[10px] uppercase font-bold text-[#717182] tracking-wider block mb-1.5">
                      Formatos recomendados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pillar.content_formats.map((fmt) => {
                        const config = CONTENT_FORMAT_CONFIG[fmt as keyof typeof CONTENT_FORMAT_CONFIG]
                        return (
                          <span
                            key={fmt}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-[#13131A] text-[#A1A1B0] border border-[#30303B]"
                          >
                            {config ? config.label : fmt}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Example Topics */}
                {pillar.example_topics && pillar.example_topics.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#717182] tracking-wider block mb-1.5">
                      Tópicos & Ideias de Exemplo:
                    </span>
                    <div className="space-y-1">
                      {pillar.example_topics.map((topic, i) => (
                        <div
                          key={i}
                          className="text-xs text-[#A1A1B0] bg-[#13131A]/60 px-2.5 py-1 rounded-md border border-[#30303B]/60 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7952FF]" />
                          <span className="truncate">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Create/Edit Pillar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-[#1C1C24] border-[#30303B] text-[#F8F9FC]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#F8F9FC]">
              {editingPillar ? 'Editar Pilar Editorial' : 'Novo Pilar Editorial'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Nome do Pilar *</label>
              <Input
                placeholder="Ex: Autoridade & Conteúdo Técnico"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Descrição & Objetivo</label>
              <Textarea
                placeholder="Qual o propósito deste pilar na estratégia?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Porcentagem na Grade (%)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value))}
                  />
                  <span className="text-[#A1A1B0] font-semibold">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Frequência Desejada</label>
                <select
                  className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
                  value={postingFrequency}
                  onChange={(e) => setPostingFrequency(e.target.value)}
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Cor de Identificação</label>
              <div className="flex items-center gap-2">
                {DEFAULT_PILLAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Content Formats */}
            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Formatos Recomendados</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CONTENT_FORMAT_CONFIG).slice(0, 8).map(([key, cfg]) => {
                  const selected = contentFormats.includes(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFormat(key)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                        selected
                          ? 'bg-[#7952FF]/20 text-[#7952FF] border-[#7952FF]/40'
                          : 'bg-[#13131A] text-[#A1A1B0] border-[#30303B] hover:text-[#F8F9FC]'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Example Topics */}
            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Tópicos & Ideias de Exemplo</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tema exemplo..."
                  value={tempTopic}
                  onChange={(e) => setTempTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTopic()
                    }
                  }}
                />
                <Button variant="secondary" size="sm" type="button" onClick={handleAddTopic}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {exampleTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {exampleTopics.map((top, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#13131A] text-[11px] text-[#A1A1B0] border border-[#30303B]"
                    >
                      {top}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(i)}
                        className="text-[#717182] hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
              disabled={!name.trim() || createPillar.isPending || updatePillar.isPending}
            >
              {editingPillar ? 'Atualizar Pilar' : 'Criar Pilar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
