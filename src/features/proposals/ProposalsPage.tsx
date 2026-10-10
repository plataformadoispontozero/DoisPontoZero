// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL STUDIO HOME & DASHBOARD
// List, search, filter and management of commercial proposals
// ============================================================

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  FileCheck2,
  Layers,
  Sparkles,
  ExternalLink,
  Eye,
  Edit3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Archive,
  Download,
  LayoutGrid,
  List as ListIcon,
  ShoppingBag,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useProposals } from './hooks/useProposals'
import { formatCurrencyCents } from './services/pricingEngine'
import type { ProposalStatus } from '@/types/proposals'

export const ProposalsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: proposals = [], isLoading } = useProposals()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Real KPIs computed from real proposal data
  const totalCount = proposals.length
  const draftCount = proposals.filter((p) => p.status === 'draft' || p.status === 'internal_review').length
  const publishedCount = proposals.filter((p) => p.status === 'published' || p.status === 'viewed' || p.status === 'negotiation').length
  const acceptedCount = proposals.filter((p) => p.status === 'accepted').length

  const filteredProposals = proposals.filter((prop) => {
    const matchesSearch =
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.proposal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prop.client_name || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || prop.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="neutral"><Clock className="w-3 h-3 mr-1" /> Rascunho</Badge>
      case 'internal_review':
        return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" /> Em Revisão</Badge>
      case 'approved':
        return <Badge variant="info"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado Internamente</Badge>
      case 'published':
        return <Badge variant="info"><ExternalLink className="w-3 h-3 mr-1" /> Enviada</Badge>
      case 'viewed':
        return <Badge variant="info"><Eye className="w-3 h-3 mr-1" /> Visualizada pelo Cliente</Badge>
      case 'negotiation':
        return <Badge variant="warning"><Sparkles className="w-3 h-3 mr-1" /> Em Negociação</Badge>
      case 'accepted':
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Aceita</Badge>
      case 'rejected':
        return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" /> Recusada</Badge>
      case 'expired':
        return <Badge variant="neutral"><Clock className="w-3 h-3 mr-1" /> Expirada</Badge>
      case 'archived':
        return <Badge variant="neutral"><Archive className="w-3 h-3 mr-1" /> Arquivada</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Proposal Studio"
        subtitle="Crie e gerencie propostas comerciais interativas de alta conversão para valorizar o trabalho da sua agência."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Propostas Comercial' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/proposals/services">
              <Button variant="outline" size="sm">
                <ShoppingBag className="w-4 h-4 mr-1.5 text-primary" />
                Catálogo de Serviços
              </Button>
            </Link>
            <Link to="/proposals/templates">
              <Button variant="outline" size="sm">
                <Layers className="w-4 h-4 mr-1.5" />
                Templates
              </Button>
            </Link>
            <Link to="/proposals/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Nova Proposta
              </Button>
            </Link>
          </div>
        }
      />

      {/* Real Commercial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between border-border/60 bg-surface/50">
          <div>
            <p className="text-xs text-text-muted font-medium">Total de Propostas</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/60 bg-surface/50">
          <div>
            <p className="text-xs text-text-muted font-medium">Em Elaboração / Revisão</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{draftCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/60 bg-surface/50">
          <div>
            <p className="text-xs text-text-muted font-medium">Enviadas ao Cliente</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{publishedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ExternalLink className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/60 bg-surface/50">
          <div>
            <p className="text-xs text-text-muted font-medium">Propostas Aceitas</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{acceptedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter and Controls Toolbar */}
      <Card className="p-4 border-border/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Buscar por título, número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos os Status' },
                { value: 'draft', label: 'Rascunhos' },
                { value: 'internal_review', label: 'Em Revisão' },
                { value: 'published', label: 'Enviadas' },
                { value: 'viewed', label: 'Visualizadas' },
                { value: 'negotiation', label: 'Em Negociação' },
                { value: 'accepted', label: 'Aceitas' },
                { value: 'rejected', label: 'Recusadas' },
              ]}
              className="w-48"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-lg border border-border/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
              }`}
              title="Visualização em Lista"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Proposal Listing */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredProposals.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80">
          <FileCheck2 className="w-12 h-12 mx-auto text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">Nenhuma proposta encontrada</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
            Nenhuma proposta comercial corresponde aos filtros atuais. Crie uma nova proposta para iniciar o fluxo comercial.
          </p>
          <Link to="/proposals/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Criar Nova Proposta
            </Button>
          </Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProposals.map((prop) => (
            <Card
              key={prop.id}
              className="p-5 flex flex-col justify-between border-border/60 hover:border-primary/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-medium text-text-muted">{prop.proposal_number}</span>
                  {getStatusBadge(prop.status)}
                </div>

                <div>
                  <h4 className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                    {prop.title}
                  </h4>
                  <p className="text-xs text-text-muted mt-1">Cliente: <strong className="text-text-primary">{prop.client_name}</strong></p>
                </div>

                <p className="text-xs text-text-muted line-clamp-2">{prop.description || 'Sem descrição cadastrada.'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Valor Investimento:</span>
                  <span className="text-sm font-bold text-primary">
                    {prop.pricing ? formatCurrencyCents(prop.pricing.total_cents, prop.currency) : 'R$ 0,00'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Link to={`/proposals/${prop.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                  </Link>

                  {prop.public_token && (
                    <a
                      href={`/p/${prop.public_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir Apresentação Pública do Cliente"
                    >
                      <Button variant="ghost" size="sm" className="px-2">
                        <ExternalLink className="w-4 h-4 text-text-muted hover:text-primary" />
                      </Button>
                    </a>
                  )}

                  <Link to={`/proposals/${prop.id}/export`} title="Exportar PDF Oficial">
                    <Button variant="ghost" size="sm" className="px-2">
                      <Download className="w-4 h-4 text-text-muted hover:text-primary" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List Mode View */
        <Card className="divide-y divide-border/40 border-border/60 overflow-hidden">
          {filteredProposals.map((prop) => (
            <div key={prop.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-medium text-text-muted">{prop.proposal_number}</span>
                  {getStatusBadge(prop.status)}
                </div>
                <h4 className="font-medium text-text-primary text-base">{prop.title}</h4>
                <p className="text-xs text-text-muted">Cliente: {prop.client_name} • Validade: {prop.valid_until ? new Date(prop.valid_until).toLocaleDateString('pt-BR') : 'Não informada'}</p>
              </div>

              <div className="flex items-center gap-4 justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-xs text-text-muted block">Investimento Total</span>
                  <span className="text-sm font-bold text-primary">
                    {prop.pricing ? formatCurrencyCents(prop.pricing.total_cents, prop.currency) : 'R$ 0,00'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/proposals/${prop.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Abrir Workspace
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
