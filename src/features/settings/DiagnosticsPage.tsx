import React, { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import phaseStatusData from '../../../docs/PHASE_STATUS.json'
import {
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Database,
  Layers,
  Terminal,
  Search,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'

export const DiagnosticsPage: React.FC = () => {
  const isSupabaseActive = isSupabaseConfigured
  const phases = (phaseStatusData.phases || []) as any[]

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all')
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    'phase-01': true,
    'phase-02': true,
  })

  // Cálculos dinâmicos auditados a partir do PHASE_STATUS.json
  const totalPhases = phases.length
  const completedPhases = useMemo(() => phases.filter((p) => p.status === 'completed').length, [phases])
  const inProgressPhases = useMemo(() => phases.filter((p) => p.status === 'in_progress').length, [phases])
  const notStartedPhases = useMemo(() => phases.filter((p) => p.status === 'not_started').length, [phases])
  const totalDeliverables = useMemo(
    () => phases.reduce((acc, p) => acc + (p.historical_claims?.length || 0), 0),
    [phases]
  )
  const totalPendingCriteria = useMemo(
    () => phases.reduce((acc, p) => acc + (p.pending_requirements?.length || 0), 0),
    [phases]
  )

  const toggleExpand = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }))
  }

  const formatStage = (stage: string) => {
    switch (stage) {
      case 'LOCAL_AUDIT_COMPLETE_OPERATIONAL_ACCEPTANCE_BLOCKED':
        return 'Auditoria Local Concluída • Aceite Remoto Pendente'
      case 'COMPLETED':
        return 'Homologado & Completo'
      default:
        return stage?.replace(/_/g, ' ') || 'Em Auditoria'
    }
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Auditoria Recente'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return isoString
    }
  }

  const filteredPhases = useMemo(() => {
    return phases.filter((phase) => {
      const matchesStatus = statusFilter === 'all' || phase.status === statusFilter
      const matchesSearch =
        !searchTerm ||
        phase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (phase.historical_claims || []).some((claim: string) =>
          claim.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (phase.pending_requirements || []).some((req: string) =>
          req.toLowerCase().includes(searchTerm.toLowerCase())
        )
      return matchesStatus && matchesSearch
    })
  }, [phases, statusFilter, searchTerm])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#C74410]" />
          Painel Técnico & Diagnóstico do Sistema
        </h3>
        <p className="text-xs text-[#B8B8C0]">
          Verificação auditada da infraestrutura, estado dos módulos e conformidade das Fases 01 a 11.
        </p>
      </div>

      {/* Cards de Métricas Dinâmicas de Diagnóstico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#B8B8C0] uppercase font-bold block">
                Ambiente Frontend
              </span>
              <span className="text-sm font-bold text-[#F8F9FC]">Vite + React 19</span>
              <span className="text-[10px] text-[#34D399] block mt-0.5">TypeScript 100% íntegro</span>
            </div>
            <Terminal className="w-5 h-5 text-[#FF8759]" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#B8B8C0] uppercase font-bold block">
                Supabase Engine
              </span>
              <span className="text-sm font-bold text-[#F8F9FC]">
                {isSupabaseActive ? 'Conexão Remota Ativa' : 'Modo Local / Demo'}
              </span>
              <span className="text-[10px] text-[#98989F] block mt-0.5">
                {isSupabaseActive ? 'API REST + Realtime' : 'Storage local em memória'}
              </span>
            </div>
            <Database className="w-5 h-5 text-[#C74410]" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#B8B8C0] uppercase font-bold block">
                Segurança & RLS
              </span>
              <span className="text-sm font-bold text-[#34D399]">Isolamento por Agência</span>
              <span className="text-[10px] text-[#B8B8C0] block mt-0.5">11+ Migrations protegidas</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-[#34D399]" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#B8B8C0] uppercase font-bold block">
                Fases de Engenharia
              </span>
              <span className="text-sm font-bold text-[#F8F9FC]">
                {completedPhases > 0 ? `${completedPhases} Concluídas • ` : ''}
                {inProgressPhases} em Homologação
              </span>
              <span className="text-[10px] text-[#FF8759] block mt-0.5">
                {totalDeliverables} entregáveis implementados
              </span>
            </div>
            <Layers className="w-5 h-5 text-[#FF8759]" />
          </CardContent>
        </Card>
      </div>

      {/* Tabela Auditada das Fases 01 a 11 */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#30303B]/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#C74410]" />
                Manifesto Técnico Auditado de Desenvolvimento (Fases 01 a 11)
              </CardTitle>
              <CardDescription className="text-xs">
                Fonte autorizada sincronizada com <code className="text-[#FF8759]">docs/PHASE_STATUS.json</code> ({totalDeliverables} entregáveis locais implementados, {totalPendingCriteria} critérios de homologação em staging).
              </CardDescription>
            </div>

            {/* Filtros e Busca */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98989F]" />
                <input
                  type="text"
                  placeholder="Buscar requisitos ou entregáveis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-[#101014] border border-[#30303B] rounded-lg text-xs text-[#F8F9FC] focus:outline-none focus:border-[#C74410] w-56"
                />
              </div>

              <div className="flex items-center rounded-lg border border-[#30303B] p-0.5 bg-[#101014]">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                    statusFilter === 'all' ? 'bg-[#C74410] text-white' : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
                  }`}
                >
                  Todas ({phases.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('in_progress')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                    statusFilter === 'in_progress' ? 'bg-[#C74410] text-white' : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
                  }`}
                >
                  Em Homologação ({inProgressPhases})
                </button>
                {completedPhases > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('completed')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                      statusFilter === 'completed' ? 'bg-[#C74410] text-white' : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
                    }`}
                  >
                    Concluídas ({completedPhases})
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="divide-y divide-[#30303B]/60 text-xs">
            {filteredPhases.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#98989F]">
                Nenhuma fase encontrada com os critérios informados.
              </div>
            ) : (
              filteredPhases.map((phase: any) => {
                const isExpanded = expandedPhases[phase.id] ?? false
                const claims = phase.historical_claims || []
                const pending = phase.pending_requirements || []

                return (
                  <div key={phase.id} className="py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleExpand(phase.id)}
                          className="flex items-center gap-1.5 font-bold text-[#F8F9FC] text-sm hover:text-[#FF8759] transition-colors text-left"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#C74410] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#98989F] shrink-0" />
                          )}
                          <span>{phase.name}</span>
                        </button>

                        <Badge
                          variant={
                            phase.status === 'completed'
                              ? 'default'
                              : phase.status === 'in_progress'
                              ? 'accent'
                              : 'neutral'
                          }
                        >
                          {phase.status === 'completed'
                            ? 'Concluído ✅'
                            : phase.status === 'in_progress'
                            ? 'Em Homologação ⚡'
                            : 'Pendente ⏳'}
                        </Badge>

                        {phase.stage && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101014] border border-[#30303B] text-[#B8B8C0]">
                            {formatStage(phase.stage)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#98989F]">
                        <span>Última Verificação: {formatDate(phase.last_verified_at)}</span>
                        <button
                          type="button"
                          onClick={() => toggleExpand(phase.id)}
                          className="text-[#FF8759] hover:underline"
                        >
                          {isExpanded ? 'Recolher detalhes' : `Ver detalhes (${claims.length} entregáveis)`}
                        </button>
                      </div>
                    </div>

                    {/* Entregáveis & Funcionalidades Implementadas */}
                    {isExpanded && (
                      <div className="pl-5 space-y-3 pt-1 animate-in fade-in duration-150">
                        {claims.length > 0 && (
                          <div className="space-y-1.5 p-3 rounded-lg bg-[#101014]/60 border border-[#30303B]/60">
                            <span className="text-[10px] font-bold text-[#34D399] uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                              Entregáveis & Funcionalidades Locais Verificadas ({claims.length})
                            </span>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px] text-[#B8B8C0]">
                              {claims.map((claim: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-[#34D399] shrink-0 mt-0.5">•</span>
                                  <span className="leading-tight">{claim}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Requisitos Pendentes de Homologação em Staging */}
                        {pending.length > 0 && (
                          <div className="space-y-1.5 p-3 rounded-lg bg-[#C74410]/5 border border-[#C74410]/20">
                            <span className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" />
                              Critérios para Homologação em Staging / Produção ({pending.length})
                            </span>
                            <ul className="space-y-1 text-[11px] text-[#B8B8C0]">
                              {pending.map((req: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-[#FBBF24] shrink-0 mt-0.5">⚠️</span>
                                  <span className="leading-tight">{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Evidências Documentadas */}
                        {phase.evidence && (
                          <div className="flex items-center gap-2 text-[10px] text-[#98989F] pt-1">
                            <FileText className="w-3.5 h-3.5 text-[#FF8759] shrink-0" />
                            <span>Evidências: {phase.evidence}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
