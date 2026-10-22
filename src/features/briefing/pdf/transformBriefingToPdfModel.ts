// ============================================================
// DOIS.ZERO | 2.0
// FASE 06: PDF STUDIO
// Transform Briefing & Answers into Validated BriefingPdfModel
// ============================================================

import type { Briefing } from '@/types/briefing'
import { BRIEFING_STATUS_CONFIG, BRIEFING_CATEGORY_CONFIG } from '@/types/briefing'
import type { BriefingPdfModel, BriefingPdfSectionItem, BriefingPdfQuestionItem, PdfBrandingConfig } from './types'

export function transformBriefingToPdfModel(
  briefing: Briefing,
  brandingConfig?: Partial<PdfBrandingConfig>
): BriefingPdfModel {
  if (!briefing || !briefing.title || !briefing.title.trim()) {
    throw new Error('Título do briefing é obrigatório para exportação em PDF.')
  }

  const branding: PdfBrandingConfig = {
    agencyName: brandingConfig?.agencyName || '2.0',
    logoUrl: brandingConfig?.logoUrl,
    symbolUrl: brandingConfig?.symbolUrl,
    primaryColor: brandingConfig?.primaryColor || '#C74410',
    secondaryColor: brandingConfig?.secondaryColor || '#1C1C24',
    accentColor: brandingConfig?.accentColor || '#FF8759',
    headerStyle: brandingConfig?.headerStyle,
    pageFormat: brandingConfig?.pageFormat,
    documentFont: brandingConfig?.documentFont,
    showLogo: brandingConfig?.showLogo,
    showWatermark: brandingConfig?.showWatermark,
    watermarkOpacity: brandingConfig?.watermarkOpacity,
    footerText: brandingConfig?.footerText ?? 'Documento confidencial gerado por 2.0.',
  }

  const category = (briefing.template?.category || 'general') as keyof typeof BRIEFING_CATEGORY_CONFIG
  const categoryLabel = BRIEFING_CATEGORY_CONFIG[category]?.label || 'Geral'
  const statusConfig = BRIEFING_STATUS_CONFIG[briefing.status] || { label: 'Rascunho' }

  // Map answers to lookup map
  const answersMap = new Map<string, any>()
  if (briefing.answers) {
    for (const ans of briefing.answers) {
      answersMap.set(ans.question_id, ans.answer_value)
    }
  }

  let totalQuestions = 0
  let answeredQuestions = 0

  const templateSections = briefing.template?.sections ?? []
  const templateQuestions = briefing.template?.questions ?? []

  const sections: BriefingPdfSectionItem[] = templateSections.map((sec) => {
    // Questions in this section
    const secQuestions = templateQuestions.filter((q) => q.section_id === sec.id)

    const questionItems: BriefingPdfQuestionItem[] = secQuestions.map((q) => {
      totalQuestions++
      const rawVal = answersMap.get(q.id)

      let answerText = ''
      let hasAnswer = false

      if (rawVal === undefined || rawVal === null || rawVal === '') {
        answerText = '— Não informado —'
        hasAnswer = false
      } else if (Array.isArray(rawVal)) {
        if (rawVal.length === 0) {
          answerText = '— Não informado —'
          hasAnswer = false
        } else {
          // Find option labels if available
          const optionLabels = rawVal.map((v) => {
            const opt = q.options?.find((o) => o.value === v)
            return opt ? opt.label : String(v)
          })
          answerText = optionLabels.join(' • ')
          hasAnswer = true
          answeredQuestions++
        }
      } else if (typeof rawVal === 'boolean') {
        answerText = rawVal ? 'Sim' : 'Não'
        hasAnswer = true
        answeredQuestions++
      } else {
        // String or number
        const opt = q.options?.find((o) => o.value === String(rawVal))
        answerText = opt ? opt.label : String(rawVal)
        hasAnswer = true
        answeredQuestions++
      }

      return {
        id: q.id,
        label: q.label,
        description: q.description || undefined,
        questionType: q.question_type,
        answerText,
        hasAnswer,
      }
    })

    return {
      id: sec.id,
      title: sec.title,
      description: sec.description || undefined,
      questions: questionItems,
    }
  })

  const completionRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  const rawDate = briefing.submitted_at || briefing.created_at || new Date().toISOString()
  const parsedDate = isNaN(new Date(rawDate).getTime()) ? new Date() : new Date(rawDate)
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)

  const version=Number.isInteger(briefing.template_version)&&briefing.template_version>0?briefing.template_version:1
  const documentId = `BRF-${briefing.id.slice(0, 8).toUpperCase()}-V${version}`

  const model: BriefingPdfModel = {
    agencyId: briefing.agency_id,
    briefingId: briefing.id,
    documentId,
    title: briefing.title,
    description: briefing.description || undefined,
    clientName: briefing.client?.name || 'Cliente Geral',
    clientLogoUrl: briefing.client?.logo_url || undefined,
    category,
    categoryLabel,
    version,
    statusLabel: statusConfig.label,
    formattedDate,
    branding,
    sections,
    metadata: {
      totalQuestions,
      answeredQuestions,
      completionRate,
      generatedAt: new Date().toISOString(),
    },
  }

  // Validate model before returning
  if (!model.title) {
    throw new Error('Título do briefing é obrigatório para exportação em PDF.')
  }

  return model
}
