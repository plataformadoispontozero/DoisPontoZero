import { isSupabaseConfigured } from '@/lib/supabase/client'
import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: BRIEFING RESPONSES VIEW
// Route: /briefings/:briefingId/responses
// ============================================================

import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Share2,
  Clock,
  User,
  Download,
  MessageSquare,
  History,
  Check,
  RotateCcw,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { useBriefing, useUpdateBriefingStatus } from './hooks/useBriefings'
import { BRIEFING_STATUS_CONFIG } from '@/types/briefing'
import { INITIAL_BRIEFING_TEMPLATES } from './constants/initialTemplates'
import { toast } from '@/components/ui/Toast'

const DEMO_AGENCY_ID = 'demo-agency'

export const BriefingResponsesPage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()

  const { briefingId } = useParams<{ briefingId: string }>()
  const navigate = useNavigate()
  const { data: realBriefing, isLoading } = useBriefing(briefingId)
  const updateStatus = useUpdateBriefingStatus(DEMO_AGENCY_ID, briefingId || '')

  // Fallback demo briefing if not in database
  const fallbackTpl = INITIAL_BRIEFING_TEMPLATES[0]
  const briefing =
    realBriefing || {
      id: briefingId || 'demo-briefing-1',
      agency_id: DEMO_AGENCY_ID,
      client_id: 'client-1',
      template_id: fallbackTpl.id,
      template_version: 1,
      title: 'Briefing de Identidade Visual e Posicionamento',
      description: 'Demandas estruturais para rebranding corporativo e manual de marca.',
      status: 'submitted' as const,
      created_by: null,
      assigned_to: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      approved_at: null,
      archived_at: null,
      client: {
        id: 'client-1',
        agency_id: DEMO_AGENCY_ID,
        name: 'Natura Cosméticos',
        slug: 'natura',
        logo_url: null,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      template: {
        id: fallbackTpl.id,
        agency_id: DEMO_AGENCY_ID,
        name: fallbackTpl.name,
        description: fallbackTpl.description,
        category: fallbackTpl.category,
        status: 'published' as const,
        version: 1,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: null,
        sections: fallbackTpl.sections.map((s, idx) => ({
          id: s.id,
          agency_id: DEMO_AGENCY_ID,
          template_id: fallbackTpl.id,
          title: s.title,
          description: s.description ?? null,
          position: idx,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        questions: fallbackTpl.sections.flatMap((s) =>
          s.questions.map((q, qIdx) => ({
            id: q.id,
            agency_id: DEMO_AGENCY_ID,
            template_id: fallbackTpl.id,
            section_id: s.id,
            question_key: q.question_key,
            label: q.label,
            description: q.description ?? null,
            question_type: q.question_type,
            is_required: q.is_required,
            position: qIdx,
            options: q.options || [],
            validation_rules: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        ),
      },
      answers: [
        {
          id: 'ans-1',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-1-1',
          answer_value:
            'A empresa nasceu há 12 anos com o objetivo de conectar produtos naturais sustentáveis com o consumidor urbano. Hoje atendemos mais de 250k clientes.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-2',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-1-2',
          answer_value:
            'Missão: Democratizar o consumo ético e ecológico. Valores: Transparência, pureza botânica e impacto positivo.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-3',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-2-1',
          answer_value:
            'Produtos 100% livres de crueldade animal com formulação patenteada e embalagens biodegradáveis que se decompõem em 90 dias.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-4',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-2-2',
          answer_value: 'criador',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-5',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-3-1',
          answer_value:
            'Mulheres e homens de 25 a 45 anos, residentes em capitais, classe A/B, conscientes sobre sustentabilidade e bem-estar.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-6',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-4-1',
          answer_value: 'Sofisticada, Botânica, Transparente, Inspiradora, Contemporânea',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-7',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-4-2',
          answer_value: 'amigavel',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-8',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-8-1',
          answer_value: ['logo', 'manual', 'colors_typo', 'social_templates'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    }

  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [internalNotes, setInternalNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'responses' | 'audit'>('responses')

  const answersMap = new Map<string, any>()
  if (briefing.answers) {
    for (const a of briefing.answers) {
      answersMap.set(a.question_id, a.answer_value)
    }
  }

  const statusCfg = BRIEFING_STATUS_CONFIG[briefing.status]

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({ status: 'approved' })
      toast.success('Briefing aprovado com sucesso!')
    } catch (err) {
      toast.error('Erro ao aprovar briefing.')
    }
  }

  const handleRequestChanges = async () => {
    try {
      await updateStatus.mutateAsync({ status: 'changes_requested', notes: internalNotes })
      toast.info('Solicitação de ajustes registrada.')
      setNotesModalOpen(false)
    } catch (err) {
      toast.error('Erro ao registrar solicitação.')
    }
  }

  if (isSupabaseConfigured && (!realBriefing)) return <div role="alert">Recurso indisponível, carregando ou sem permissão. Nenhum exemplo substitui o recurso da agência.</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#30303B]">
        <div className="flex items-center gap-3">
          <Link to="/briefings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={statusCfg.badgeVariant}>{statusCfg.label}</Badge>
              <span className="text-xs text-[#98989F]">V{briefing.template_version}.0</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-[#F8F9FC] mt-0.5">
              {briefing.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotesModalOpen(true)}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Nota Interna</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/briefings/${briefing.id}/export`)}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C74410]" />
            <span>Exportar PDF</span>
          </Button>

          {briefing.status !== 'approved' && (
            <Button variant="primary" size="sm" onClick={handleApprove}>
              <Check className="w-3.5 h-3.5" />
              <span>Aprovar Briefing</span>
            </Button>
          )}
        </div>
      </div>

      {/* Meta overview card */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#98989F] block mb-0.5">Cliente:</span>
            <span className="font-bold text-[#F8F9FC]">{briefing.client?.name || 'Geral'}</span>
          </div>
          <div>
            <span className="text-[#98989F] block mb-0.5">Modelo:</span>
            <span className="font-bold text-[#C74410]">{briefing.template?.name}</span>
          </div>
          <div>
            <span className="text-[#98989F] block mb-0.5">Data de Envio:</span>
            <span className="text-[#B8B8C0]">
              {new Date(briefing.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div>
            <span className="text-[#98989F] block mb-0.5">Recebido em:</span>
            <span className="text-[#B8B8C0]">
              {briefing.submitted_at
                ? new Date(briefing.submitted_at).toLocaleDateString('pt-BR')
                : 'Aguardando cliente'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Sections and Questions with Answers */}
      <div className="space-y-6">
        {briefing.template?.sections?.map((sec, sIdx) => {
          const secQuestions = (briefing.template?.questions || []).filter(
            (q) => q.section_id === sec.id
          )

          return (
            <Card key={sec.id} className="border-[#30303B] overflow-hidden">
              <div className="p-4 bg-[#1C1C24] border-b border-[#30303B] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-[#C74410]/20 text-[#C74410] flex items-center justify-center font-bold text-xs">
                    0{sIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#F8F9FC]">{sec.title}</h3>
                    {sec.description && (
                      <p className="text-[11px] text-[#98989F]">{sec.description}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">
                  {secQuestions.length} campo{secQuestions.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <CardContent className="p-5 space-y-4">
                {secQuestions.map((q) => {
                  const rawAns = answersMap.get(q.id)
                  let displayVal = '— Não respondido —'

                  if (rawAns !== undefined && rawAns !== null && rawAns !== '') {
                    if (Array.isArray(rawAns)) {
                      displayVal = rawAns
                        .map((v) => q.options?.find((o) => o.value === v)?.label || v)
                        .join(', ')
                    } else {
                      const opt = q.options?.find((o) => o.value === rawAns)
                      displayVal = opt ? opt.label : String(rawAns)
                    }
                  }

                  const hasAnswer = rawAns !== undefined && rawAns !== null && rawAns !== ''

                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-[#1C1C24]/60 border border-[#30303B]/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#F8F9FC]">{q.label}</span>
                        <span className="text-[10px] text-[#98989F] uppercase">{q.question_type}</span>
                      </div>

                      <div
                        className={`text-xs p-2.5 rounded-lg border ${
                          hasAnswer
                            ? 'bg-[#111116] border-[#30303B] text-[#F8F9FC] leading-relaxed'
                            : 'bg-transparent border-dashed border-[#30303B] text-[#98989F] italic'
                        }`}
                      >
                        {displayVal}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Internal Notes / Adjustments Dialog */}
      <Dialog open={notesModalOpen} onOpenChange={() => setNotesModalOpen(false)}>
        <DialogHeader onClose={() => setNotesModalOpen(false)}>
          <DialogTitle>Observação Interna & Solicitação de Ajustes</DialogTitle>
          <DialogDescription>
            Notas internas registradas para a equipe ou justificativa para reenvio de briefing.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <label className="text-xs font-medium text-[#B8B8C0] block">
            Descreva o apontamento ou ajuste necessário:
          </label>
          <Textarea
            rows={4}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Ex: Cliente não informou as referências de concorrentes diretos..."
          />
          <span className="text-[11px] text-[#98989F] block">
            Esta nota é estritamente confidencial para a equipe interna e não aparece no PDF do cliente.
          </span>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setNotesModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="secondary" size="sm" onClick={handleRequestChanges}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Solicitar Ajustes</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
