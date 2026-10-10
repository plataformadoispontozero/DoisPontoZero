// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Types for PDF Generation and Document Model
// ============================================================

export interface PdfBrandingConfig {
  agencyName: string
  logoUrl?: string
  symbolUrl?: string
  primaryColor: string
  secondaryColor: string
  footerText?: string
  accentColor?: string
}

export interface BriefingPdfQuestionItem {
  id: string
  label: string
  description?: string
  questionType: string
  answerText: string
  hasAnswer: boolean
}

export interface BriefingPdfSectionItem {
  id: string
  title: string
  description?: string
  questions: BriefingPdfQuestionItem[]
}

export interface BriefingPdfModel {
  briefingId: string
  documentId: string
  title: string
  description?: string
  clientName: string
  clientLogoUrl?: string
  category: string
  categoryLabel: string
  version: number
  statusLabel: string
  formattedDate: string
  branding: PdfBrandingConfig
  sections: BriefingPdfSectionItem[]
  metadata: {
    totalQuestions: number
    answeredQuestions: number
    completionRate: number
    generatedAt: string
  }
}
