// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF TRANSFORMER
// Convert raw Presentation domain entity into immutable PDF model
// ============================================================

import type { Presentation } from '@/types/presentations'
import type { PresentationPdfModel } from './types'
import { defaultBranding } from '@/config/branding'

export function transformPresentationToPdfModel(
  presentation: Presentation,
  customBranding?: Record<string, any>
): PresentationPdfModel {
  const agencyName = customBranding?.agencyName || defaultBranding.company?.legalName || defaultBranding.name || 'Matriz Criativa Agência OS'
  const logoUrl = customBranding?.logoUrl || ''
  const primaryColor = customBranding?.primaryColor || defaultBranding.colors.primary || '#7952FF'
  const website = customBranding?.website || 'https://doiszero.com'

  const dateFormatted = new Date(presentation.created_at || Date.now()).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const monthName = months[presentation.period_month - 1] || 'Outubro'
  const periodFormatted = `${monthName} / ${presentation.period_year}`

  return {
    presentationId: presentation.id,
    title: presentation.title || 'Apresentação de Entregas Criativas',
    clientName: presentation.client_name || 'Cliente',
    periodFormatted,
    dateFormatted,
    sections: presentation.sections || [],
    assets: presentation.assets || [],
    branding: {
      agencyName,
      logoUrl,
      primaryColor,
      website,
    },
  }
}
