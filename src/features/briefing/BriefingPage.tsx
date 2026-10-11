import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: BRIEFING STUDIO — MAIN DASHBOARD
// Route: /briefings
// ============================================================

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Layers,
  Search,
  Filter,
  Share2,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  ChevronRight,
  Send,
  Eye,
  Check,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useBriefings, useCreatePublicLink } from './hooks/useBriefings'
import { BRIEFING_STATUS_CONFIG, type BriefingStatus } from '@/types/briefing'
import { toast } from '@/components/ui/Toast'

const DEMO_AGENCY_ID = 'demo-agency'

export const BriefingPage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()

  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<BriefingStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: briefings = [], isLoading, isError } = useBriefings(DEMO_AGENCY_ID, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined,
  })

  // Real KPIs computed from data
  const totalActive = briefings.filter((b) => b.status !== 'archived').length
  const waitingResponse = briefings.filter((b) => b.status === 'sent' || b.status === 'in_progress').length
  const received = briefings.filter((b) => b.status === 'submitted').length
  const underReview = briefings.filter((b) => b.status === 'under_review').length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Briefing Studio"
        subtitle="Transforme informações em projetos criativos bem estruturados."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Briefings' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/briefings/templates">
              <Button variant="secondary" size="sm">
                <Layers className="w-3.5 h-3.5" />
                <span>Gerenciar Modelos</span>
              </Button>
            </Link>
            <Link to="/briefings/new">
              <Button variant="primary" size="sm">
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Briefing</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Real KPIs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#B8B8C0]">
              <span>Briefings Ativos</span>
              <FileText className="w-3.5 h-3.5 text-[#C74410]" />
            </div>
            <div className="text-2xl font-bold text-[#F8F9FC]">{totalActive}</div>
            <div className="text-[10px] text-[#98989F]">Total em acompanhamento</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#B8B8C0]">
              <span>Aguardando Resposta</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{waitingResponse}</div>
            <div className="text-[10px] text-[#98989F]">Com link enviado ao cliente</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#B8B8C0]">
              <span>Recebidos</span>
              <Send className="w-3.5 h-3.5 text-[#C74410]" />
            </div>
            <div className="text-2xl font-bold text-[#C74410]">{received}</div>
            <div className="text-[10px] text-[#98989F]">Prontos para análise criativa</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#B8B8C0]">
              <span>Em Análise</span>
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <div className="text-2xl font-bold text-[#10B981]">{underReview}</div>
            <div className="text-[10px] text-[#98989F]">Em revisão estratégica</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#98989F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="pl-9">
              <Input
                placeholder="Buscar por título ou cliente..."
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
                  ? 'bg-[#C74410] text-white'
                  : 'bg-[#1C1C24] text-[#B8B8C0] hover:text-[#F8F9FC]'
              }`}
            >
              Todos ({briefings.length})
            </button>
            {(Object.keys(BRIEFING_STATUS_CONFIG) as BriefingStatus[]).map((stKey) => {
              const cfg = BRIEFING_STATUS_CONFIG[stKey]
              const count = briefings.filter((b) => b.status === stKey).length
              if (count === 0 && statusFilter !== stKey) return null
              return (
                <button
                  key={stKey}
                  onClick={() => setStatusFilter(stKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    statusFilter === stKey
                      ? 'bg-[#C74410] text-white'
                      : 'bg-[#1C1C24] text-[#B8B8C0] hover:text-[#F8F9FC]'
                  }`}
                >
                  {cfg.label} ({count})
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Briefings Table / Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#1C1C24] border border-[#30303B] p-4 flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center text-xs text-red-400">
            Erro ao carregar lista de briefings.
          </CardContent>
        </Card>
      ) : briefings.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum briefing cadastrado"
          subtitle="Entrada Padronizada de Demandas Criativas"
          description="Crie briefings vinculados aos seus clientes a partir dos modelos oficiais. Gere links de preenchimento protegidos e exporte PDFs profissionais."
          statusBadge="Briefing Studio Ativo"
          features={[
            'Formulários inteligentes com validação automática de campos',
            'Links públicos mobile-first com token seguro sem expor UUIDs',
            'Exportação em PDF profissional com logotipo e marca-d’água',
            'Versionamento imutável de respostas para auditoria',
          ]}
          actionLabel="Criar Primeiro Briefing"
          onAction={() => navigate('/briefings/new')}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C1C24] text-[#B8B8C0] border-b border-[#30303B]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Briefing / Título</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Modelo</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Envio</th>
                  <th className="py-3 px-4 font-semibold">Última Atualização</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30303B]/60 text-[#F8F9FC]">
                {briefings.map((b) => {
                  const statusCfg = BRIEFING_STATUS_CONFIG[b.status] || {
                    label: b.status,
                    badgeVariant: 'outline' as const,
                  }

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-[#1C1C24]/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/briefings/${b.id}/responses`)}
                    >
                      <td className="py-3 px-4 font-bold text-[#F8F9FC] group-hover:text-[#C74410] transition-colors">
                        {b.title}
                      </td>
                      <td className="py-3 px-4 text-[#B8B8C0]">
                        {b.client?.name || 'Cliente Geral'}
                      </td>
                      <td className="py-3 px-4 text-[#C74410] font-medium">
                        {b.template?.name || 'Personalizado'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusCfg.badgeVariant}>
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#98989F]">
                        {new Date(b.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-[#98989F]">
                        {new Date(b.updated_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/briefings/${b.id}/responses`)}
                            title="Ver Respostas"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/briefings/${b.id}/export`)}
                            title="Gerar PDF"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#C74410]" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
