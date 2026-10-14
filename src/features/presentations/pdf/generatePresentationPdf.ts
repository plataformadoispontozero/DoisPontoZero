// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF GENERATOR
// Render PDF document to Blob and trigger browser download
// ============================================================

import React from 'react'
import { pdf } from '@react-pdf/renderer'
import type { PresentationPdfModel } from './types'
import { preparePresentationMedia } from './preparePresentationMedia'
import { PresentationPdfDocument } from './PresentationPdfDocument'
import { transformPresentationToPdfModel } from './transformPresentationToPdfModel'

export interface GeneratePresentationPdfResult {
  mediaWarnings: number
  blob: Blob
  blobUrl: string
  fileName: string
}

export async function generatePresentationPdfBlob(model: PresentationPdfModel): Promise<GeneratePresentationPdfResult> {
  const prepared = await preparePresentationMedia(model)
  const docElement = React.createElement(PresentationPdfDocument, { model: prepared })
  const asPdf = pdf(docElement as any)
  const blob = await asPdf.toBlob()
  const blobUrl = URL.createObjectURL(blob)

  const sanitizedClient = model.clientName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const sanitizedTitle = model.title.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `Apresentacao_${sanitizedClient}_${sanitizedTitle}.pdf`

  return { blob, blobUrl, fileName, mediaWarnings: prepared.mediaWarnings||0 }
}

export async function downloadPresentationPdf(model: PresentationPdfModel): Promise<void> {
  const { blobUrl, fileName } = await generatePresentationPdfBlob(model)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

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

