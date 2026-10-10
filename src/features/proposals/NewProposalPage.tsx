// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: NEW PROPOSAL WIZARD
// Multi-step wizard to create a proposal linked to Client, Briefing & Strategy
// ============================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  User,
  Briefcase,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useCreateProposal, useProposalTemplates } from './hooks/useProposals'
import { useClients } from '@/features/clients/hooks/useClients'

export const NewProposalPage: React.FC = () => {
  const navigate = useNavigate()
  const createProposalMutation = useCreateProposal()
  const { data: clients = [] } = useClients('demo-agency')
  const { data: templates = [] } = useProposalTemplates()

  const [step, setStep] = useState<number>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const handleFinish = async () => {
    if (!title || !selectedClientId) return

    try {
      const created = await createProposalMutation.mutateAsync({
        title,
        description,
        client_id: selectedClientId,
        client_name: selectedClient?.name || 'Cliente',
        client_company: selectedClient?.name || 'Empresa Cliente',
        template_id: selectedTemplateId || undefined,
      })

      navigate(`/proposals/${created.id}`)
    } catch (err) {
      console.error('Erro ao criar proposta:', err)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Nova Proposta Comercial"
        subtitle="Siga as etapas para vincular o cliente, selecionar dados estratégicos e estruturar a proposta."
        breadcrumbs={[
          { label: 'Propostas', href: '/proposals' },
          { label: 'Nova Proposta' },
        ]}
      />

      {/* Progress Wizard Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        {[
          { num: 1, label: 'Informações Básicas & Cliente' },
          { num: 2, label: 'Template & Estrutura' },
          { num: 3, label: 'Revisão & Confirmação' },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 ${
              step === s.num
                ? 'text-primary font-semibold'
                : step > s.num
                ? 'text-emerald-400 font-medium'
                : 'text-text-muted'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step === s.num
                  ? 'bg-primary text-white font-bold'
                  : step > s.num
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'bg-surface-hover text-text-muted'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className="hidden sm:inline text-sm">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info & Client */}
      {step === 1 && (
        <Card className="p-6 space-y-6 border-border/60">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            1. Cliente & Identificação da Proposta
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Cliente Comercial <span className="text-red-400">*</span>
              </label>
              <Select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value)
                  const cli = clients.find((c) => c.id === e.target.value)
                  if (cli && !title) {
                    setTitle(`Proposta Comercial — ${cli.name}`)
                  }
                }}
                options={[
                  { value: '', label: 'Selecione um cliente...' },
                  ...clients.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Título da Proposta <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="Ex: Campanha de Posicionamento & Social Media 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Descrição / Objetivos Gerais</label>
              <Textarea
                placeholder="Descreva resumidamente os objetivos principais desta proposta comercial..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/40">
            <Button
              variant="primary"
              disabled={!selectedClientId || !title}
              onClick={() => setStep(2)}
            >
              <span>Próxima Etapa</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Template Selection */}
      {step === 2 && (
        <Card className="p-6 space-y-6 border-border/60">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            2. Selecione um Template Comercial
          </h3>

          <p className="text-sm text-text-muted">
            Templates pré-configurados importam seções editáveis, entregáveis padrão e precificação estruturada para acelerar sua elaboração.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedTemplateId('')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedTemplateId === ''
                  ? 'border-primary bg-primary/5 text-text-primary'
                  : 'border-border/60 hover:border-border text-text-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-text-primary">Começar em Branco</span>
                {selectedTemplateId === '' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-text-muted">Monte as seções e serviços do zero sem pré-preenchimento.</p>
            </div>

            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTemplateId === tmpl.id
                    ? 'border-primary bg-primary/5 text-text-primary'
                    : 'border-border/60 hover:border-border text-text-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-text-primary">{tmpl.name}</span>
                  {selectedTemplateId === tmpl.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-text-muted line-clamp-2">{tmpl.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-hover text-text-muted font-medium">
                    {tmpl.category}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {tmpl.sections_snapshot.length} seções • {tmpl.items_snapshot.length} serviços
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Voltar</span>
            </Button>

            <Button variant="primary" onClick={() => setStep(3)}>
              <span>Avançar para Revisão</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Review & Create */}
      {step === 3 && (
        <Card className="p-6 space-y-6 border-border/60">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            3. Confirmar & Criar Proposta
          </h3>

          <div className="bg-surface-hover/50 p-4 rounded-xl space-y-3 border border-border/40">
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-xs text-text-muted">Título:</span>
              <span className="text-sm font-semibold text-text-primary">{title}</span>
            </div>

            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-xs text-text-muted">Cliente:</span>
              <span className="text-sm font-medium text-text-primary">
                {selectedClient?.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs text-text-muted">Template Selecionado:</span>
              <span className="text-sm font-medium text-primary">
                {selectedTemplateId
                  ? templates.find((t) => t.id === selectedTemplateId)?.name
                  : 'Proposta em Branco'}
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Voltar</span>
            </Button>

            <Button
              variant="primary"
              loading={createProposalMutation.isPending}
              onClick={handleFinish}
            >
              <FileCheck2 className="w-4 h-4 mr-1.5" />
              <span>Criar Proposta no Proposal Studio</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
