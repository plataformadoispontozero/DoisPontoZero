import { INITIAL_BRIEFING_TEMPLATES } from "../constants/initialTemplates"
import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: FORM BUILDER — VISUAL TEMPLATE EDITOR
// /briefings/templates/new e /briefings/templates/:templateId/edit
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  Save,
  Check,
  Type,
  AlignLeft,
  CheckCircle,
  ListChecks,
  Calendar,
  Hash,
  Link as LinkIcon,
  Mail,
  Upload,
  Layers,
  Settings2,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toast'
import { useBriefingTemplate, useCreateTemplate } from '../hooks/useBriefings'
import {
  BRIEFING_CATEGORY_CONFIG,
  QUESTION_TYPE_CONFIG,
  type BriefingCategory,
  type QuestionType,
  type QuestionOption,
} from '@/types/briefing'

const DEMO_AGENCY_ID = 'demo-agency'

interface BuilderQuestion {
  id: string
  question_key: string
  label: string
  description?: string
  question_type: QuestionType
  is_required: boolean
  options: QuestionOption[]
  placeholder?: string
}

interface BuilderSection {
  id: string
  title: string
  description?: string
  questions: BuilderQuestion[]
}

const QUESTION_ICONS: Record<QuestionType, React.ElementType> = {
  short_text: Type,
  long_text: AlignLeft,
  single_choice: CheckCircle,
  multiple_choice: ListChecks,
  date: Calendar,
  number: Hash,
  url: LinkIcon,
  email: Mail,
  file_upload: Upload,
}

