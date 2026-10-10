// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Generator function: Renders PDF Document to Blob and Triggers Download
// ============================================================

import React from 'react'
import { pdf } from '@react-pdf/renderer'
import type { BriefingPdfModel } from './types'
import { BriefingPdfDocument } from './BriefingPdfDocument'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

export interface GeneratePdfResult {
  blob: Blob
  blobUrl: string
  fileName: string
}

export async function generateBriefingPdfBlob(model: BriefingPdfModel): Promise<GeneratePdfResult> {
  const docElement = React.createElement(BriefingPdfDocument, { model })
  const asPdf = pdf(docElement as any)
  const blob = await asPdf.toBlob()
  const blobUrl = URL.createObjectURL(blob)

  const sanitizedClient = model.clientName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const sanitizedTitle = model.title.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `Briefing_${sanitizedClient}_${sanitizedTitle}_V${model.version}.pdf`

  return { blob, blobUrl, fileName }
}

export async function downloadBriefingPdf(model: BriefingPdfModel): Promise<void> {
  const { blobUrl, fileName, blob } = await generateBriefingPdfBlob(model)

  // 1. Trigger browser download
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 2. Record export in database if Supabase is active
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('briefing_exports').insert({
        agency_id: 'demo-agency',
        briefing_id: model.briefingId,
        file_path: `local_exports/${fileName}`,
        export_format: 'pdf',
        branding_snapshot: model.branding,
      })

      await supabase.from('briefing_activity').insert({
        agency_id: 'demo-agency',
        briefing_id: model.briefingId,
        action: 'pdf_exported',
        metadata: { fileName, generatedAt: new Date().toISOString() },
      })
    } catch (err) {
      console.warn('Could not record PDF export in Supabase:', err)
    }
  }

  // Revoke object URL after brief delay
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, 10000)
}
