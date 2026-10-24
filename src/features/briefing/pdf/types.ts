// ============================================================
// DOIS.ZERO | 2.0
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
  headerStyle?: "centered_logo" | "left_logo" | "minimal"
  pageFormat?: "A4" | "Letter"
  documentFont?: string
  showLogo?: boolean
  showWatermark?: boolean
  watermarkOpacity?: number
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
  agencyId?: string
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
