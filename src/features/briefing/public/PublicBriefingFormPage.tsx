// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PUBLIC BRIEFING FORM — MOBILE FIRST
// Route: /b/:publicToken (Standalone, Outside AppShell)
// ============================================================

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Calendar,
  Lock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { sha256Hex } from '../hooks/useBriefings'
import { INITIAL_BRIEFING_TEMPLATES } from '../constants/initialTemplates'
import type { QuestionType } from '@/types/briefing'

interface PublicQuestion {
  id: string
  section_id: string
  question_key: string
  label: string
  description?: string
  question_type: QuestionType
  is_required: boolean
  options?: { id: string; label: string; value: string }[]
  validation_rules?: any
}

interface PublicSection {
  id: string
  title: string
  description?: string
  position: number
}

interface PublicBriefingData {
  briefing: {
    id: string
    title: string
    description?: string
    status: string
  }
  agency: {
    name: string
    branding?: any
  }
  sections: PublicSection[]
  questions: PublicQuestion[]
}

export const PublicBriefingFormPage: React.FC = () => {
  const { publicToken } = useParams<{ publicToken: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PublicBriefingData | null>(null)

  // Multi-step progress
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false)

  // Fetch Public Briefing by Token
  useEffect(() => {
    async function fetchBriefing() {
      setLoading(true)
      setError(null)

      try {
        if (!publicToken) {
          setError('Token de preenchimento inválido.')
          setLoading(false)
          return
        }

        const tokenHash = await sha256Hex(publicToken)

        if (isSupabaseConfigured && supabase) {
          const { data: res, error: rpcErr } = await supabase.rpc('get_public_briefing', {
            p_token_hash: tokenHash,
          })

          if (rpcErr || !res || res.error) {
            setError(res?.message || 'Link de briefing expirado, revogado ou inválido.')
            setLoading(false)
            return
          }

          setData(res as PublicBriefingData)
        } else {
          // Demo fallback: use template 01 (Branding) for demonstration
          const fallbackTpl = INITIAL_BRIEFING_TEMPLATES[0]
          setData({
            briefing: {
              id: 'demo-briefing-public',
              title: 'Briefing de Alinhamento de Marca',
              description: 'Por favor, responda com atenção para que possamos estruturar o seu projeto criativo.',
              status: 'sent',
            },
            agency: {
              name: 'Dois.Zero Creative Agency',
              branding: {
                primaryColor: '#7952FF',
              },
            },
            sections: fallbackTpl.sections.map((s, idx) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              position: idx,
            })),
            questions: fallbackTpl.sections.flatMap((s) =>
              s.questions.map((q) => ({
                id: q.id,
                section_id: s.id,
                question_key: q.question_key,
                label: q.label,
                description: q.description,
                question_type: q.question_type,
                is_required: q.is_required,
                options: q.options,
                validation_rules: q.placeholder ? { placeholder: q.placeholder } : {},
              }))
            ),
          })
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar formulário.')
      } finally {
        setLoading(false)
      }
    }

    fetchBriefing()
  }, [publicToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101014] text-[#F8F9FC] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#7952FF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#A1A1B0]">Carregando formulário seguro...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#101014] text-[#F8F9FC] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500/30">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#F8F9FC]">Acesso Indisponível</h2>
            <p className="text-sm text-[#A1A1B0]">{error || 'Não foi possível acessar este briefing.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Current section & its questions
  const currentSection = data.sections[currentSectionIndex]
  const currentQuestions = data.questions.filter((q) => q.section_id === currentSection?.id)
  const totalSections = data.sections.length
  const progressPercent = Math.round(((currentSectionIndex + 1) / totalSections) * 100)

  // Field change
  const handleAnswerChange = (questionId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }))
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const copy = { ...prev }
        delete copy[questionId]
        return copy
      })
    }
  }

  // Validate current section
  const validateCurrentSection = (): boolean => {
    const errors: Record<string, string> = {}
    for (const q of currentQuestions) {
      if (q.is_required) {
        const val = answers[q.id]
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          errors[q.id] = 'Este campo é obrigatório.'
        }
      }
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Step Navigation
  const handleNext = () => {
    if (!validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Final Submission
  const handleSubmit = async () => {
    if (!validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)
    try {
      if (isSupabaseConfigured && supabase && publicToken) {
        const tokenHash = await sha256Hex(publicToken)
        const { data: res, error: submitErr } = await supabase.rpc('submit_public_briefing', {
          p_token_hash: tokenHash,
          p_answers: answers,
        })

        if (submitErr || !res?.success) {
          throw new Error(res?.error || 'Erro ao persistir respostas no servidor.')
        }
      }

      setIsSubmittedSuccess(true)
    } catch (err: any) {
      alert(`Erro ao enviar briefing: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success Screen
  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-[#101014] text-[#F8F9FC] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-[#10B981]/40 shadow-2xl shadow-[#10B981]/10">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#F8F9FC]">Briefing Enviado com Sucesso!</h2>
            <p className="text-sm text-[#A1A1B0] leading-relaxed">
              Obrigado por compartilhar suas informações com{' '}
              <strong className="text-[#F8F9FC]">{data.agency.name}</strong>. Nossa equipe criativa já
              recebeu suas respostas e iniciará o planejamento do projeto.
            </p>
            <div className="p-3 bg-[#1C1C24] rounded-lg border border-[#30303B] text-xs text-[#717182]">
              Uma cópia em PDF com versão auditada foi arquivada no sistema da agência.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101014] text-[#F8F9FC] pb-16">
      {/* Top Mobile/Desktop Brand Bar */}
      <header className="border-b border-[#30303B] bg-[#111116]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7952FF]">
              Briefing Oficial
            </span>
            <div className="text-sm font-bold text-[#F8F9FC]">{data.agency.name}</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#A1A1B0]">
            <Lock className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[11px]">Conexão Segura</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#1C1C24] h-1.5">
          <div
            className="bg-[#7952FF] h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Briefing Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#A1A1B0]">
            <span>
              Etapa {currentSectionIndex + 1} de {totalSections}
            </span>
            <span>{progressPercent}% preenchido</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F8F9FC]">{data.briefing.title}</h1>
          {data.briefing.description && (
            <p className="text-xs md:text-sm text-[#A1A1B0] leading-relaxed">
              {data.briefing.description}
            </p>
          )}
        </div>

        {/* Current Section Card */}
        <Card className="border-[#30303B]">
          <CardContent className="p-5 md:p-6 space-y-6">
            <div className="pb-3 border-b border-[#30303B]">
              <h2 className="text-base font-bold text-[#F8F9FC] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7952FF]" />
                {currentSection?.title}
              </h2>
              {currentSection?.description && (
                <p className="text-xs text-[#A1A1B0] mt-1">{currentSection.description}</p>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {currentQuestions.map((q) => {
                const errorMsg = validationErrors[q.id]
                const val = answers[q.id]

                return (
                  <div key={q.id} className="space-y-2">
                    <label className="text-sm font-semibold text-[#F8F9FC] block">
                      {q.label} {q.is_required && <span className="text-red-400">*</span>}
                    </label>

                    {q.description && (
                      <p className="text-xs text-[#A1A1B0] leading-relaxed">{q.description}</p>
                    )}

                    {/* Question Input Renderers */}
                    {q.question_type === 'short_text' && (
                      <Input
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.validation_rules?.placeholder || 'Sua resposta...'}
                      />
                    )}

                    {q.question_type === 'long_text' && (
                      <Textarea
                        rows={3}
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.validation_rules?.placeholder || 'Descreva detalhadamente...'}
                      />
                    )}

                    {q.question_type === 'number' && (
                      <Input
                        type="number"
                        value={val ?? ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="0"
                      />
                    )}

                    {q.question_type === 'date' && (
                      <Input
                        type="date"
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      />
                    )}

                    {q.question_type === 'url' && (
                      <Input
                        type="url"
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="https://..."
                      />
                    )}

                    {q.question_type === 'email' && (
                      <Input
                        type="email"
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="contato@empresa.com"
                      />
                    )}

                    {q.question_type === 'single_choice' && (
                      <div className="space-y-2 pt-1">
                        {q.options?.map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              val === opt.value
                                ? 'bg-[#252530] border-[#7952FF] text-[#F8F9FC]'
                                : 'bg-[#1C1C24] border-[#30303B] text-[#A1A1B0] hover:border-[#7952FF]/40'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={opt.value}
                              checked={val === opt.value}
                              onChange={() => handleAnswerChange(q.id, opt.value)}
                              className="w-4 h-4 accent-[#7952FF]"
                            />
                            <span className="text-xs md:text-sm font-medium">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.question_type === 'multiple_choice' && (
                      <div className="space-y-2 pt-1">
                        {q.options?.map((opt) => {
                          const currentArr = Array.isArray(val) ? val : []
                          const isChecked = currentArr.includes(opt.value)

                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-[#252530] border-[#7952FF] text-[#F8F9FC]'
                                  : 'bg-[#1C1C24] border-[#30303B] text-[#A1A1B0] hover:border-[#7952FF]/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                value={opt.value}
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleAnswerChange(q.id, [...currentArr, opt.value])
                                  } else {
                                    handleAnswerChange(
                                      q.id,
                                      currentArr.filter((v: any) => v !== opt.value)
                                    )
                                  }
                                }}
                                className="w-4 h-4 accent-[#7952FF]"
                              />
                              <span className="text-xs md:text-sm font-medium">{opt.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {q.question_type === 'file_upload' && (
                      <div className="p-4 border border-dashed border-[#30303B] rounded-lg text-center bg-[#1C1C24]/50">
                        <Upload className="w-6 h-6 text-[#7952FF] mx-auto mb-2" />
                        <p className="text-xs text-[#A1A1B0] mb-2">
                          {val ? `Arquivo selecionado: ${val}` : 'Anexe referências, PDFs ou imagens'}
                        </p>
                        <input
                          type="file"
                          id={`file-${q.id}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleAnswerChange(q.id, file.name)
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => document.getElementById(`file-${q.id}`)?.click()}
                        >
                          Escolher Arquivo
                        </Button>
                      </div>
                    )}

                    {errorMsg && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errorMsg}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-2">
          {currentSectionIndex > 0 ? (
            <Button variant="secondary" size="md" onClick={handlePrev}>
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
          ) : (
            <div />
          )}

          {currentSectionIndex < totalSections - 1 ? (
            <Button variant="primary" size="md" onClick={handleNext}>
              <span>Próxima Etapa</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#10B981] hover:bg-[#10B981]/90 text-white"
            >
              {isSubmitting ? (
                <span>Enviando respostas...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir e Enviar Briefing</span>
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
