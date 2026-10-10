// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Editorial Generator Modal — 100% Deterministic Engine
// ============================================================

import React, { useState } from 'react'
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowRight,
  Loader2,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { generateEditorialSuggestions } from '@/features/strategy/services/editorialEngine'
import {
  useCreateEditorialItem,
  useCreateIdea,
} from '@/features/strategy/hooks/useStrategy'
import type { EditorialPillar, ContentIdea, EditorialSuggestion } from '@/types/strategy'
import { CONTENT_FORMAT_CONFIG } from '@/types/strategy'

interface EditorialGeneratorDialogProps {
  isOpen: boolean
  onClose: () => void
  agencyId: string
  strategyId: string
  pillars: EditorialPillar[]
  existingIdeas?: ContentIdea[]
}

export const EditorialGeneratorDialog: React.FC<EditorialGeneratorDialogProps> = ({
  isOpen,
  onClose,
  agencyId,
  strategyId,
  pillars,
  existingIdeas = [],
}) => {
  const createEditorial = useCreateEditorialItem(agencyId, strategyId)
  const createIdea = useCreateIdea(agencyId, strategyId)

  const [periodDays, setPeriodDays] = useState<number>(30)
  const [suggestions, setSuggestions] = useState<EditorialSuggestion[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [destination, setDestination] = useState<'calendar' | 'ideas'>('calendar')
  const [isImporting, setIsImporting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleGenerate = () => {
    if (pillars.length === 0) return
    const result = generateEditorialSuggestions(pillars, periodDays, existingIdeas)
    setSuggestions(result)
    // Select all by default
    setSelectedIndices(result.map((_, i) => i))
    setIsSuccess(false)
  }

  const toggleSelectAll = () => {
    if (selectedIndices.length === suggestions.length) {
      setSelectedIndices([])
    } else {
      setSelectedIndices(suggestions.map((_, i) => i))
    }
  }

  const toggleSelectOne = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx))
    } else {
      setSelectedIndices([...selectedIndices, idx])
    }
  }

  const handleImport = async () => {
    if (selectedIndices.length === 0) return

    setIsImporting(true)
    try {
      const itemsToImport = selectedIndices.map((i) => suggestions[i])

      for (const item of itemsToImport) {
        const topic = item.example_topics[0] || `Pauta de ${item.pillar_name}`

        if (destination === 'calendar') {
          await createEditorial.mutateAsync({
            pillar_id: item.pillar_id,
            title: `${topic} (${item.suggested_format.toUpperCase()})`,
            content_format: item.suggested_format,
            scheduled_date: item.suggested_date,
            scheduled_time: '10:00',
            description: `Gerado a partir do pilar ${item.pillar_name}. Tópicos relacionados: ${item.example_topics.join(', ')}`,
          })
        } else {
          await createIdea.mutateAsync({
            pillar_id: item.pillar_id,
            title: topic,
            content_format: item.suggested_format,
            description: `Sugestão gerada automaticamente com base nas diretrizes do pilar ${item.pillar_name}.`,
          })
        }
      }

      setIsSuccess(true)
      setTimeout(() => {
        onClose()
        setIsSuccess(false)
        setSuggestions([])
      }, 1200)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#1C1C24] border-[#30303B] text-[#F8F9FC] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#7952FF] mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">Editorial Engine</span>
          </div>
          <DialogTitle className="text-base font-semibold text-[#F8F9FC]">
            Gerador Determinístico de Grade Editorial
          </DialogTitle>
          <p className="text-xs text-[#A1A1B0] mt-0.5">
            Distribui pautas ao longo do período calculando frequência, peso percentual dos pilares e rotação de formatos.
          </p>
        </DialogHeader>

        {pillars.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#F8F9FC]">
              Pilares Editoriais Necessários
            </h4>
            <p className="text-xs text-[#A1A1B0] max-w-sm mx-auto">
              Para gerar sugestões editoriais automáticas, você precisa cadastrar ao menos 1 pilar editorial com porcentagem e frequência.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
            {/* Control Bar */}
            <div className="p-3 bg-[#13131A] rounded-xl border border-[#30303B] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#A1A1B0] font-medium">Período de Planejamento:</span>
                <select
                  className="h-8 rounded-md bg-[#1C1C24] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
                  value={periodDays}
                  onChange={(e) => setPeriodDays(Number(e.target.value))}
                >
                  <option value={15}>15 dias (Ciclo curto)</option>
                  <option value={30}>30 dias (Mensal)</option>
                  <option value={45}>45 dias (Quinzena + Mês)</option>
                  <option value={60}>60 dias (Bimestral)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerate}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{suggestions.length > 0 ? 'Regerar Sugestões' : 'Calcular e Gerar Grade'}</span>
                </Button>
              </div>
            </div>

            {/* Generated Suggestions List */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-1.5 text-[#A1A1B0] hover:text-[#F8F9FC]"
                    >
                      {selectedIndices.length === suggestions.length ? (
                        <CheckSquare className="w-4 h-4 text-[#7952FF]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#717182]" />
                      )}
                      <span>
                        Selecionar Todos ({selectedIndices.length}/{suggestions.length})
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[#A1A1B0]">Destino:</span>
                    <button
                      type="button"
                      onClick={() => setDestination('calendar')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        destination === 'calendar'
                          ? 'bg-[#7952FF] text-white'
                          : 'bg-[#13131A] text-[#A1A1B0] hover:text-[#F8F9FC]'
                      }`}
                    >
                      Calendário Editorial
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestination('ideas')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        destination === 'ideas'
                          ? 'bg-[#7952FF] text-white'
                          : 'bg-[#13131A] text-[#A1A1B0] hover:text-[#F8F9FC]'
                      }`}
                    >
                      Banco de Ideias
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {suggestions.map((sug, idx) => {
                    const isSelected = selectedIndices.includes(idx)
                    const formatCfg =
                      CONTENT_FORMAT_CONFIG[sug.suggested_format as keyof typeof CONTENT_FORMAT_CONFIG]

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleSelectOne(idx)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#7952FF]/5 border-[#7952FF]/40 shadow-sm'
                            : 'bg-[#13131A]/60 border-[#30303B]/60 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#7952FF]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#717182]" />
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: sug.pillar_color }}
                              />
                              <span className="font-semibold text-[#F8F9FC]">
                                {sug.pillar_name}
                              </span>
                              <span className="text-[#30303B]">|</span>
                              <span className="px-1.5 py-0.2 rounded bg-[#1C1C24] text-[#A1A1B0] text-[10px] border border-[#30303B]">
                                {formatCfg ? formatCfg.label : sug.suggested_format}
                              </span>
                            </div>

                            <span className="text-[11px] text-[#A1A1B0] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#7952FF]" />
                              {sug.suggested_date}
                            </span>
                          </div>

                          <p className="text-xs text-[#A1A1B0]">
                            {sug.example_topics[0] || 'Conteúdo sugerido para o pilar'}
                          </p>

                          {sug.example_topics.length > 1 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {sug.example_topics.slice(1, 3).map((t, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] text-[#717182] bg-[#1C1C24] px-1.5 py-0.2 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-2 border-t border-[#30303B] pt-3 flex justify-between items-center">
          <div className="text-[11px] text-[#717182]">
            Algoritmo determinístico baseado em pesos & frequências.
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Fechar
            </Button>
            {suggestions.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleImport}
                disabled={selectedIndices.length === 0 || isImporting}
                className="gap-1.5"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Importado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <span>Importar {selectedIndices.length} Sugestões</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
