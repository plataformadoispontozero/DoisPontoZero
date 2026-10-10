// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION STUDIO HOME & DASHBOARD
// Route: /presentations
// ============================================================

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Tv,
  ExternalLink,
  Edit3,
  Clock,
  CheckCircle2,
  Download,
  LayoutGrid,
  List as ListIcon,
  Layers,
  HardDrive,
  Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { usePresentations } from './hooks/usePresentations'
import type { PresentationStatus } from '@/types/presentations'

export const PresentationsPage: React.FC = () => {
  const { data: presentations = [], isLoading } = usePresentations()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const totalCount = presentations.length
  const draftCount = presentations.filter((p) => p.status === 'draft' || p.status === 'internal_review').length
  const publishedCount = presentations.filter((p) => p.status === 'published').length

  const filteredPresentations = presentations.filter((pres) => {
    const matchesSearch =
      pres.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pres.client_name || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || pres.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Presentation Studio"
        subtitle="Transforme entregas criativas em apresentações e showcases de alto impacto visual."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Apresentações' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/drive">
              <Button variant="outline" size="sm">
                <HardDrive className="w-4 h-4 mr-1.5 text-blue-400" />
                Google Drive
              </Button>
            </Link>
            <Link to="/presentations/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Nova Apresentação
              </Button>
            </Link>
          </div>
        }
      />

      {/* Real KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-border/60 bg-surface/50">
          <div>
            <p className="text-xs text-text-muted font-medium">Total de Apresentações</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Tv className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/60 bg-surface/50">
          <div>
            <p className="text-xs text-text-muted font-medium">Em Elaboração</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{draftCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/60 bg-surface/50">
          <div>
            <p className="text-xs text-text-muted font-medium">Publicadas (Showcases)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{publishedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter and View Modes */}
      <Card className="p-4 border-border/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Buscar por título ou cliente..."
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
                { value: 'published', label: 'Publicadas' },
              ]}
              className="w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-lg border border-border/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Presentation Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredPresentations.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80">
          <Tv className="w-12 h-12 mx-auto text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">Nenhuma apresentação encontrada</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
            Crie sua primeira apresentação para expor materiais do Google Drive aos clientes em formato de showcase.
          </p>
          <Link to="/presentations/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Criar Apresentação
            </Button>
          </Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresentations.map((pres) => (
            <Card
              key={pres.id}
              className="p-5 flex flex-col justify-between border-border/60 hover:border-primary/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={pres.status === 'published' ? 'success' : 'neutral'}>
                    {pres.status === 'published' ? 'Publicada' : 'Rascunho'}
                  </Badge>
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    {pres.period_month}/{pres.period_year}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-text-primary text-base group-hover:text-primary transition-colors line-clamp-1">
                    {pres.title}
                  </h4>
                  <p className="text-xs text-text-muted mt-1">Cliente: <strong className="text-text-primary">{pres.client_name}</strong></p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-2">
                <Link to={`/presentations/${pres.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>
                </Link>

                {pres.public_token && (
                  <a
                    href={`/showcase/${pres.public_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir Showcase Público do Cliente"
                  >
                    <Button variant="ghost" size="sm" className="px-2">
                      <ExternalLink className="w-4 h-4 text-text-muted hover:text-primary" />
                    </Button>
                  </a>
                )}

                <Link to={`/presentations/${pres.id}/export`} title="Exportar PDF Oficial">
                  <Button variant="ghost" size="sm" className="px-2">
                    <Download className="w-4 h-4 text-text-muted hover:text-primary" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="divide-y divide-border/40 border-border/60 overflow-hidden">
          {filteredPresentations.map((pres) => (
            <div key={pres.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-hover/50 transition-colors">
              <div>
                <h4 className="font-medium text-text-primary text-base">{pres.title}</h4>
                <p className="text-xs text-text-muted">Cliente: {pres.client_name} • Período: {pres.period_month}/{pres.period_year}</p>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/presentations/${pres.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Abrir Workspace
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
