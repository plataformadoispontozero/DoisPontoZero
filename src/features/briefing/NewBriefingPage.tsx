import { officialBriefingTemplates } from './templates/officialCatalog'
import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: BRIEFING STUDIO — NEW BRIEFING FLOW
// Route: /briefings/new
// ============================================================

import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  FileText,
  User,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Share2,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useBriefingTemplates, useCreatePublicLink } from './hooks/useBriefings'
import {useBriefingLeads,useCreateBriefingIntake} from './hooks/useBriefingIntake'
import { BRIEFING_CATEGORY_CONFIG } from '@/types/briefing'
import { toast } from '@/components/ui/Toast'


export const NewBriefingPage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedTemplateId = searchParams.get('templateId')

  const templateQuery = useBriefingTemplates(DEMO_AGENCY_ID)
  const templates = officialBriefingTemplates(templateQuery.data ?? [])
  const createBriefing = useCreateBriefingIntake()
  const [source,setSource]=useState<'new'|'site'>('new')
  const leads=useBriefingLeads(source==='site')
  const [leadId,setLeadId]=useState('')
  const [name,setName]=useState(''),[contactName,setContactName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState('')
  const [requestId]=useState(()=>crypto.randomUUID())

  // Flow Step: 1 = Client, 2 = Template, 3 = Title & Info, 4 = Review, 5 = Created Success
  const [step, setStep] = useState<number>(preselectedTemplateId ? 1 : 1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    preselectedTemplateId || ''
  )
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [createdBriefingId, setCreatedBriefingId] = useState<string | null>(null)
  const [generatedPublicUrl, setGeneratedPublicUrl] = useState<string | null>(null)

  const selectedClient = name.trim()?{name:name.trim()}:null
  const validIdentity=name.trim().length>=2&&(source==='new'||!!leadId)&&(!email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const handleNext = () => {
    if (step === 1 && !validIdentity) {
      toast.error('Informe o nome do novo cliente e confira os dados de contato.')
      return
    }
    if (step === 2 && !selectedTemplate) {
      toast.error('Selecione um modelo de briefing.')
      return
    }
    if (step === 3 && !title.trim()) {
      toast.error('Informe um título para o briefing.')
      return
    }
    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1)
  }

  const handleCreate = async () => {
    if (!validIdentity || !selectedTemplate || !title.trim() || createBriefing.isPending) {
      toast.error('Confira os dados do novo cliente, o modelo e o título.')
      return
    }
    try {
      const res = await createBriefing.mutateAsync({
        requestId,leadId:source==='site'?leadId:undefined,
        name:name.trim(),contactName:contactName.trim(),email:email.trim(),phone:phone.trim(),
        templateId:selectedTemplateId,title:title.trim(),description:description.trim(),
      })

      const newId = res.briefing_id
      setCreatedBriefingId(newId)
      setStep(5)
      toast.success('Briefing criado com sucesso!')
    } catch (err) {
      toast.error(`Erro ao criar briefing: ${String(err)}`)
    }
  }

  const createPublicLinkMutation = useCreatePublicLink(DEMO_AGENCY_ID, createdBriefingId || '')

  const handleGenerateLink = async () => {
    if (!createdBriefingId) return
    try {
      const res = await createPublicLinkMutation.mutateAsync({ expiresInDays: 30 })
      setGeneratedPublicUrl(res.publicUrl)
      navigator.clipboard.writeText(res.publicUrl)
      toast.success('Link público gerado e copiado para a área de transferência!')
    } catch (err) {
      toast.error(`Erro ao gerar link público: ${String(err)}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Novo Briefing Criativo"
        subtitle="Receba um novo cliente e prepare o briefing da reunião de apresentação."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Briefings', href: '/briefings' },
          { label: 'Novo' },
        ]}
      />

      {templateQuery.isLoading && <p role="status">Carregando modelos…</p>}
      {templateQuery.isError && <p role="alert">Não foi possível carregar os modelos. Tente novamente antes de criar o briefing.</p>}
      {!templateQuery.isLoading && !templateQuery.isError && templates.length === 0 && (
        <p>Nenhum modelo cadastrado. <Link className="text-[#FF8759]" to="/briefings/templates">Gerenciar modelos de briefing</Link></p>
      )}
      {/* Steps indicator */}
      {step < 5 && (
        <div className="flex items-center justify-between pb-2 border-b border-[#30303B]">
          {[
            { num: 1, label: 'Cliente' },
            { num: 2, label: 'Modelo' },
            { num: 3, label: 'Detalhes' },
            { num: 4, label: 'Revisão' },
          ].map((st) => (
            <div key={st.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === st.num
                    ? 'bg-[#C74410] text-white'
                    : step > st.num
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#252530] text-[#98989F]'
                }`}
              >
                {step > st.num ? <Check className="w-3.5 h-3.5" /> : st.num}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  step === st.num ? 'text-[#F8F9FC]' : 'text-[#98989F]'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {step === 1 && <Card><CardContent className="space-y-5 p-6">
        <div><h2 className="font-semibold">Entrada do novo cliente</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Cadastre os dados iniciais ou aproveite uma solicitação de orçamento recebida pelo site.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant={source==='new'?'primary':'outline'} onClick={()=>{setSource('new');setLeadId('');setName('');setContactName('');setEmail('');setPhone('');setDescription('')}}>Novo cliente</Button><Button variant={source==='site'?'primary':'outline'} onClick={()=>{setSource('site');setLeadId('');setName('');setContactName('');setEmail('');setPhone('');setDescription('')}}>Solicitação de orçamento do site</Button></div>
        {source==='site'&&<div className="space-y-2">{leads.isPending?<p role="status">Consultando solicitações…</p>:leads.isError?<p role="alert">Não foi possível consultar as solicitações. <button type="button" className="underline" onClick={()=>void leads.refetch()}>Tentar novamente</button></p>:<label className="grid gap-2 text-sm">Solicitação recebida<select className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-[var(--color-text-primary)]" value={leadId} onChange={event=>{const lead=leads.data?.find(item=>item.id===event.target.value);setLeadId(lead?.id||'');setName(lead?.company||lead?.name||'');setContactName(lead?.name||'');setEmail(lead?.email||'');setPhone(lead?.phone||'');setDescription(lead?`Solicitação recebida pelo site em ${new Date(lead.created_at).toLocaleDateString('pt-BR')}\nContato: ${lead.name}\nE-mail: ${lead.email}\nTelefone: ${lead.phone}\nServiços: ${lead.services.join(', ')}\nObjetivo: ${lead.objective}\nInvestimento informado: ${lead.budget||'A definir'}`:'')}}><option value="">Selecione uma solicitação</option>{leads.data?.map(lead=><option key={lead.id} value={lead.id}>{lead.company||lead.name} · {new Date(lead.created_at).toLocaleDateString('pt-BR')}</option>)}</select>{!leads.data?.length&&<span className="text-[var(--color-text-secondary)]">Nenhuma solicitação pendente.</span>}</label>}</div>}
        <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm">Nome da empresa ou cliente *<Input value={name} maxLength={160} onChange={e=>setName(e.target.value)} autoComplete="organization"/></label><label className="grid gap-2 text-sm">Pessoa de contato<Input value={contactName} maxLength={120} onChange={e=>setContactName(e.target.value)} autoComplete="name"/></label><label className="grid gap-2 text-sm">E-mail<Input type="email" value={email} maxLength={254} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label className="grid gap-2 text-sm">Telefone<Input type="tel" value={phone} maxLength={30} onChange={e=>setPhone(e.target.value)} autoComplete="tel"/></label></div>
        <p className="text-xs text-[var(--color-text-secondary)]">O cliente e o briefing serão salvos juntos na confirmação. Para consultar um cliente já cadastrado, abra seu <Link to="/briefings" className="underline">histórico de briefings</Link>.</p>
      </CardContent></Card>}

      {/* Step 2: Select Template */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#F8F9FC]">Passo 2: Selecione o Modelo de Briefing</h2>
              <p className="text-xs text-[#B8B8C0] mt-0.5">
                Escolha o template com as perguntas específicas para este escopo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId
                const catCfg = BRIEFING_CATEGORY_CONFIG[tpl.category] || BRIEFING_CATEGORY_CONFIG.general
                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tpl.id)
                      if (!title) {
                        setTitle(`Briefing de ${tpl.name} — ${selectedClient?.name || ''}`)
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#252530] border-[#C74410] shadow-md shadow-[#C74410]/10'
                        : 'bg-[#1C1C24] border-[#30303B] hover:border-[#C74410]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: catCfg.color }}
                          />
                          <span className="text-[11px] font-semibold uppercase text-[#B8B8C0]">
                            {catCfg.label}
                          </span>
                          <Badge variant="outline">V{tpl.version}.0</Badge>
                        </div>
                        <h3 className="text-sm font-bold text-[#F8F9FC]">{tpl.name}</h3>
                        {tpl.description && (
                          <p className="text-xs text-[#B8B8C0]">{tpl.description}</p>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#C74410] shrink-0 mt-1" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Title and Description */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#F8F9FC]">Passo 3: Identificação do Briefing</h2>
              <p className="text-xs text-[#B8B8C0] mt-0.5">
                Defina o título do documento e orientações internas.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                  Título do Briefing <span className="text-red-400">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Ex: Briefing de Identidade Visual — ${selectedClient?.name || ''}`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                  Instruções e Observações Iniciais
                </label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruções para o cliente ou contexto estratégico da demanda..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review and Confirm */}
      {step === 4 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#F8F9FC]">Passo 4: Revisar e Criar</h2>
              <p className="text-xs text-[#B8B8C0] mt-0.5">
                Confirme os dados para cadastrar o cliente e iniciar o briefing da reunião.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-[#1C1C24] rounded-xl border border-[#30303B]">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[#30303B]">
                <span className="text-[#98989F]">Cliente Selecionado:</span>
                <span className="font-bold text-[#F8F9FC]">{selectedClient?.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[#30303B]">
                <span className="text-[#98989F]">Modelo Escolhido:</span>
                <span className="font-bold text-[#C74410]">{selectedTemplate?.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[#30303B]">
                <span className="text-[#98989F]">Título:</span>
                <span className="font-bold text-[#F8F9FC]">{title}</span>
              </div>
              {description && (
                <div className="text-xs pt-1">
                  <span className="text-[#98989F] block mb-1">Observações:</span>
                  <p className="text-[#B8B8C0] bg-[#111116] p-2.5 rounded-lg">{description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Creation Success & Action Choices */}
      {step === 5 && (
        <Card className="border-[#10B981]/40">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#F8F9FC]">Briefing Criado com Sucesso!</h2>
              <p className="text-xs text-[#B8B8C0]">
                O briefing foi registrado e está pronto para ser preenchido ou enviado.
              </p>
            </div>

            {/* Generated Link Display */}
            {generatedPublicUrl ? (
              <div className="p-4 bg-[#1C1C24] rounded-xl border border-[#30303B] text-left space-y-2">
                <span className="text-xs font-semibold text-[#10B981] flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Link Público Gerado:
                </span>
                <div className="flex items-center gap-2">
                  <Input value={generatedPublicUrl} readOnly />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPublicUrl)
                      toast.success('Link copiado!')
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a href={generatedPublicUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            ) : null}

            {/* Next actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerateLink}
                disabled={Boolean(generatedPublicUrl)}
              >
                <Share2 className="w-4 h-4" />
                <span>{generatedPublicUrl ? 'Link Gerado' : 'Gerar Link Público'}</span>
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/briefings/${createdBriefingId}/responses`)}
              >
                <FileText className="w-4 h-4" />
                <span>Preencher / Respostas</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/briefings/${createdBriefingId}/export`)}
              >
                <Sparkles className="w-4 h-4" />
                <span>Visualizar PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Navigation Buttons */}
      {step < 5 && (
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <Button variant="secondary" size="md" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
          ) : (
            <Link to="/briefings">
              <Button variant="ghost" size="md">
                Cancelar
              </Button>
            </Link>
          )}

          {step < 4 ? (
            <Button variant="primary" size="md" disabled={templateQuery.isLoading || templateQuery.isError || (step === 1 && !validIdentity) || (step === 2 && !selectedTemplate)} onClick={handleNext}>
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="primary" size="md" disabled={createBriefing.isPending || !validIdentity || !selectedTemplate} onClick={handleCreate}>
              <Check className="w-4 h-4" />
              <span>Confirmar e Criar Briefing</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
