import type { AgencyBrandingData, AgencyDocumentSettingsData } from '@/types/whitelabel'
import type { PdfBrandingConfig } from './types'

export const platformDocumentText = (text: string) => text.replace(/Creative Agency OS/gi, '2.0')
export function resolveDocumentPdfBranding(branding: AgencyBrandingData, settings: AgencyDocumentSettingsData): PdfBrandingConfig {
  const official = /^(dois[.\s_-]*zero|2\.0)\b/i.test(branding.display_name)
  return {
    agencyName: branding.display_name || '2.0',
    logoUrl: official ? '/pdf-brand/wordmark.jpg' : branding.logo_dark_path || branding.logo_light_path || undefined,
    symbolUrl: official ? '/pdf-brand/symbol.jpg' : branding.symbol_path || undefined,
    primaryColor: branding.primary_color,
    secondaryColor: branding.secondary_color,
    accentColor: branding.accent_color,
    footerText: platformDocumentText(settings.footer_text),
    headerStyle: settings.header_style,
    pageFormat: settings.page_format,
    documentFont: ['Helvetica', 'Times-Roman', 'Courier'].includes(settings.document_font) ? settings.document_font : 'Helvetica',
    showLogo: settings.show_logo,
    showWatermark: settings.show_watermark,
    watermarkOpacity: Math.max(0.01, Math.min(0.2, settings.watermark_opacity)),
  }
}
