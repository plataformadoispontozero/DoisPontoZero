// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF TRANSFORMER
// Convert raw Presentation domain entity into immutable PDF model
// ============================================================

import type { Presentation } from '@/types/presentations'
import type { PresentationPdfModel } from './types'
import { defaultBranding } from '@/config/branding'

/**
 * Normalizes any branding object (flat PDF branding or full BrandingConfig)
 * into the fields expected by PresentationPdfModel.
 */
function resolveBranding(customBranding?: Record<string, any>) {
  // Accept both flat { agencyName, logoUrl, primaryColor, website }
  // and full BrandingConfig { name, company, colors, ... }
  const agencyName =
    customBranding?.agencyName ||
    customBranding?.company?.legalName ||
    customBranding?.name ||
    defaultBranding.company?.legalName ||
    defaultBranding.name ||
    'Dois.Zero'

  const logoUrl = customBranding?.logoUrl || ''

  const primaryColor =
    customBranding?.primaryColor ||
    customBranding?.colors?.primary ||
    defaultBranding.colors?.primary ||
    '#C74410'

  const website =
    customBranding?.website ||
    'https://doispontozero.renatodesigner.com.br'

  return { agencyName, logoUrl, primaryColor, website }
}

export function transformPresentationToPdfModel(
  presentation: Presentation,
  customBranding?: Record<string, any>
): PresentationPdfModel {
  const branding = resolveBranding(customBranding)

  const dateFormatted = new Date(presentation.created_at || Date.now()).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const monthIdx = (presentation.period_month ?? 10) - 1
  const monthName = months[monthIdx] ?? 'Outubro'
  const periodFormatted = `${monthName} / ${presentation.period_year ?? new Date().getFullYear()}`

  return {
    presentationId: presentation.id,
    title: presentation.title?.trim() || 'Apresentação de Entregas Criativas',
    clientName: presentation.client_name?.trim() || 'Cliente',
    periodFormatted,
    dateFormatted,
    sections: presentation.sections ?? [],
    assets: presentation.assets ?? [],
    branding,
  }
}
