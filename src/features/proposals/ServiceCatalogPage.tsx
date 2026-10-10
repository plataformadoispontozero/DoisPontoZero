// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: SERVICE CATALOG MANAGEMENT
// Manage agency services, base prices and pricing models
// ============================================================

import React, { useState } from 'react'
import { Plus, Search, ShoppingBag, Edit2, Archive, CheckCircle2, DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Dialog } from '@/components/ui/Dialog'
import { useAgencyServices, useSaveService } from './hooks/useProposals'
import { formatCurrencyCents } from './services/pricingEngine'
import type { AgencyService, PricingModel } from '@/types/proposals'

export const ServiceCatalogPage: React.FC = () => {
  const { data: services = [], isLoading } = useAgencyServices()
  const saveServiceMutation = useSaveService()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Partial<AgencyService> | null>(null)

  const handleOpenCreate = () => {
    setEditingService({
      name: '',
      description: '',
      category: 'Social Media',
      pricing_model: 'fixed',
      base_price_cents: 100000,
      estimated_duration: '10 dias úteis',
      is_active: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (svc: AgencyService) => {
    setEditingService(svc)
    setIsModalOpen(true)
  }

  const handleSaveModal = async () => {
    if (!editingService?.name) return
    await saveServiceMutation.mutateAsync(editingService)
    setIsModalOpen(false)
  }

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Catálogo de Serviços da Agência"
        subtitle="Gerencie serviços padronizados, modelos de cobrança e precificação base."
        breadcrumbs={[
          { label: 'Propostas', href: '/proposals' },
          { label: 'Catálogo de Serviços' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Serviço
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4 border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Buscar por nome do serviço ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas as Categorias' },
            { value: 'Social Media', label: 'Social Media' },
            { value: 'Branding & Design', label: 'Branding & Design' },
            { value: 'Motion Design', label: 'Motion Design' },
            { value: 'Audiovisual', label: 'Audiovisual' },
            { value: 'Performance', label: 'Performance & Ads' },
            { value: 'Estratégia', label: 'Estratégia' },
          ]}
          className="w-52"
        />
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((svc) => (
          <Card key={svc.id} className="p-5 flex flex-col justify-between border-border/60 hover:border-primary/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="neutral">{svc.category}</Badge>
                <span className="text-[10px] font-medium text-text-muted uppercase">{svc.pricing_model}</span>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary text-base">{svc.name}</h4>
                <p className="text-xs text-text-muted mt-1 line-clamp-2">{svc.description || 'Sem descrição.'}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-muted block">Preço Base</span>
                <span className="text-sm font-bold text-primary">{formatCurrencyCents(svc.base_price_cents)}</span>
              </div>

              <Button variant="outline" size="sm" onClick={() => handleOpenEdit(svc)}>
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Service Edit Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => setIsModalOpen(open)}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nome do Serviço</label>
            <Input
              value={editingService?.name || ''}
              onChange={(e) => setEditingService((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Categoria</label>
            <Select
              value={editingService?.category || 'Social Media'}
              onChange={(e) => setEditingService((prev) => ({ ...prev, category: e.target.value }))}
              options={[
                { value: 'Social Media', label: 'Social Media' },
                { value: 'Branding & Design', label: 'Branding & Design' },
                { value: 'Motion Design', label: 'Motion Design' },
                { value: 'Audiovisual', label: 'Audiovisual' },
                { value: 'Performance', label: 'Performance' },
                { value: 'Estratégia', label: 'Estratégia' },
                { value: 'Redação', label: 'Redação' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Modelo de Precificação</label>
            <Select
              value={editingService?.pricing_model || 'fixed'}
              onChange={(e) => setEditingService((prev) => ({ ...prev, pricing_model: e.target.value as PricingModel }))}
              options={[
                { value: 'fixed', label: 'Preço Fixo / Projeto' },
                { value: 'monthly', label: 'Recorrente Mensal' },
                { value: 'hourly', label: 'Por Hora' },
                { value: 'unit', label: 'Por Unidade' },
                { value: 'custom', label: 'Sob Orçamento' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Preço Base (R$)</label>
            <Input
              type="number"
              value={((editingService?.base_price_cents || 0) / 100).toFixed(2)}
              onChange={(e) =>
                setEditingService((prev) => ({
                  ...prev,
                  base_price_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Descrição Comercial</label>
            <Textarea
              rows={3}
              value={editingService?.description || ''}
              onChange={(e) => setEditingService((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={saveServiceMutation.isPending} onClick={handleSaveModal}>
              Salvar Serviço
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
