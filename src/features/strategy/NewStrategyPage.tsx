import { useBriefings, useBriefing } from "@/features/briefing/hooks/useBriefings"
import { briefingEditorialContext } from "@/features/editorial/editorialContext"
import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO — NEW STRATEGY
// Route: /strategy/new
// ============================================================

import { useClients } from "@/features/clients/hooks/useClients"
import { readClientProfile } from "@/features/clients/clientProfile"
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Compass,
  ArrowLeft,
  Target,
  Users,
  MessageSquare,
  Award,
  Globe,
  ShieldAlert,
  CalendarDays,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { useCreateStrategy } from './hooks/useStrategy'
import { SOCIAL_CHANNEL_CONFIG, type SocialChannel } from '@/types/strategy'


interface FormData {
  name: string
  description: string
  client_id: string | null
  objective: string
  target_audience: string
  tone_of_voice: string
  brand_positioning: string
  channels: string[]
  competitors: string[]
  key_messages: string[]
  restrictions: string[]
  period_start: string
  period_end: string
}

const initialForm: FormData = {
  name: '',
  description: '',
  client_id: null,
  objective: '',
  target_audience: '',
  tone_of_voice: '',
  brand_positioning: '',
  channels: [],
  competitors: [],
  key_messages: [],
  restrictions: [],
  period_start: '',
  period_end: '',
}

