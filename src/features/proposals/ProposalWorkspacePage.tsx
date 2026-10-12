import { toast } from '@/components/ui/Toast'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL WORKSPACE & BUILDER PAGE
// Multi-tab workspace for full commercial editing, pricing & publication
// ============================================================

import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FileCheck2,
  Edit3,
  DollarSign,
  History,
  Download,
  Share2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Layers,
  ShoppingBag,
  Send,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useProposal, useUpdateProposal, useAgencyServices } from './hooks/useProposals'
import { formatCurrencyCents } from './services/pricingEngine'
import { downloadProposalPdf } from './pdf/generateProposalPdf'
import { transformProposalToPdfModel } from './pdf/transformProposalToPdfModel'
import type { ProposalSection, ProposalItem, SectionType, BillingType } from '@/types/proposals'

export function getSectionTypeLabel(type: SectionType): string {
  switch (type) {
    case 'cover': return 'Capa da Proposta'
    case 'introduction': return 'Apresentação da Agência'
    case 'diagnosis': return 'Diagnóstico & Desafios'
    case 'objectives': return 'Objetivos Estratégicos'
    case 'scope': return 'Escopo do Projeto'
    case 'services': return 'Serviços Oferecidos'
    case 'deliverables': return 'Entregáveis Detalhados'
    case 'timeline': return 'Cronograma de Execução'
    case 'investment': return 'Investimento & Condições'
    case 'terms': return 'Termos & Garantias'
    case 'team': return 'Equipe Responsável'
    case 'portfolio': return 'Portfólio & Casos'
    case 'closing': return 'Encerramento & Contato'
    default: return 'Seção Personalizada'
  }
}

