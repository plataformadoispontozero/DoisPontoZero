// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Briefing Sync & Intelligence Modal — 100% Deterministic Mapping
// ============================================================

import React, { useState } from 'react'
import {
  Sparkles,
  FileText,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  Layers,
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
import { useBriefings } from '@/features/briefing/hooks/useBriefings'
import {
  extractStrategyFromBriefing,
  calculateBriefingCoverage,
} from '@/features/strategy/services/briefingIntelligence'
import { useUpdateStrategy } from '@/features/strategy/hooks/useStrategy'
import type { ContentStrategy } from '@/types/strategy'
import type { Briefing, BriefingQuestion } from '@/types/briefing'

interface BriefingSyncDialogProps {
  isOpen: boolean
  onClose: () => void
  agencyId: string
  strategy: ContentStrategy
}

export const BriefingSyncDialog: React.FC<BriefingSyncDialogProps> = ({
  isOpen,
  onClose,
  agencyId,
  strategy,
}) => {
  const { data: briefings = [], isLoading: isLoadingBriefings } = useBriefings(agencyId)
  const updateStrategy = useUpdateStrategy(agencyId, strategy.id)

  const [selectedBriefingId, setSelectedBriefingId] = useState<string>('')
  const [extractedData, setExtractedData] = useState<any | null>(null)
  const [coverage, setCoverage] = useState<{ score: number; mappedFields: string[]; unmappedKeys: string[] } | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const selectedBriefing = briefings.find((b: Briefing) => b.id === selectedBriefingId)

  const handleSelectBriefing = (bId: string) => {
    setSelectedBriefingId(bId)
    const b = briefings.find((item: Briefing) => item.id === bId)
    if (!b) {
      setExtractedData(null)
      setCoverage(null)
      return
    }

    const answers = b.answers || []
    const questions: BriefingQuestion[] =
      b.template?.questions ||
      b.template?.sections?.flatMap((s) => s.questions || []) ||
      []
    const extracted = extractStrategyFromBriefing(answers, questions)
    const cov = calculateBriefingCoverage(questions)

    setExtractedData(extracted)
    setCoverage(cov)
  }

  const handleApply = async () => {
    if (!extractedData) return

    setIsApplying(true)
    try {
      await updateStrategy.mutateAsync({
        briefing_id: selectedBriefingId,
        objective: extractedData.objective || strategy.objective,
        target_audience: extractedData.target_audience || strategy.target_audience,
        tone_of_voice: extractedData.tone_of_voice || strategy.tone_of_voice,
        brand_positioning: extractedData.brand_positioning || strategy.brand_positioning,
        channels: extractedData.channels && extractedData.channels.length > 0 ? extractedData.channels : strategy.channels,
        competitors: extractedData.competitors && extractedData.competitors.length > 0 ? extractedData.competitors : strategy.competitors,
        key_messages: extractedData.key_messages && extractedData.key_messages.length > 0 ? extractedData.key_messages : strategy.key_messages,
        restrictions: extractedData.restrictions && extractedData.restrictions.length > 0 ? extractedData.restrictions : strategy.restrictions,
      })

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
      }, 1000)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-[#1C1C24] border-[#30303B] text-[#F8F9FC] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#7952FF] mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">Briefing Intelligence</span>
          </div>
          <DialogTitle className="text-base font-semibold text-[#F8F9FC]">
            Sincronizar Dados do Briefing
          </DialogTitle>
          <p className="text-xs text-[#A1A1B0] mt-0.5">
            Mapeia deterministicamente respostas de briefings aprovados diretamente para os campos da estratégia.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1 text-xs">
          {/* Select Briefing */}
          <div className="space-y-1.5">
            <label className="font-medium text-[#A1A1B0]">Selecione o Briefing de Origem</label>
            <select
              className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-3 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
              value={selectedBriefingId}
              onChange={(e) => handleSelectBriefing(e.target.value)}
            >
              <option value="">Selecione um briefing respondido...</option>
              {briefings.map((b: Briefing) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.answers?.length || 0} respostas)
                </option>
              ))}
            </select>
          </div>

          {/* Extracted Preview */}
          {selectedBriefing && coverage && extractedData && (
            <div className="space-y-3 pt-2">
              {/* Coverage KPI */}
              <div className="p-3 bg-[#13131A] rounded-lg border border-[#30303B] flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#F8F9FC] text-xs">
                    Cobertura de Dados Estratégicos
                  </h4>
                  <p className="text-[11px] text-[#A1A1B0]">
                    {coverage.mappedFields.length} campos estratégicos mapeados
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-[#7952FF]">
                    {coverage.score}%
                  </span>
                </div>
              </div>

              {/* Preview extracted fields */}
              <div className="space-y-2 border border-[#30303B] rounded-lg p-3 bg-[#13131A]/60">
                <h5 className="font-semibold text-[#F8F9FC] text-xs mb-2">
                  Campos Mapeados Prontos para Sincronização:
                </h5>

                {extractedData.objective && (
                  <div className="text-xs">
                    <span className="text-[#717182] font-semibold block">Objetivo:</span>
                    <span className="text-[#A1A1B0]">{extractedData.objective}</span>
                  </div>
                )}

                {extractedData.target_audience && (
                  <div className="text-xs">
                    <span className="text-[#717182] font-semibold block">Público-Alvo:</span>
                    <span className="text-[#A1A1B0]">{extractedData.target_audience}</span>
                  </div>
                )}

                {extractedData.tone_of_voice && (
                  <div className="text-xs">
                    <span className="text-[#717182] font-semibold block">Tom de Voz:</span>
                    <span className="text-[#A1A1B0]">{extractedData.tone_of_voice}</span>
                  </div>
                )}

                {extractedData.brand_positioning && (
                  <div className="text-xs">
                    <span className="text-[#717182] font-semibold block">Posicionamento:</span>
                    <span className="text-[#A1A1B0]">{extractedData.brand_positioning}</span>
                  </div>
                )}

                {extractedData.channels && extractedData.channels.length > 0 && (
                  <div className="text-xs">
                    <span className="text-[#717182] font-semibold block">Canais Identificados:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {extractedData.channels.map((c: string) => (
                        <span key={c} className="px-1.5 py-0.2 rounded bg-[#1C1C24] text-[#A1A1B0] text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedBriefing && (
            <div className="py-6 text-center text-xs text-[#717182]">
              Selecione um briefing acima para visualizar o mapeamento automático de respostas.
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 border-t border-[#30303B] pt-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            disabled={!extractedData || isApplying}
            className="gap-1.5"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Aplicando...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sincronizado!</span>
              </>
            ) : (
              <>
                <span>Sincronizar com a Estratégia</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