export const NewStrategyPage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()

  const [params] = useSearchParams()
  const clients=useClients(DEMO_AGENCY_ID)
  const navigate = useNavigate()
  const createStrategy = useCreateStrategy(DEMO_AGENCY_ID)

  const [form, setForm] = useState<FormData>(()=>({...initialForm,client_id:params.get("clientId")}))
  const briefs = useBriefings(DEMO_AGENCY_ID, { clientId: form.client_id || undefined })
  const selectedBrief = form.client_id ? briefs.data?.find(b => b.client_id === form.client_id && b.agency_id === DEMO_AGENCY_ID) : undefined
  const details = useBriefing(selectedBrief?.id)
  const editedFields = useRef(new Set<keyof FormData>())
  const [step, setStep] = useState(0) // 0 = identity, 1 = strategic, 2 = channels & period
  const [tempCompetitor, setTempCompetitor] = useState('')
  const [tempKeyMessage, setTempKeyMessage] = useState('')
  const [tempRestriction, setTempRestriction] = useState('')

  function applyClientProfile(clientId:string, current:FormData):FormData {
    const profile=readClientProfile(clients.data?.find(c=>c.id===clientId)?.profile)
    const values: Partial<FormData> = { objective:profile.monthly_objective || '', target_audience:profile.target_audience || '', tone_of_voice:profile.tone || '', brand_positioning:profile.positioning || profile.differential || '' }
    const next={...current,client_id:clientId || null}
    for(const [key,value] of Object.entries(values)) if(!editedFields.current.has(key as keyof FormData) && !current[key as keyof FormData]) Object.assign(next,{[key]:value})
    return next
  }
  useEffect(()=>{if(form.client_id&&clients.data)setForm(old=>applyClientProfile(old.client_id||'',old));},[clients.data]);
  useEffect(() => {
    const briefing = details.data
    if (!briefing || briefing.id !== selectedBrief?.id || briefing.client_id !== form.client_id || briefing.agency_id !== DEMO_AGENCY_ID) return
    const questions = briefing.template?.questions || []
    const context = briefingEditorialContext((briefing.answers || []).map(answer => {
      const question = questions.find(q => q.id === answer.question_id) || answer.question
      return { questionKey: question?.question_key, label: question?.label, value: answer.answer_value }
    }))
    setForm(old => {
      if (old.client_id !== briefing.client_id) return old
      const values: Partial<FormData> = { objective: context.objective, target_audience: context.audience, tone_of_voice: context.tone, brand_positioning: context.positioning, restrictions: context.restrictions ? [context.restrictions] : undefined }
      const next = { ...old }
      for (const [key,value] of Object.entries(values)) if (value !== undefined && !editedFields.current.has(key as keyof FormData)) Object.assign(next, { [key]:value })
      return next
    })
  }, [details.data, selectedBrief?.id, form.client_id, DEMO_AGENCY_ID])
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    editedFields.current.add(field)
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: 'competitors' | 'key_messages' | 'restrictions', value: string) => {
    if (value.trim()) {
      updateField(field, [...form[field], value.trim()])
    }
  }

  const removeFromArray = (field: 'competitors' | 'key_messages' | 'restrictions', index: number) => {
    updateField(field, form[field].filter((_, i) => i !== index))
  }

  const toggleChannel = (ch: string) => {
    if (form.channels.includes(ch)) {
      updateField('channels', form.channels.filter((c) => c !== ch))
    } else {
      updateField('channels', [...form.channels, ch])
    }
  }

  const handleSubmit = async () => {
    if(!form.client_id||!clients.data?.some(c=>c.id===form.client_id)){toast.error('Selecione um cliente desta agência.');return;}
    if (!form.name.trim()) {
      toast.error('Nome da estratégia é obrigatório.')
      return
    }

    if (form.period_start && form.period_end && form.period_end < form.period_start) {
      toast.error('O fim do período não pode ser anterior ao início.')
      return
    }
    if (createStrategy.isPending) return
    try {
      const result = await createStrategy.mutateAsync({
        name: form.name.trim(),
        client_id: form.client_id,
        briefing_id: selectedBrief?.id,
        description: form.description || undefined,
        objective: form.objective || undefined,
        target_audience: form.target_audience || undefined,
        tone_of_voice: form.tone_of_voice || undefined,
        brand_positioning: form.brand_positioning || undefined,
        channels: form.channels,
        competitors: form.competitors,
        key_messages: form.key_messages,
        restrictions: form.restrictions,
        period_start: form.period_start || null,
        period_end: form.period_end || null,
      })

      toast.success('Estratégia criada com sucesso!')
      navigate(`/strategy/${(result as any).id}`)
    } catch (err) {
      toast.error('Erro ao criar estratégia.')
    }
  }

  const steps = [
    { label: 'Identidade', icon: Compass },
    { label: 'Diagnóstico', icon: Target },
    { label: 'Canais & Período', icon: Globe },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Nova Estratégia de Conteúdo"
        subtitle="Defina as diretrizes que orientarão a produção de conteúdo."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Strategy Studio', href: '/strategy' },
          { label: 'Nova Estratégia' },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/strategy')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </Button>
        }
      />

      {/* Step Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {steps.map((s, idx) => {
              const Icon = s.icon
              const isActive = idx === step
              const isComplete = idx < step

              return (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => setStep(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#C74410] text-white shadow-lg shadow-[#C74410]/20'
                        : isComplete
                          ? 'bg-[#C74410]/10 text-[#C74410]'
                          : 'bg-[#1C1C24] text-[#98989F] hover:text-[#B8B8C0]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-[#30303B] shrink-0" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 0: Identity */}
      {step === 0 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F8F9FC]">
              <Compass className="w-4 h-4 text-[#C74410]" />
              Identidade da Estratégia
            </div>

            <label className="block space-y-2 text-sm">Cliente da estratégia<select aria-label="Cliente da estratégia" value={form.client_id||''} disabled={clients.isLoading||clients.isError} className="w-full rounded-lg border border-white/15 bg-[#17171d] p-3 text-white" onChange={e=>{editedFields.current.clear();setForm(applyClientProfile(e.target.value,{...initialForm}));setTempCompetitor('');setTempKeyMessage('');setTempRestriction('');}}><option value="">Selecione um cliente</option>{clients.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            {clients.isError&&<p role="alert">Não foi possível carregar os clientes. Tente novamente antes de salvar.</p>}
            {form.client_id&&<p className="text-sm text-orange-200">Dados do cadastro sugeridos para revisão. Edite o diagnóstico e adicione pilares/temas antes de usar no calendário.</p>}
            {form.client_id && <section className="rounded-xl border border-orange-500/25 bg-orange-500/5 p-4 space-y-2">
              <h2 className="font-semibold">Contexto do cliente conectado</h2>
              <p className="text-sm text-zinc-300">Cadastro e briefing preenchem o diagnóstico. Os campos continuam editáveis para esta campanha.</p>
              {selectedBrief && <p className="text-sm text-orange-200">Briefing: {selectedBrief.title}</p>}
              {(briefs.isLoading || details.isLoading) && <p role="status">Carregando briefing do cliente…</p>}
              {(briefs.isError || details.isError) && <p role="alert">Não foi possível carregar o briefing. O cadastro foi mantido; tente novamente antes de criar.</p>}
              {!briefs.isLoading && !selectedBrief && <p className="text-sm text-zinc-400">Sem briefing cadastrado. Complete o diagnóstico com os dados do cliente.</p>}
            </section>}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">Nome da Estratégia *</label>
                <Input
                  placeholder="Ex: Estratégia Social Q4 2026"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">Descrição</label>
                <Textarea
                  placeholder="Descreva brevemente o contexto e propósito dessa estratégia..."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">
                  <Target className="w-3 h-3 inline mr-1" />
                  Objetivo Principal
                </label>
                <Textarea
                  placeholder="Ex: Aumentar o engajamento em 40% e gerar 200 leads qualificados por mês..."
                  value={form.objective}
                  onChange={(e) => updateField('objective', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setStep(1)}>
                <span>Próximo: Diagnóstico</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Strategic Diagnosis */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F8F9FC]">
              <Target className="w-4 h-4 text-[#C74410]" />
              Diagnóstico Estratégico
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">
                  <Users className="w-3 h-3 inline mr-1" />
                  Público-Alvo
                </label>
                <Textarea
                  placeholder="Ex: Empreendedores digitais, 25-40 anos, interessados em marketing e vendas online..."
                  value={form.target_audience}
                  onChange={(e) => updateField('target_audience', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  Tom de Voz
                </label>
                <Textarea
                  placeholder="Ex: Profissional porém acessível. Autoridade técnica sem ser pedante..."
                  value={form.tone_of_voice}
                  onChange={(e) => updateField('tone_of_voice', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">
                  <Award className="w-3 h-3 inline mr-1" />
                  Posicionamento de Marca
                </label>
                <Textarea
                  placeholder="Ex: Referência em marketing digital para PMEs. Dados orientam criatividade..."
                  value={form.brand_positioning}
                  onChange={(e) => updateField('brand_positioning', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Competitors */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">Concorrentes Mapeados</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar concorrente..."
                    value={tempCompetitor}
                    onChange={(e) => setTempCompetitor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('competitors', tempCompetitor)
                        setTempCompetitor('')
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addToArray('competitors', tempCompetitor)
                      setTempCompetitor('')
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {form.competitors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.competitors.map((c, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C1C24] text-[11px] text-[#B8B8C0] border border-[#30303B]"
                      >
                        {c}
                        <button onClick={() => removeFromArray('competitors', i)} className="text-[#98989F] hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Messages */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Mensagens-Chave
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar mensagem-chave..."
                    value={tempKeyMessage}
                    onChange={(e) => setTempKeyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('key_messages', tempKeyMessage)
                        setTempKeyMessage('')
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addToArray('key_messages', tempKeyMessage)
                      setTempKeyMessage('')
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {form.key_messages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.key_messages.map((m, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C74410]/10 text-[11px] text-[#C74410] border border-[#C74410]/20"
                      >
                        {m}
                        <button onClick={() => removeFromArray('key_messages', i)} className="text-[#C74410]/50 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Restrictions */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#B8B8C0]">
                  <ShieldAlert className="w-3 h-3 inline mr-1" />
                  Restrições Comunicacionais
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Não mencionar concorrentes..."
                    value={tempRestriction}
                    onChange={(e) => setTempRestriction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('restrictions', tempRestriction)
                        setTempRestriction('')
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addToArray('restrictions', tempRestriction)
                      setTempRestriction('')
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {form.restrictions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.restrictions.map((r, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-[11px] text-red-400 border border-red-500/20"
                      >
                        {r}
                        <button onClick={() => removeFromArray('restrictions', i)} className="text-red-400/50 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="secondary" size="sm" onClick={() => setStep(0)}>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </Button>
              <Button variant="primary" size="sm" onClick={() => setStep(2)}>
                <span>Próximo: Canais</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Channels & Period */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F8F9FC]">
              <Globe className="w-4 h-4 text-[#C74410]" />
              Canais & Período
            </div>

            <div className="space-y-4">
              {/* Channel Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#B8B8C0]">Canais de Distribuição</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {(Object.keys(SOCIAL_CHANNEL_CONFIG) as SocialChannel[]).map((ch) => {
                    const cfg = SOCIAL_CHANNEL_CONFIG[ch]
                    const isSelected = form.channels.includes(ch)

                    return (
                      <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                          isSelected
                            ? 'border-[#C74410] bg-[#C74410]/10 text-[#F8F9FC]'
                            : 'border-[#30303B] bg-[#1C1C24] text-[#98989F] hover:text-[#B8B8C0] hover:border-[#98989F]/30'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? cfg.color : '#30303B' }}
                        />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#B8B8C0]">
                    <CalendarDays className="w-3 h-3 inline mr-1" />
                    Início do Período
                  </label>
                  <Input
                    type="date"
                    value={form.period_start}
                    onChange={(e) => updateField('period_start', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#B8B8C0]">
                    <CalendarDays className="w-3 h-3 inline mr-1" />
                    Fim do Período
                  </label>
                  <Input
                    type="date"
                    value={form.period_end}
                    onChange={(e) => updateField('period_end', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="secondary" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={createStrategy.isPending || briefs.isLoading || details.isLoading || briefs.isError || details.isError || !form.name.trim() || !form.client_id || clients.isError}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{createStrategy.isPending ? 'Criando...' : 'Criar Estratégia'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
