// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO — MAIN DASHBOARD
// Route: /strategy
// ============================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  Plus,
  Search,
  Target,
  Layers,
  Lightbulb,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Sparkles,
  Eye,
  ChevronRight,
  CheckCircle2,
  Clock,
  Pause,
  Archive,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useStrategies } from './hooks/useStrategy'
import { STRATEGY_STATUS_CONFIG, type StrategyStatus } from '@/types/strategy'

const DEMO_AGENCY_ID = 'demo-agency'

export const StrategyPage: React.FC = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StrategyStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: strategies = [], isLoading, isError } = useStrategies(DEMO_AGENCY_ID, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined,
  })

  // KPIs
  const totalActive = strategies.filter((s) => s.status === 'active').length
  const totalDraft = strategies.filter((s) => s.status === 'draft').length
  const totalIdeas = strategies.reduce((sum, s) => sum + (s.ideas_count ?? 0), 0)
  const totalEditorial = strategies.reduce((sum, s) => sum + (s.editorial_items_count ?? 0), 0)

  const statusIcon = (status: StrategyStatus) => {
    switch (status) {
      case 'active': return <TrendingUp className="w-3 h-3" />
      case 'draft': return <Clock className="w-3 h-3" />
      case 'paused': return <Pause className="w-3 h-3" />
      case 'completed': return <CheckCircle2 className="w-3 h-3" />
      case 'archived': return <Archive className="w-3 h-3" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Strategy Studio"
        subtitle="Planejamento estratégico, pilares editoriais e calendário de conteúdo."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Estratégia' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/strategy/new')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Estratégia</span>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#A1A1B0]">
              <span>Estratégias Ativas</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <div className="text-2xl font-bold text-[#F8F9FC]">{totalActive}</div>
            <div className="text-[10px] text-[#717182]">Em execução agora</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#A1A1B0]">
              <span>Em Rascunho</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{totalDraft}</div>
            <div className="text-[10px] text-[#717182]">Aguardando finalização</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#A1A1B0]">
              <span>Ideias no Banco</span>
              <Lightbulb className="w-3.5 h-3.5 text-[#7952FF]" />
            </div>
            <div className="text-2xl font-bold text-[#7952FF]">{totalIdeas}</div>
            <div className="text-[10px] text-[#717182]">Conteúdos planejados</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#A1A1B0]">
              <span>Pautas Criadas</span>
              <CalendarDays className="w-3.5 h-3.5 text-[#3B82F6]" />
            </div>
            <div className="text-2xl font-bold text-[#3B82F6]">{totalEditorial}</div>
            <div className="text-[10px] text-[#717182]">Itens no calendário editorial</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#717182] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="pl-9">
              <Input
                placeholder="Buscar estratégia por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-[#7952FF] text-white'
                  : 'bg-[#1C1C24] text-[#A1A1B0] hover:text-[#F8F9FC]'
              }`}
            >
              Todas ({strategies.length})
            </button>
            {(Object.keys(STRATEGY_STATUS_CONFIG) as StrategyStatus[]).map((stKey) => {
              const cfg = STRATEGY_STATUS_CONFIG[stKey]
              const count = strategies.filter((s) => s.status === stKey).length
              if (count === 0 && statusFilter !== stKey) return null
              return (
                <button
                  key={stKey}
                  onClick={() => setStatusFilter(stKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    statusFilter === stKey
                      ? 'bg-[#7952FF] text-white'
                      : 'bg-[#1C1C24] text-[#A1A1B0] hover:text-[#F8F9FC]'
                  }`}
                >
                  {cfg.label} ({count})
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center text-xs text-red-400">
            Erro ao carregar lista de estratégias.
          </CardContent>
        </Card>
      ) : strategies.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nenhuma estratégia criada"
          subtitle="Planejamento de Conteúdo & Calendário Editorial"
          description="Crie estratégias de conteúdo completas com pilares editoriais, banco de ideias e calendário automatizado. Vincule briefings de clientes para pré-preencher diagnósticos."
          statusBadge="Strategy Studio Ativo"
          features={[
            'Pilares editoriais com distribuição percentual de conteúdo',
            'Banco de ideias classificadas por pilar e formato',
            'Motor editorial determinístico para sugestões de pautas',
            'Integração com Briefing Studio para diagnóstico automatizado',
          ]}
          actionLabel="Criar Primeira Estratégia"
          onAction={() => navigate('/strategy/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strategy) => {
            const statusCfg = STRATEGY_STATUS_CONFIG[strategy.status]
            const pillars = strategy.pillars ?? []
            const totalPillarPct = pillars.reduce((sum, p) => sum + (p.percentage || 0), 0)

            return (
              <Card
                key={strategy.id}
                className="group hover:border-[#7952FF]/40 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/strategy/${strategy.id}`)}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#F8F9FC] group-hover:text-[#7952FF] transition-colors truncate">
                        {strategy.name}
                      </h3>
                      {strategy.description && (
                        <p className="text-[11px] text-[#717182] line-clamp-2">
                          {strategy.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant={statusCfg.badgeVariant}>
                        {statusIcon(strategy.status)}
                        <span className="ml-1">{statusCfg.label}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Client & Period */}
                  <div className="flex items-center gap-3 text-[10px] text-[#717182]">
                    {strategy.client && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-[#7952FF]" />
                        {strategy.client.name}
                      </span>
                    )}
                    {strategy.period_start && strategy.period_end && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(strategy.period_start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        {' — '}
                        {new Date(strategy.period_end).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>

                  {/* Channels */}
                  {strategy.channels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {strategy.channels.map((ch) => (
                        <span
                          key={ch}
                          className="px-2 py-0.5 rounded-md bg-[#1C1C24] text-[10px] text-[#A1A1B0] font-medium capitalize"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pillars Preview */}
                  {pillars.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-[#717182] font-medium uppercase tracking-wider">
                        Pilares Editoriais ({pillars.length})
                      </div>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-[#1C1C24]">
                        {pillars.map((p) => (
                          <div
                            key={p.id}
                            className="h-full rounded-full transition-all"
                            style={{
                              backgroundColor: p.color,
                              width: `${totalPillarPct > 0 ? (p.percentage / totalPillarPct) * 100 : 100 / pillars.length}%`,
                            }}
                            title={`${p.name}: ${p.percentage}%`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pillars.map((p) => (
                          <span
                            key={p.id}
                            className="flex items-center gap-1 text-[10px] text-[#A1A1B0]"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: p.color }}
                            />
                            {p.name} ({p.percentage}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#30303B]/50">
                    <div className="flex items-center gap-4 text-[10px] text-[#717182]">
                      <span className="flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-[#7952FF]" />
                        {strategy.ideas_count ?? 0} ideias
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-[#3B82F6]" />
                        {strategy.editorial_items_count ?? 0} pautas
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                        {strategy.published_count ?? 0} publicadas
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#717182] group-hover:text-[#7952FF] transition-colors" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
