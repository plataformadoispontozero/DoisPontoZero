// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF GENERATOR
// Render PDF document to Blob and trigger browser download
// ============================================================

import React from 'react'
import { pdf } from '@react-pdf/renderer'
import type { PresentationPdfModel } from './types'
import { PresentationPdfDocument } from './PresentationPdfDocument'
import { transformPresentationToPdfModel } from './transformPresentationToPdfModel'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

export interface GeneratePresentationPdfResult {
  blob: Blob
  blobUrl: string
  fileName: string
}

export async function generatePresentationPdfBlob(model: PresentationPdfModel): Promise<GeneratePresentationPdfResult> {
  const docElement = React.createElement(PresentationPdfDocument, { model })
  const asPdf = pdf(docElement as any)
  const blob = await asPdf.toBlob()
  const blobUrl = URL.createObjectURL(blob)

  const sanitizedClient = model.clientName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const sanitizedTitle = model.title.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `Apresentacao_${sanitizedClient}_${sanitizedTitle}.pdf`

  return { blob, blobUrl, fileName }
}

export async function downloadPresentationPdf(model: PresentationPdfModel): Promise<void> {
  const { blobUrl, fileName } = await generatePresentationPdfBlob(model)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('presentation_exports').insert({
        agency_id: 'demo-agency',
        presentation_id: model.presentationId,
        storage_path: `exports/${fileName}`,
        branding_snapshot: model.branding,
      })

      await supabase.from('presentation_activity').insert({
        agency_id: 'demo-agency',
        presentation_id: model.presentationId,
        action: 'pdf_exported',
        metadata: { fileName, generatedAt: new Date().toISOString() },
      })
    } catch (err) {
      console.warn('Could not record presentation PDF export in Supabase:', err)
    }
  }

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, 10000)
}

export async function generatePresentationPdf(params: {
  presentation: any
  sections?: any[]
  assets?: any[]
  branding?: any
}): Promise<void> {
  const fullPresentation = {
    ...params.presentation,
    sections: params.sections || params.presentation.sections || [],
    assets: params.assets || params.presentation.assets || [],
  }
  const model = transformPresentationToPdfModel(fullPresentation, params.branding)
  await downloadPresentationPdf(model)
}