export const BriefingTemplateEditorPage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()

  const { templateId } = useParams<{ templateId: string }>()
  const [params]=useSearchParams()
  const saveRequest=useRef(crypto.randomUUID())
  const navigate = useNavigate()
  const { data: existingTemplate, isLoading } = useBriefingTemplate(templateId,DEMO_AGENCY_ID)
  const createTemplate = useCreateTemplate(DEMO_AGENCY_ID)

  // Form State
  const [name, setName] = useState('Novo Modelo de Briefing')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<BriefingCategory>('branding')
  const [sections, setSections] = useState<BuilderSection[]>([
    {
      id: 'sec-1',
      title: 'Contexto e Objetivos',
      description: 'Perguntas iniciais de alinhamento com o cliente.',
      questions: [
        {
          id: 'q-1',
          question_key: 'main_goal',
          label: 'Qual o objetivo principal desta demanda?',
          description: 'Descreva sucintamente o resultado esperado.',
          question_type: 'long_text',
          is_required: true,
          options: [],
          placeholder: 'Ex: Aumentar o reconhecimento da marca...',
        },
      ],
    },
  ])

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('q-1')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(()=>{if(templateId)return;const starter=INITIAL_BRIEFING_TEMPLATES.find(t=>t.id===params.get('starterId'));if(!starter)return;setName(starter.name);setDescription(starter.description);setCategory(starter.category);const mapped=starter.sections.map(s=>({...s,questions:s.questions.map(q=>({...q,options:q.options||[]}))}));setSections(mapped);setSelectedQuestionId(mapped[0]?.questions[0]?.id||'');setHasUnsavedChanges(true);},[templateId,params]);
  // Load existing template if editing
  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name)
      setDescription(existingTemplate.description || '')
      setCategory(existingTemplate.category)

      if (existingTemplate.sections && existingTemplate.sections.length > 0) {
        const mappedSections: BuilderSection[] = existingTemplate.sections.map((sec) => {
          const secQuestions = (existingTemplate.questions || []).filter((q) => q.section_id === sec.id)
          return {
            id: sec.id,
            title: sec.title,
            description: sec.description || undefined,
            questions: secQuestions.map((q) => ({
              id: q.id,
              question_key: q.question_key,
              label: q.label,
              description: q.description || undefined,
              question_type: q.question_type,
              is_required: q.is_required,
              options: q.options || [],
              placeholder: q.validation_rules?.placeholder,
            })),
          }
        })
        setSections(mappedSections)
        if (mappedSections[0]?.questions[0]) {
          setSelectedQuestionId(mappedSections[0].questions[0].id)
        }
      }
    }
  }, [existingTemplate])

  // Mark unsaved changes on mutation
  const markDirty = () => {saveRequest.current=crypto.randomUUID();setHasUnsavedChanges(true)}

  // Current active question
  let activeQuestion: BuilderQuestion | null = null
  let activeSectionIndex = -1
  let activeQuestionIndex = -1

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const qIdx = sections[sIdx].questions.findIndex((q) => q.id === selectedQuestionId)
    if (qIdx !== -1) {
      activeQuestion = sections[sIdx].questions[qIdx]
      activeSectionIndex = sIdx
      activeQuestionIndex = qIdx
      break
    }
  }

  // Section Operations
  const addSection = () => {
    markDirty()
    const newSecId = `sec-${Date.now()}`
    const newSection: BuilderSection = {
      id: newSecId,
      title: `Seção ${sections.length + 1}`,
      questions: [],
    }
    setSections([...sections, newSection])
  }

  const deleteSection = (secId: string) => {
    if (sections.length <= 1) {
      toast.error('O template precisa de pelo menos uma seção.')
      return
    }
    markDirty()
    setSections(sections.filter((s) => s.id !== secId))
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    )
      return
    markDirty()
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    const updated = [...sections]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    setSections(updated)
  }

  // Question Operations
  const addQuestion = (sectionId: string, type: QuestionType = 'short_text') => {
    markDirty()
    const newQId = `q-${Date.now()}`
    const newQ: BuilderQuestion = {
      id: newQId,
      question_key: `field_${Date.now().toString(36)}`,
      label: `Nova Pergunta (${QUESTION_TYPE_CONFIG[type].label})`,
      question_type: type,
      is_required: false,
      options:
        type === 'single_choice' || type === 'multiple_choice'
          ? [
              { id: '1', label: 'Opção 1', value: 'opcao_1' },
              { id: '2', label: 'Opção 2', value: 'opcao_2' },
            ]
          : [],
    }

    setSections(
      sections.map((sec) =>
        sec.id === sectionId ? { ...sec, questions: [...sec.questions, newQ] } : sec
      )
    )
    setSelectedQuestionId(newQId)
  }

  const duplicateQuestion = (secIdx: number, qIdx: number) => {
    markDirty()
    const original = sections[secIdx].questions[qIdx]
    const copyId = `q-copy-${Date.now()}`
    const copy: BuilderQuestion = {
      ...original,
      id: copyId,
      question_key: `${original.question_key}_copia`,
      label: `${original.label} (Cópia)`,
      options: [...original.options],
    }

    const updated = [...sections]
    updated[secIdx].questions.splice(qIdx + 1, 0, copy)
    setSections(updated)
    setSelectedQuestionId(copyId)
    toast.success('Pergunta duplicada!')
  }

  const deleteQuestion = (secIdx: number, qIdx: number) => {
    markDirty()
    const updated = [...sections]
    updated[secIdx].questions.splice(qIdx, 1)
    setSections(updated)
    toast.info('Pergunta removida.')
  }

  const moveQuestion = (secIdx: number, qIdx: number, direction: 'up' | 'down') => {
    const list = sections[secIdx].questions
    if (
      (direction === 'up' && qIdx === 0) ||
      (direction === 'down' && qIdx === list.length - 1)
    )
      return
    markDirty()
    const targetIdx = direction === 'up' ? qIdx - 1 : qIdx + 1
    const updatedSec = [...sections]
    const questions = [...updatedSec[secIdx].questions]
    const temp = questions[qIdx]
    questions[qIdx] = questions[targetIdx]
    questions[targetIdx] = temp
    updatedSec[secIdx].questions = questions
    setSections(updatedSec)
  }

  // Update Active Question Field
  const updateActiveQuestion = (patch: Partial<BuilderQuestion>) => {
    if (activeSectionIndex === -1 || activeQuestionIndex === -1) return
    markDirty()
    const updated = [...sections]
    updated[activeSectionIndex].questions[activeQuestionIndex] = {
      ...updated[activeSectionIndex].questions[activeQuestionIndex],
      ...patch,
    }
    setSections(updated)
  }

  // Save / Publish
  const handleSave = async (isPublishing: boolean) => {
    if (!name.trim()) {
      toast.error('Informe um nome para o modelo.')
      return
    }

    const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0)
    if (totalQuestions === 0) {
      toast.error('Adicione pelo menos uma pergunta ao modelo.')
      return
    }

    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        status:isPublishing?"published":"draft",
        source_template_id:templateId||null,
        save_request_id:saveRequest.current,
        description: description.trim() || undefined,
        category,
        sections: sections.map((sec, sIdx) => ({
          title: sec.title.trim(),
          description: sec.description?.trim() || undefined,
          position: sIdx,
          questions: sec.questions.map((q, qIdx) => ({
            question_key: q.question_key.trim(),
            label: q.label.trim(),
            description: q.description?.trim() || undefined,
            question_type: q.question_type,
            is_required: q.is_required,
            position: qIdx,
            options: q.options,
            validation_rules: q.placeholder ? { placeholder: q.placeholder } : {},
          })),
        })),
      })

      setHasUnsavedChanges(false)
      toast.success(isPublishing ? 'Template publicado com sucesso!' : 'Rascunho salvo com sucesso!')
      navigate('/briefings/templates')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o modelo. Verifique os campos e as permissões.')
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#30303B]">
        <div className="flex items-center gap-3">
          <Link to="/briefings/templates">
            <Button variant="ghost" size="sm" title="Voltar para Modelos">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-[#C74410]">Form Builder</span>
              {hasUnsavedChanges && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                  Alterações não salvas
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-[#F8F9FC]">{name || 'Sem título'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-3.5 h-3.5" />
            <span>Prévia</span>
          </Button>
          <Button variant="secondary" size="sm" disabled={createTemplate.isPending} onClick={() => handleSave(false)}>
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Rascunho</span>
          </Button>
          <Button variant="primary" size="sm" disabled={createTemplate.isPending} onClick={() => handleSave(true)}>
            <Check className="w-3.5 h-3.5" />
            <span>Publicar Modelo</span>
          </Button>
        </div>
      </div>

      {templateId&&<p className="rounded-xl border border-orange-500/25 p-3 text-sm text-orange-200">Salvar cria uma nova versão deste modelo. As perguntas e respostas das versões anteriores permanecem preservadas.</p>}

      {/* Meta Config Card */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-[#B8B8C0] block mb-1">Nome do Modelo</label>
            <Input
              aria-label="Nome do Modelo"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                markDirty()
              }}
              placeholder="Ex: Briefing de Branding & Rebranding"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#B8B8C0] block mb-1">Categoria de Demanda</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as BriefingCategory)
                markDirty()
              }}
              className="w-full bg-[#1C1C24] border border-[#30303B] rounded-lg px-3 py-2 text-sm text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
            >
              {(Object.keys(BRIEFING_CATEGORY_CONFIG) as BriefingCategory[]).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {BRIEFING_CATEGORY_CONFIG[catKey].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#B8B8C0] block mb-1">Descrição</label>
            <Input
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                markDirty()
              }}
              placeholder="Objetivo e escopo deste modelo..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 3-Column Studio Builder (Desktop: Left Palette, Center Canvas, Right Properties) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Component Palette (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8B8C0]">
                <Plus className="w-3.5 h-3.5 text-[#C74410]" />
                <span>Tipos de Perguntas</span>
              </div>
              <p className="text-[11px] text-[#98989F]">
                Clique para adicionar à seção ativa do formulário.
              </p>

              <div className="space-y-1.5 pt-1">
                {(Object.keys(QUESTION_TYPE_CONFIG) as QuestionType[]).map((typeKey) => {
                  const cfg = QUESTION_TYPE_CONFIG[typeKey]
                  const Icon = QUESTION_ICONS[typeKey]
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => {
                        const targetSecId = sections[activeSectionIndex]?.id || sections[0]?.id
                        if (targetSecId) addQuestion(targetSecId, typeKey)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#1C1C24] hover:bg-[#252530] border border-[#30303B]/60 hover:border-[#C74410]/50 text-left transition-all group"
                    >
                      <div className="w-6 h-6 rounded bg-[#252530] group-hover:bg-[#C74410]/20 flex items-center justify-center text-[#B8B8C0] group-hover:text-[#C74410] transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#F8F9FC]">{cfg.label}</div>
                        <div className="text-[10px] text-[#98989F] truncate">{cfg.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 border-t border-[#30303B]">
                <Button variant="secondary" size="sm" className="w-full" onClick={addSection}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Seção</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Form Canvas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {sections.map((section, sIdx) => (
            <Card key={section.id} className="border-[#30303B] overflow-hidden">
              {/* Section Header */}
              <div className="p-3 bg-[#1C1C24] border-b border-[#30303B] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-2 h-2 rounded-full bg-[#C74410]" />
                  <input
                    value={section.title}
                    onChange={(e) => {
                      const updated = [...sections]
                      updated[sIdx].title = e.target.value
                      setSections(updated)
                      markDirty()
                    }}
                    className="bg-transparent text-sm font-bold text-[#F8F9FC] focus:outline-none focus:border-b focus:border-[#C74410] flex-1"
                    placeholder="Título da Seção..."
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveSection(sIdx, 'up')}
                    disabled={sIdx === 0}
                    className="p-1 text-[#98989F] hover:text-[#F8F9FC] disabled:opacity-30"
                    title="Mover Seção para Cima"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(sIdx, 'down')}
                    disabled={sIdx === sections.length - 1}
                    className="p-1 text-[#98989F] hover:text-[#F8F9FC] disabled:opacity-30"
                    title="Mover Seção para Baixo"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-1 text-[#98989F] hover:text-red-400"
                    title="Excluir Seção"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Section Questions Canvas */}
              <CardContent className="p-3 space-y-2.5">
                {section.questions.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[#30303B] rounded-lg">
                    <p className="text-xs text-[#98989F]">Esta seção ainda não possui perguntas.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-[#C74410]"
                      onClick={() => addQuestion(section.id, 'short_text')}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Pergunta
                    </Button>
                  </div>
                ) : (
                  section.questions.map((q, qIdx) => {
                    const isSelected = q.id === selectedQuestionId
                    const Icon = QUESTION_ICONS[q.question_type]

                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuestionId(q.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#252530] border-[#C74410] shadow-sm shadow-[#C74410]/10'
                            : 'bg-[#1C1C24]/80 border-[#30303B]/60 hover:border-[#C74410]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className="w-5 h-5 rounded bg-[#111116] flex items-center justify-center text-[#C74410] shrink-0 mt-0.5">
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#F8F9FC] truncate">
                                  {q.label}
                                </span>
                                {q.is_required && (
                                  <span className="text-[10px] text-red-400 font-bold">*</span>
                                )}
                              </div>
                              {q.description && (
                                <p className="text-[11px] text-[#98989F] truncate mt-0.5">
                                  {q.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => moveQuestion(sIdx, qIdx, 'up')}
                              disabled={qIdx === 0}
                              className="p-1 text-[#98989F] hover:text-[#F8F9FC] disabled:opacity-30"
                              title="Subir"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveQuestion(sIdx, qIdx, 'down')}
                              disabled={qIdx === section.questions.length - 1}
                              className="p-1 text-[#98989F] hover:text-[#F8F9FC] disabled:opacity-30"
                              title="Descer"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => duplicateQuestion(sIdx, qIdx)}
                              className="p-1 text-[#98989F] hover:text-[#F8F9FC]"
                              title="Duplicar"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteQuestion(sIdx, qIdx)}
                              className="p-1 text-[#98989F] hover:text-red-400"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-[#B8B8C0] hover:text-[#F8F9FC] border border-dashed border-[#30303B]"
                  onClick={() => addQuestion(section.id, 'short_text')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Pergunta a esta Seção
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column: Properties Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card>
            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8B8C0] pb-2 border-b border-[#30303B]">
                <Settings2 className="w-3.5 h-3.5 text-[#C74410]" />
                <span>Propriedades do Campo</span>
              </div>

              {!activeQuestion ? (
                <div className="p-8 text-center text-xs text-[#98989F]">
                  Selecione uma pergunta no centro para editar seus detalhes.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                      Enunciado / Rótulo da Pergunta
                    </label>
                    <Input
                      value={activeQuestion.label}
                      onChange={(e) => updateActiveQuestion({ label: e.target.value })}
                      placeholder="Ex: Qual o público-alvo principal?"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                      Identificador Semântico (Key)
                    </label>
                    <Input
                      value={activeQuestion.question_key}
                      onChange={(e) => updateActiveQuestion({ question_key: e.target.value })}
                      placeholder="Ex: target_audience"
                    />
                    <span className="text-[10px] text-[#98989F] mt-0.5 block">
                      Usado na extração para Strategy e Proposal Studios.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                      Descrição / Instruções
                    </label>
                    <Textarea
                      rows={2}
                      value={activeQuestion.description || ''}
                      onChange={(e) => updateActiveQuestion({ description: e.target.value })}
                      placeholder="Instruções para o cliente ao preencher..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                      Tipo de Pergunta
                    </label>
                    <select
                      value={activeQuestion.question_type}
                      onChange={(e) =>
                        updateActiveQuestion({ question_type: e.target.value as QuestionType })
                      }
                      className="w-full bg-[#1C1C24] border border-[#30303B] rounded-lg px-3 py-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
                    >
                      {(Object.keys(QUESTION_TYPE_CONFIG) as QuestionType[]).map((tKey) => (
                        <option key={tKey} value={tKey}>
                          {QUESTION_TYPE_CONFIG[tKey].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                      Placeholder
                    </label>
                    <Input
                      value={activeQuestion.placeholder || ''}
                      onChange={(e) => updateActiveQuestion({ placeholder: e.target.value })}
                      placeholder="Ex: Digite sua resposta detalhada..."
                    />
                  </div>

                  {/* Required Switch */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#1C1C24] border border-[#30303B]">
                    <div>
                      <div className="text-xs font-semibold text-[#F8F9FC]">Campo Obrigatório</div>
                      <div className="text-[10px] text-[#98989F]">
                        Cliente deve preencher antes de enviar
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeQuestion.is_required}
                      onChange={(e) => updateActiveQuestion({ is_required: e.target.checked })}
                      className="w-4 h-4 accent-[#C74410]"
                    />
                  </div>

                  {/* Options Builder for Single/Multiple Choice */}
                  {(activeQuestion.question_type === 'single_choice' ||
                    activeQuestion.question_type === 'multiple_choice') && (
                    <div className="space-y-2 pt-2 border-t border-[#30303B]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#F8F9FC]">
                          Opções de Resposta
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-[#C74410]"
                          onClick={() => {
                            const newOpt: QuestionOption = {
                              id: String(Date.now()),
                              label: `Nova Opção ${activeQuestion?.options.length! + 1}`,
                              value: `opt_${Date.now()}`,
                            }
                            updateActiveQuestion({
                              options: [...(activeQuestion?.options || []), newOpt],
                            })
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        {activeQuestion.options.map((opt, oIdx) => (
                          <div key={opt.id} className="flex items-center gap-1.5">
                            <Input
                              value={opt.label}
                              onChange={(e) => {
                                const updatedOpts = [...activeQuestion!.options]
                                updatedOpts[oIdx] = {
                                  ...opt,
                                  label: e.target.value,
                                  value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                                }
                                updateActiveQuestion({ options: updatedOpts })
                              }}
                              placeholder={`Opção ${oIdx + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updatedOpts = activeQuestion!.options.filter(
                                  (_, idx) => idx !== oIdx
                                )
                                updateActiveQuestion({ options: updatedOpts })
                              }}
                              className="p-1.5 text-[#98989F] hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={() => setPreviewOpen(false)}>
        <DialogHeader onClose={() => setPreviewOpen(false)}>
          <DialogTitle>Pré-visualização do Formulário</DialogTitle>
          <DialogDescription>
            Como o formulário será exibido para o cliente final.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="text-center pb-4 border-b border-[#30303B]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C74410]">
              {BRIEFING_CATEGORY_CONFIG[category].label}
            </span>
            <h2 className="text-xl font-bold text-[#F8F9FC] mt-1">{name}</h2>
            {description && <p className="text-xs text-[#B8B8C0] mt-1">{description}</p>}
          </div>

          {sections.map((sec, sIdx) => (
            <div key={sec.id} className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-[#30303B]">
                <span className="text-xs font-bold text-[#C74410]">0{sIdx + 1}.</span>
                <h3 className="text-sm font-bold text-[#F8F9FC]">{sec.title}</h3>
              </div>

              <div className="space-y-3 pl-3">
                {sec.questions.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <label className="text-xs font-medium text-[#F8F9FC] block">
                      {q.label} {q.is_required && <span className="text-red-400">*</span>}
                    </label>
                    {q.description && <p className="text-[11px] text-[#98989F]">{q.description}</p>}

                    {q.question_type === 'long_text' ? (
                      <Textarea placeholder={q.placeholder || 'Sua resposta...'} rows={2} readOnly />
                    ) : q.question_type === 'single_choice' || q.question_type === 'multiple_choice' ? (
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2 text-xs text-[#B8B8C0]">
                            <input
                              type={q.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                              disabled
                              className="accent-[#C74410]"
                            />
                            <span>{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Input placeholder={q.placeholder || 'Sua resposta...'} readOnly />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(false)}>
            Fechar Prévia
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
