import { useAuth } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PUBLIC STANDALONE COMMERCIAL PROPOSAL PRESENTATION
// Route: /p/:publicToken (Standalone page for external clients)
// ============================================================

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Calendar,
  DollarSign,
  Download,
  Building,
  ShieldCheck,
  Send,
} from 'lucide-react'
import { defaultBranding } from '@/config/branding'
import { formatCurrencyCents } from '../services/pricingEngine'

export const PublicProposalViewPage: React.FC = () => {
  const auth = useAuth()
  const { publicToken } = useParams<{ publicToken: string }>()

  const [loading, setLoading] = useState(true)
  const [proposalData, setProposalData] = useState<any>(null)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)

  // Feedback Form State
  const [feedbackDecision, setFeedbackDecision] = useState<'accepted' | 'rejected' | 'negotiation' | null>(null)
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    if (!auth.isDemo) { setProposalData(null); setLoading(false); return }
    // Explicit loopback demo only; real public RPC needs schema reconciliation.
    setTimeout(() => {
      setProposalData({
        title: 'Campanha de Posicionamento & Social Media',
        proposal_number: 'PROP-2026-001',
        agency_name: defaultBranding.company?.legalName || defaultBranding.name || 'Matriz Criativa',
        agency_logo: '',
        client_name: 'Acme Corp Brasil',
        valid_until: '15 de Novembro de 2026',
        created_at: '10 de Outubro de 2026',
        status: 'published',
        sections: [
          {
            title: 'Apresentação da Agência',
            content: { text: 'Somos uma agência criativa focada em transformar marcas em autoridades digitais por meio de conteúdo relevante e design de alto impacto.' },
          },
          {
            title: 'Diagnóstico & Desafios Identificados',
            content: { text: 'Identificamos a necessidade de acelerar a presença de marca, padronizar a identidade estética dos canais e gerar engajamento qualificado com o público-alvo.' },
          },
          {
            title: 'Objetivos do Projeto',
            content: { list: ['Aumentar o alcance orgânico em 40%', 'Construir linha editorial alinhada à autoridade de mercado', 'Melhorar a taxa de conversão em interações diretas (WhatsApp/Direct)'] },
          },
          {
            title: 'Entregáveis Mensais',
            content: { list: ['12 Postagens no Feed (Estáticos/Carrosséis)', '8 Vídeos Curtos (Reels/TikTok)', '20 Histórias Semanais', 'Relatório de Performance Mensal com Análise de KPIs'] },
          },
        ],
        items: [
          { name: 'Gestão de Mídias Sociais - Plano Master', quantity: 1, unit: 'mês', billing_type: 'recurring', total_cents: 350000 },
          { name: 'Setup Inicial & Estruturação de Canais', quantity: 1, unit: 'taxa única', billing_type: 'one_time', total_cents: 150000 },
        ],
        pricing: {
          subtotal_cents: 500000,
          discount_cents: 0,
          total_cents: 500000,
          one_time_total_cents: 150000,
          recurring_monthly_total_cents: 350000,
          currency: 'BRL',
          payment_terms: '50% no aceite e mensalidades consecutivas.',
        },
      })
      setLoading(false)
    }, 600)
  }, [publicToken, auth.isDemo])

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackDecision) return
    setFeedbackSubmitted(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Carregando proposta comercial interativa...</p>
        </div>
      </div>
    )
  }

  if (!proposalData) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Link Inválido ou Expirado</h2>
          <p className="text-xs text-slate-400">Não foi possível validar este link. A visualização pública depende do contrato seguro de publicação no backend.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans antialiased selection:bg-purple-500 selection:text-white">
      {/* Top Header Banner */}
      <header className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {proposalData.agency_logo ? (
              <img src={proposalData.agency_logo} alt={proposalData.agency_name} className="h-7 object-contain" />
            ) : (
              <span className="font-bold text-lg text-purple-400">{proposalData.agency_name}</span>
            )}
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">
              {proposalData.proposal_number}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden md:inline">Validade: {proposalData.valid_until}</span>
            <a
              href="#aceite"
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
            >
              Responder Proposta
            </a>
          </div>
        </div>
      </header>

      {/* Hero Cover Banner */}
      <section className="border-b border-slate-800/80 bg-gradient-to-b from-[#131B2E] to-[#0B0F19] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-semibold">
            Proposta Comercial Apresentada a
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{proposalData.title}</h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Elaborada por <strong className="text-slate-200">{proposalData.agency_name}</strong> para <strong className="text-slate-200">{proposalData.client_name}</strong>
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Interactive Navigation & Sections (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Dynamic Sections */}
          {proposalData.sections.map((sec: any, idx: number) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#131B2E]/60 border border-slate-800/80 space-y-4">
              <h3 className="text-xl font-bold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {sec.title}
              </h3>

              {sec.content?.text && (
                <p className="text-sm text-slate-300 leading-relaxed">{sec.content.text}</p>
              )}

              {Array.isArray(sec.content?.list) && (
                <ul className="space-y-2 text-sm text-slate-300">
                  {sec.content.list.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Detailed Deliverables & Scope */}
          <div className="p-6 rounded-2xl bg-[#131B2E]/60 border border-slate-800/80 space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-slate-800/80 pb-3">
              Escopo & Tabela de Serviços
            </h3>

            <div className="divide-y divide-slate-800">
              {proposalData.items.map((item: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-white block">{item.name}</span>
                    <span className="text-xs text-slate-400">{item.quantity} {item.unit} • {item.billing_type === 'recurring' ? 'Mensal' : 'Pontual'}</span>
                  </div>
                  <span className="font-bold text-purple-400">{formatCurrencyCents(item.total_cents)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Acceptance / Feedback Form */}
          <div id="aceite" className="p-6 rounded-2xl bg-[#131B2E] border border-purple-500/30 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Manifestação de Interesse Comercial</h3>
                <p className="text-xs text-slate-400">Responda diretamente para a equipe da agência através desta proposta interativa.</p>
              </div>
            </div>

            {feedbackSubmitted ? (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-purple-400 mx-auto" />
                <h4 className="font-bold text-white text-base">Resposta Registrada com Sucesso!</h4>
                <p className="text-xs text-slate-300">A equipe da {proposalData.agency_name} recebeu sua notificação e entrará em contato.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackDecision('accepted')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      feedbackDecision === 'accepted'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    Aceitar Proposta
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackDecision('negotiation')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      feedbackDecision === 'negotiation'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    Solicitar Ajustes
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackDecision('rejected')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      feedbackDecision === 'rejected'
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 mx-auto mb-1 text-red-400" />
                    Recusar Proposta
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Seu Nome Completo"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Seu E-mail Corporativo"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <textarea
                  rows={3}
                  placeholder="Observações ou comentários sobre sua decisão (opcional)..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />

                <button
                  type="submit"
                  disabled={!feedbackDecision}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Resposta Comercial
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Financial Summary Box (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800/80 sticky top-24 space-y-4">
            <h4 className="font-bold text-white text-base border-b border-slate-800 pb-2">
              Resumo do Investimento
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Setup / Investimento Pontual:</span>
                <span className="font-semibold text-white">{formatCurrencyCents(proposalData.pricing.one_time_total_cents)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Mensalidade / Recorrente:</span>
                <span className="font-semibold text-white">{formatCurrencyCents(proposalData.pricing.recurring_monthly_total_cents)}/mês</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-white text-sm">Investimento Total:</span>
                <span className="font-black text-xl text-purple-400">{formatCurrencyCents(proposalData.pricing.total_cents)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 pt-2">{proposalData.pricing.payment_terms}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
