// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Strategy Overview & Strategic Diagnosis Tab
// ============================================================

import React, { useState } from 'react'
import {
  Target,
  Users,
  MessageSquare,
  Award,
  Globe,
  Zap,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  Edit2,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { useUpdateStrategy } from '@/features/strategy/hooks/useStrategy'
import type { ContentStrategy, EditorialPillar } from '@/types/strategy'
import { SOCIAL_CHANNEL_CONFIG } from '@/types/strategy'

interface StrategyOverviewTabProps {
  agencyId: string
  strategy: ContentStrategy
  pillars: EditorialPillar[]
  onOpenBriefingSync?: () => void
  onOpenGenerator?: () => void
}

export const StrategyOverviewTab: React.FC<StrategyOverviewTabProps> = ({
  agencyId,
  strategy,
  pillars,
  onOpenBriefingSync,
  onOpenGenerator,
}) => {
  const updateStrategy = useUpdateStrategy(agencyId, strategy.id)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [objective, setObjective] = useState(strategy.objective || '')
  const [targetAudience, setTargetAudience] = useState(strategy.target_audience || '')
  const [toneOfVoice, setToneOfVoice] = useState(strategy.tone_of_voice || '')
  const [brandPositioning, setBrandPositioning] = useState(strategy.brand_positioning || '')
  const [competitors, setCompetitors] = useState<string[]>(strategy.competitors || [])
  const [keyMessages, setKeyMessages] = useState<string[]>(strategy.key_messages || [])
  const [restrictions, setRestrictions] = useState<string[]>(strategy.restrictions || [])
  const [channels, setChannels] = useState<string[]>(strategy.channels || [])
  const [periodStart, setPeriodStart] = useState(strategy.period_start || '')
  const [periodEnd, setPeriodEnd] = useState(strategy.period_end || '')

  const [tempComp, setTempComp] = useState('')
  const [tempMsg, setTempMsg] = useState('')
  const [tempRest, setTempRest] = useState('')

  const handleOpenEdit = () => {
    setObjective(strategy.objective || '')
    setTargetAudience(strategy.target_audience || '')
    setToneOfVoice(strategy.tone_of_voice || '')
    setBrandPositioning(strategy.brand_positioning || '')
    setCompetitors(strategy.competitors || [])
    setKeyMessages(strategy.key_messages || [])
    setRestrictions(strategy.restrictions || [])
    setChannels(strategy.channels || [])
    setPeriodStart(strategy.period_start || '')
    setPeriodEnd(strategy.period_end || '')
    setIsEditOpen(true)
  }

  const handleSave = async () => {
    await updateStrategy.mutateAsync({
      objective: objective.trim() || null,
      target_audience: targetAudience.trim() || null,
      tone_of_voice: toneOfVoice.trim() || null,
      brand_positioning: brandPositioning.trim() || null,
      competitors,
      key_messages: keyMessages,
      restrictions,
      channels,
      period_start: periodStart || null,
      period_end: periodEnd || null,
    })
    setIsEditOpen(false)
  }

  const toggleChannel = (ch: string) => {
    if (channels.includes(ch)) {
      setChannels(channels.filter((c) => c !== ch))
    } else {
      setChannels([...channels, ch])
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#1C1C24] border border-[#30303B]">
        <div>
          <h3 className="text-sm font-semibold text-[#F8F9FC]">Diagnóstico & Diretrizes Estratégicas</h3>
          <p className="text-xs text-[#A1A1B0] mt-0.5">
            Orientações de posicionamento, linguagem, público e canais que norteiam toda a criação de conteúdo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBriefingSync && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenBriefingSync}
              className="gap-1.5 text-xs border-[#30303B]"
            >
              <FileText className="w-3.5 h-3.5 text-[#7952FF]" />
              <span>Sincronizar Briefing</span>
            </Button>
          )}

          <Button variant="primary" size="sm" onClick={handleOpenEdit} className="gap-1.5 text-xs">
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Diagnóstico</span>
          </Button>
        </div>
      </div>

      {/* 4 Pillars Summary Distribution */}
      {pillars.length > 0 && (
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F8F9FC] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#7952FF]" />
                Composição dos Pilares Editoriais ({pillars.length})
              </span>
              <span className="text-[#A1A1B0]">
                {pillars.reduce((acc, p) => acc + (p.percentage || 0), 0)}% alocado
              </span>
            </div>

            <div className="h-2.5 w-full bg-[#13131A] rounded-full overflow-hidden flex border border-[#30303B]">
              {pillars.map((pillar) => (
                <div
                  key={pillar.id}
                  style={{
                    width: `${pillar.percentage}%`,
                    backgroundColor: pillar.color,
                  }}
                  title={`${pillar.name}: ${pillar.percentage}%`}
                  className="h-full transition-all"
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-0.5">
              {pillars.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[#F8F9FC] font-medium">{p.name}</span>
                  <span className="text-[#717182]">({p.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Objective */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7952FF]">
              <Target className="w-4 h-4" />
              <span>OBJETIVO PRINCIPAL</span>
            </div>
            <p className="text-xs text-[#F8F9FC] leading-relaxed">
              {strategy.objective || 'Nenhum objetivo especificado ainda.'}
            </p>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Users className="w-4 h-4" />
              <span>PÚBLICO-ALVO & PERSONA</span>
            </div>
            <p className="text-xs text-[#F8F9FC] leading-relaxed">
              {strategy.target_audience || 'Público-alvo não definido.'}
            </p>
          </CardContent>
        </Card>

        {/* Tone of Voice */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <MessageSquare className="w-4 h-4" />
              <span>TOM DE VOZ & LINGUAGEM</span>
            </div>
            <p className="text-xs text-[#F8F9FC] leading-relaxed">
              {strategy.tone_of_voice || 'Tom de voz não especificado.'}
            </p>
          </CardContent>
        </Card>

        {/* Brand Positioning */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Award className="w-4 h-4" />
              <span>POSICIONAMENTO DE MARCA</span>
            </div>
            <p className="text-xs text-[#F8F9FC] leading-relaxed">
              {strategy.brand_positioning || 'Posicionamento não especificado.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channels & Period Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Channels */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A1A1B0]">
              <Globe className="w-4 h-4 text-[#7952FF]" />
              <span>CANAIS ATIVOS DE VEICULAÇÃO</span>
            </div>
            {strategy.channels && strategy.channels.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {strategy.channels.map((ch) => {
                  const cfg = SOCIAL_CHANNEL_CONFIG[ch as keyof typeof SOCIAL_CHANNEL_CONFIG]
                  return (
                    <span
                      key={ch}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#13131A] text-xs text-[#F8F9FC] border border-[#30303B]"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cfg?.color || '#7952FF' }}
                      />
                      <span>{cfg?.label || ch}</span>
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[#717182]">Nenhum canal ativo selecionado.</p>
            )}
          </CardContent>
        </Card>

        {/* Strategic Period */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A1A1B0]">
              <Calendar className="w-4 h-4 text-[#7952FF]" />
              <span>CICLO DE VIGÊNCIA E PLANEJAMENTO</span>
            </div>
            <div className="text-xs text-[#F8F9FC] space-y-1">
              <div>
                <span className="text-[#717182]">Data de Início:</span>{' '}
                <span className="font-medium">
                  {strategy.period_start
                    ? new Date(strategy.period_start + 'T00:00:00').toLocaleDateString('pt-BR')
                    : 'Não informada'}
                </span>
              </div>
              <div>
                <span className="text-[#717182]">Data de Término:</span>{' '}
                <span className="font-medium">
                  {strategy.period_end
                    ? new Date(strategy.period_end + 'T00:00:00').toLocaleDateString('pt-BR')
                    : 'Não informada'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Messages, Competitors, Restrictions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Key Messages */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7952FF]">
              <Zap className="w-4 h-4" />
              <span>MENSAGENS-CHAVE</span>
            </div>
            {strategy.key_messages && strategy.key_messages.length > 0 ? (
              <div className="space-y-1.5">
                {strategy.key_messages.map((m, i) => (
                  <div
                    key={i}
                    className="text-xs text-[#A1A1B0] bg-[#13131A] px-2.5 py-1.5 rounded border border-[#30303B]/60 flex items-start gap-1.5"
                  >
                    <span className="text-[#7952FF] font-bold">•</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#717182]">Nenhuma mensagem-chave registrada.</p>
            )}
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A1A1B0]">
              <Target className="w-4 h-4 text-amber-400" />
              <span>CONCORRENTES MAPEADOS</span>
            </div>
            {strategy.competitors && strategy.competitors.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {strategy.competitors.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#13131A] text-xs text-[#A1A1B0] border border-[#30303B]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#717182]">Nenhum concorrente cadastrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Restrictions */}
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <span>RESTRIÇÕES DE COMUNICAÇÃO</span>
            </div>
            {strategy.restrictions && strategy.restrictions.length > 0 ? (
              <div className="space-y-1.5">
                {strategy.restrictions.map((r, i) => (
                  <div
                    key={i}
                    className="text-xs text-red-300 bg-red-500/10 px-2.5 py-1.5 rounded border border-red-500/20"
                  >
                    {r}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#717182]">Nenhuma restrição registrada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl bg-[#1C1C24] border-[#30303B] text-[#F8F9FC] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#F8F9FC]">
              Editar Diagnóstico Estratégico
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Objetivo Estratégico</label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Público-Alvo & ICP</label>
              <Textarea
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Tom de Voz</label>
              <Textarea
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Posicionamento de Marca</label>
              <Textarea
                value={brandPositioning}
                onChange={(e) => setBrandPositioning(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Data Início</label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-[#A1A1B0]">Data Fim</label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Channels */}
            <div className="space-y-1.5">
              <label className="font-medium text-[#A1A1B0]">Canais Ativos</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(SOCIAL_CHANNEL_CONFIG).map(([k, cfg]) => {
                  const sel = channels.includes(k)
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleChannel(k)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                        sel
                          ? 'bg-[#7952FF]/20 text-[#7952FF] border-[#7952FF]/40'
                          : 'bg-[#13131A] text-[#A1A1B0] border-[#30303B]'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={updateStrategy.isPending}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