export const ProposalWorkspacePage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>()
  const navigate = useNavigate()
  const { data: proposal, isLoading } = useProposal(proposalId)
  const updateProposalMutation = useUpdateProposal()
  const { data: catalogServices = [] } = useAgencyServices()

  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'pricing' | 'versions' | 'export'>('sections')

  // Section Builder State
  const [sections, setSections] = useState<ProposalSection[]>([])
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(0)

  // Pricing Items State
  const [items, setItems] = useState<ProposalItem[]>([])

  // Internal approval comment
  const [approvalComment, setApprovalComment] = useState('')

  // Sync state when proposal loads
  React.useEffect(() => {
    if (proposal) {
      setSections(proposal.sections || [])
      setItems(proposal.items || [])
    }
  }, [proposal])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <Card className="p-12 text-center border-dashed border-border/80">
        <FileCheck2 className="w-12 h-12 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-text-primary mb-1">Proposta não encontrada</h3>
        <p className="text-sm text-text-muted mb-4">A proposta solicitada não existe ou foi removida.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/proposals')}>
          Voltar para Lista
        </Button>
      </Card>
    )
  }

  // Section manipulation functions
  const handleAddSection = (type: SectionType) => {
    const newSection: ProposalSection = {
      id: crypto.randomUUID(),
      agency_id: proposal.agency_id,
      proposal_id: proposal.id,
      section_type: type,
      title: getSectionTypeLabel(type),
      content: { text: '' },
      position: sections.length,
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updated = [...sections, newSection]
    setSections(updated)
    setSelectedSectionIdx(updated.length - 1)
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    const updated = [...sections]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    updated.forEach((s, idx) => (s.position = idx))
    setSections(updated)
    setSelectedSectionIdx(targetIdx)
  }

  const handleRemoveSection = (index: number) => {
    const updated = sections.filter((_, idx) => idx !== index)
    setSections(updated)
    setSelectedSectionIdx(Math.max(0, index - 1))
  }

  const handleUpdateSectionContent = (field: string, value: any) => {
    const updated = [...sections]
    if (!updated[selectedSectionIdx]) return
    updated[selectedSectionIdx] = {
      ...updated[selectedSectionIdx],
      content: {
        ...updated[selectedSectionIdx].content,
        [field]: value,
      },
      updated_at: new Date().toISOString(),
    }
    setSections(updated)
  }

  // Item manipulation functions
  const handleAddItemFromCatalog = (serviceId: string) => {
    const svc = catalogServices.find((s) => s.id === serviceId)
    if (!svc) return

    const newItem: ProposalItem = {
      id: crypto.randomUUID(),
      agency_id: proposal.agency_id,
      proposal_id: proposal.id,
      service_id: svc.id,
      name: svc.name,
      description: svc.description || '',
      quantity: 1,
      unit: svc.pricing_model === 'monthly' ? 'mês' : 'serviço',
      unit_price_cents: svc.base_price_cents,
      discount_cents: 0,
      total_cents: svc.base_price_cents,
      billing_type: svc.pricing_model === 'monthly' ? 'recurring' : 'one_time',
      position: items.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updated = [...items, newItem]
    setItems(updated)
  }

  const handleUpdateItem = (index: number, fields: Partial<ProposalItem>) => {
    const updated = [...items]
    if (!updated[index]) return
    const cur = updated[index]
    const qty = fields.quantity !== undefined ? fields.quantity : cur.quantity
    const price = fields.unit_price_cents !== undefined ? fields.unit_price_cents : cur.unit_price_cents
    const disc = fields.discount_cents !== undefined ? fields.discount_cents : cur.discount_cents

    const total = Math.max(0, Math.round(qty * price) - disc)

    updated[index] = {
      ...cur,
      ...fields,
      total_cents: total,
      updated_at: new Date().toISOString(),
    }
    setItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index))
  }

  // Save changes
  const handleSave = async () => {
    try {
    await updateProposalMutation.mutateAsync({
      id: proposal.id,
      sections,
      items,
    })
    } catch { toast.error('Não foi possível salvar. A integração transacional do backend precisa estar disponível.') }
  }

  // Status transitions
  const handleStatusChange = async (newStatus: any) => {
    try {
    await updateProposalMutation.mutateAsync({
      id: proposal.id,
      status: newStatus,
      sections,
      items,
    })
    } catch { toast.error('Não foi possível salvar. A integração transacional do backend precisa estar disponível.') }
  }

  const activeSection = sections[selectedSectionIdx]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={proposal.title}
        subtitle={`Proposta Comercial ${proposal.proposal_number} • Cliente: ${proposal.client_name}`}
        breadcrumbs={[
          { label: 'Propostas', href: '/proposals' },
          { label: proposal.proposal_number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={updateProposalMutation.isPending}
              onClick={handleSave}
            >
              Salvar Alterações
            </Button>
            {proposal.public_token && (
              <a href={`/p/${proposal.public_token}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Ver Link Público
                </Button>
              </a>
            )}
          </div>
        }
      />

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-border/60 gap-4 overflow-x-auto">
        {[
          { id: 'sections', label: 'Editor de Seções', icon: Edit3 },
          { id: 'pricing', label: 'Serviços & Precificação', icon: DollarSign },
          { id: 'versions', label: 'Aprovações & Versões', icon: History },
          { id: 'export', label: 'PDF & Compartilhamento', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: SECTION EDITOR (3-AREA BUILDER LAYOUT) */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left Area: Section Hierarchy Sidebar (3 cols) */}
          <Card className="lg:col-span-3 p-4 space-y-4 border-border/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">Estrutura de Seções</h4>
                <Badge variant="neutral">{sections.length}</Badge>
              </div>

              <div className="space-y-1.5 overflow-y-auto max-h-[420px]">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    onClick={() => setSelectedSectionIdx(idx)}
                    className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer border text-xs transition-all ${
                      selectedSectionIdx === idx
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border/40 hover:bg-surface-hover text-text-muted'
                    }`}
                  >
                    <span className="truncate flex-1">{sec.title}</span>
                    <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'up') }}>
                        <ArrowUp className="w-3 h-3 hover:text-primary" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'down') }}>
                        <ArrowDown className="w-3 h-3 hover:text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 space-y-2">
              <p className="text-[10px] text-text-muted font-medium uppercase">Adicionar Nova Seção:</p>
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleAddSection(e.target.value as SectionType)
                }}
                options={[
                  { value: '', label: '+ Selecione o tipo...' },
                  { value: 'introduction', label: 'Apresentação' },
                  { value: 'diagnosis', label: 'Diagnóstico' },
                  { value: 'objectives', label: 'Objetivos' },
                  { value: 'scope', label: 'Escopo' },
                  { value: 'deliverables', label: 'Entregáveis' },
                  { value: 'timeline', label: 'Cronograma' },
                  { value: 'terms', label: 'Termos & Condições' },
                  { value: 'closing', label: 'Encerramento' },
                ]}
              />
            </div>
          </Card>

          {/* Center Area: Live Canvas Preview (6 cols) */}
          <Card className="lg:col-span-6 p-6 space-y-6 border-border/60 bg-surface/30">
            <div className="border-b border-border/40 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-primary font-bold">Pré-visualização ao Vivo</span>
                <h3 className="text-xl font-bold text-text-primary mt-1">{activeSection?.title || 'Seção Selecionada'}</h3>
              </div>
              <Badge variant="neutral">{activeSection?.section_type}</Badge>
            </div>

            <div className="space-y-4 min-h-[300px]">
              {activeSection?.content?.text !== undefined ? (
                <div className="prose prose-invert text-sm text-text-primary leading-relaxed bg-surface/60 p-4 rounded-xl border border-border/40">
                  {activeSection.content.text || <span className="text-text-muted italic">Clique no painel à direita para editar o texto desta seção...</span>}
                </div>
              ) : (
                <p className="text-xs text-text-muted">Esta seção utiliza um modelo de bloco estruturado.</p>
              )}
            </div>
          </Card>

          {/* Right Area: Inspector & Section Settings (3 cols) */}
          <Card className="lg:col-span-3 p-4 space-y-4 border-border/60">
            <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">Configurar Seção</h4>

            {activeSection ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Título da Seção</label>
                  <Input
                    value={activeSection.title}
                    onChange={(e) => {
                      const updated = [...sections]
                      updated[selectedSectionIdx].title = e.target.value
                      setSections(updated)
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Conteúdo Textual</label>
                  <Textarea
                    rows={8}
                    value={activeSection.content?.text || ''}
                    onChange={(e) => handleUpdateSectionContent('text', e.target.value)}
                    placeholder="Escreva ou edite o conteúdo desta seção..."
                  />
                </div>

                <div className="pt-4 border-t border-border/40">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => handleRemoveSection(selectedSectionIdx)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Remover Seção
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Nenhuma seção selecionada.</p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: PRICING & SERVICES */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-6 border-border/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Serviços da Proposta</h3>
                <p className="text-xs text-text-muted">Adicione serviços do catálogo ou itens customizados com valores controlados em centavos.</p>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddItemFromCatalog(e.target.value)
                  }}
                  options={[
                    { value: '', label: '+ Adicionar do Catálogo...' },
                    ...catalogServices.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${formatCurrencyCents(s.base_price_cents)})`,
                    })),
                  ]}
                  className="w-64"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-text-muted uppercase">
                    <th className="py-2.5 px-3">Serviço / Item</th>
                    <th className="py-2.5 px-3 w-20">Qtd</th>
                    <th className="py-2.5 px-3 w-28">Preço Unit. (R$)</th>
                    <th className="py-2.5 px-3 w-28">Desconto (R$)</th>
                    <th className="py-2.5 px-3 w-32">Cobrança</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total (R$)</th>
                    <th className="py-2.5 px-3 w-12 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-surface-hover/40 transition-colors">
                      <td className="py-3 px-3">
                        <Input
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                          className="h-8 text-xs font-semibold"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, { quantity: parseFloat(e.target.value) || 1 })}
                          className="h-8 text-xs text-center"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <Input
                          type="number"
                          value={(item.unit_price_cents / 100).toFixed(2)}
                          onChange={(e) => handleUpdateItem(idx, { unit_price_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <Input
                          type="number"
                          value={(item.discount_cents / 100).toFixed(2)}
                          onChange={(e) => handleUpdateItem(idx, { discount_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <Select
                          value={item.billing_type}
                          onChange={(e) => handleUpdateItem(idx, { billing_type: e.target.value as BillingType })}
                          options={[
                            { value: 'one_time', label: 'Pontual (Setup)' },
                            { value: 'recurring', label: 'Recorrente (Mensal)' },
                            { value: 'optional', label: 'Opcional' },
                          ]}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-primary">
                        {formatCurrencyCents(item.total_cents)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-surface-hover/60 border border-border/60 max-w-md ml-auto space-y-2">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Investimento Pontual (Setup):</span>
                <span className="font-medium text-text-primary">{formatCurrencyCents(proposal.pricing?.one_time_total_cents || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>Investimento Recorrente (Mensal):</span>
                <span className="font-medium text-text-primary">{formatCurrencyCents(proposal.pricing?.recurring_monthly_total_cents || 0)}/mês</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t border-border/40">
                <span>Investimento Total:</span>
                <span className="text-primary">{formatCurrencyCents(proposal.pricing?.total_cents || 0)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: VERSIONS & APPROVALS */}
      {activeTab === 'versions' && (
        <Card className="p-6 space-y-6 border-border/60">
          <h3 className="text-lg font-bold text-text-primary">Fluxo de Aprovação Interna & Status</h3>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-hover/50 border border-border/40">
            <span className="text-xs text-text-muted font-medium">Status Atual:</span>
            <Badge variant="default">{proposal.status}</Badge>

            <div className="flex items-center gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('internal_review')}>
                Enviar para Revisão Interna
              </Button>

              <Button size="sm" variant="primary" onClick={() => handleStatusChange('published')}>
                <Send className="w-3.5 h-3.5 mr-1" />
                Publicar Proposta
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: EXPORT & PDF */}
      {activeTab === 'export' && (
        <Card className="p-6 space-y-6 border-border/60 text-center">
          <Download className="w-12 h-12 text-primary mx-auto opacity-80" />
          <h3 className="text-lg font-bold text-text-primary">Exportação PDF Profissional</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto">
            Gere o documento PDF com layout editorial A4, marca-d'água da agência e precificação totalmente validada.
          </p>

          <Button
            variant="primary"
            onClick={() => {
              const model = transformProposalToPdfModel(proposal)
              downloadProposalPdf(model)
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF da Proposta
          </Button>
        </Card>
      )}
    </div>
  )
}
