import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Strategy Workspace Detail Page (/strategy/:strategyId)
// ============================================================

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Lightbulb,
  Calendar,
  FileText,
  Printer,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Target,
  Send,
  Building,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates'
import {
  useStrategy,
  usePillars,
  useContentIdeas,
  useEditorialItems,
  useUpdateStrategy,
} from '@/features/strategy/hooks/useStrategy'
import { PillarsTab } from '@/features/strategy/components/PillarsTab'
import { IdeasBankTab } from '@/features/strategy/components/IdeasBankTab'
import { EditorialCalendarTab } from '@/features/strategy/components/EditorialCalendarTab'
import { StrategyOverviewTab } from '@/features/strategy/components/StrategyOverviewTab'
import { EditorialGeneratorDialog } from '@/features/strategy/components/EditorialGeneratorDialog'
import { BriefingSyncDialog } from '@/features/strategy/components/BriefingSyncDialog'
import type { StrategyStatus, ContentIdea } from '@/types/strategy'
import { STRATEGY_STATUS_CONFIG } from '@/types/strategy'

const DEMO_AGENCY_ID = 'demo-agency'

export const StrategyWorkspacePage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()

  const { strategyId } = useParams<{ strategyId: string }>()
  const navigate = useNavigate()

  const { data: strategy, isLoading: isLoadingStrategy, error: strategyError } = useStrategy(strategyId)
  const { data: pillars = [], isLoading: isLoadingPillars } = usePillars(strategyId)
  const { data: ideas = [], isLoading: isLoadingIdeas } = useContentIdeas(strategyId)
  const { data: editorialItems = [], isLoading: isLoadingEditorial } = useEditorialItems(strategyId)

  const updateStrategy = useUpdateStrategy(DEMO_AGENCY_ID, strategyId || '')

  const [activeTab, setActiveTab] = useState<'overview' | 'pillars' | 'ideas' | 'editorial'>('overview')
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [isBriefingSyncOpen, setIsBriefingSyncOpen] = useState(false)
  const [prefillIdea, setPrefillIdea] = useState<ContentIdea | null>(null)

  if (isLoadingStrategy) {
    return <LoadingState message="Carregando dados da estratégia de conteúdo..." />
  }

  if (strategyError || !strategy) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="secondary" size="sm" onClick={() => navigate('/strategy')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Estratégias</span>
        </Button>
        <ErrorState
          title="Estratégia não encontrada"
          message="O registro estratégico solicitado não foi localizado ou você não possui permissão de acesso."
          onRetry={() => navigate('/strategy')}
        />
      </div>
    )
  }

  const statusConfig = STRATEGY_STATUS_CONFIG[strategy.status] || STRATEGY_STATUS_CONFIG.draft
  const publishedItemsCount = editorialItems.filter((i) => i.status === 'published').length
  const scheduledItemsCount = editorialItems.filter((i) => i.status === 'scheduled').length
  const approvedIdeasCount = ideas.filter((i) => i.status === 'approved').length

  const handleStatusChange = async (newStatus: StrategyStatus) => {
    await updateStrategy.mutateAsync({ status: newStatus })
  }

  const handleConvertToEditorialItem = (idea: ContentIdea) => {
    setPrefillIdea(idea)
    setActiveTab('editorial')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30303B] pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/strategy')}
            className="h-8 w-8 p-0"
            title="Voltar para Estratégias"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#F8F9FC] tracking-tight">{strategy.name}</h1>
              {strategy.client && (
                <span className="text-xs text-[#A1A1B0] flex items-center gap-1">
                  <Building className="w-3 h-3 text-[#7952FF]" />
                  {strategy.client.name}
                </span>
              )}
            </div>
            {strategy.description && (
              <p className="text-xs text-[#A1A1B0] line-clamp-1 mt-0.5">{strategy.description}</p>
            )}
          </div>
        </div>

        {/* Actions & Status Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <select
            className="h-8 rounded-lg bg-[#1C1C24] border border-[#30303B] px-2.5 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#7952FF]"
            value={strategy.status}
            onChange={(e) => handleStatusChange(e.target.value as StrategyStatus)}
          >
            <option value="draft">Rascunho</option>
            <option value="active">Ativa</option>
            <option value="paused">Pausada</option>
            <option value="completed">Concluída</option>
            <option value="archived">Arquivada</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGeneratorOpen(true)}
            className="gap-1.5 h-8 text-xs text-[#7952FF] border-[#7952FF]/30 hover:bg-[#7952FF]/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerador Editorial</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 h-8 text-xs text-[#A1A1B0] hover:text-[#F8F9FC]"
            title="Imprimir ou exportar resumo em PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar / Imprimir</span>
          </Button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#7952FF]/15 text-[#7952FF] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#717182] block tracking-wider">
                Pilares
              </span>
              <span className="text-base font-bold text-[#F8F9FC]">{pillars.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#717182] block tracking-wider">
                Ideias no Banco
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-[#F8F9FC]">{ideas.length}</span>
                <span className="text-[10px] text-emerald-400">({approvedIdeasCount} aprovadas)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#717182] block tracking-wider">
                Pautas Agendadas
              </span>
              <span className="text-base font-bold text-[#F8F9FC]">{editorialItems.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#717182] block tracking-wider">
                Publicadas
              </span>
              <span className="text-base font-bold text-[#F8F9FC]">{publishedItemsCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="bg-[#1C1C24] border border-[#30303B] p-1 rounded-xl flex gap-1 w-full max-w-xl">
          <TabsTrigger
            value="overview"
            className="flex-1 text-xs py-2 data-[state=active]:bg-[#7952FF] data-[state=active]:text-white"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="pillars"
            className="flex-1 text-xs py-2 data-[state=active]:bg-[#7952FF] data-[state=active]:text-white"
          >
            Pilares ({pillars.length})
          </TabsTrigger>
          <TabsTrigger
            value="ideas"
            className="flex-1 text-xs py-2 data-[state=active]:bg-[#7952FF] data-[state=active]:text-white"
          >
            Banco de Ideias ({ideas.length})
          </TabsTrigger>
          <TabsTrigger
            value="editorial"
            className="flex-1 text-xs py-2 data-[state=active]:bg-[#7952FF] data-[state=active]:text-white"
          >
            Calendário & Pautas ({editorialItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-6">
          <StrategyOverviewTab
            agencyId={DEMO_AGENCY_ID}
            strategy={strategy}
            pillars={pillars}
            onOpenBriefingSync={() => setIsBriefingSyncOpen(true)}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
          />
        </TabsContent>

        {/* Tab 2: Pillars */}
        <TabsContent value="pillars" className="mt-6">
          <PillarsTab
            agencyId={DEMO_AGENCY_ID}
            strategyId={strategy.id}
            pillars={pillars}
            isLoading={isLoadingPillars}
          />
        </TabsContent>

        {/* Tab 3: Ideas */}
        <TabsContent value="ideas" className="mt-6">
          <IdeasBankTab
            agencyId={DEMO_AGENCY_ID}
            strategyId={strategy.id}
            ideas={ideas}
            pillars={pillars}
            channels={strategy.channels || []}
            onConvertToEditorialItem={handleConvertToEditorialItem}
          />
        </TabsContent>

        {/* Tab 4: Editorial Calendar */}
        <TabsContent value="editorial" className="mt-6">
          <EditorialCalendarTab
            agencyId={DEMO_AGENCY_ID}
            strategyId={strategy.id}
            items={editorialItems}
            pillars={pillars}
            channels={strategy.channels || []}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
            prefillIdea={prefillIdea}
            onClearPrefill={() => setPrefillIdea(null)}
          />
        </TabsContent>
      </Tabs>

      {/* Editorial Generator Dialog */}
      <EditorialGeneratorDialog
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        agencyId={DEMO_AGENCY_ID}
        strategyId={strategy.id}
        pillars={pillars}
        existingIdeas={ideas}
      />

      {/* Briefing Sync Dialog */}
      <BriefingSyncDialog
        isOpen={isBriefingSyncOpen}
        onClose={() => setIsBriefingSyncOpen(false)}
        agencyId={DEMO_AGENCY_ID}
        strategy={strategy}
      />
    </div>
  )
}
export default StrategyWorkspacePage
