// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL PDF GENERATOR
// Render PDF document to Blob, trigger browser download, record audit
// ============================================================

import React from 'react'
import { pdf } from '@react-pdf/renderer'
import type { ProposalPdfModel } from './types'
import { ProposalPdfDocument } from './ProposalPdfDocument'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

export interface GenerateProposalPdfResult {
  blob: Blob
  blobUrl: string
  fileName: string
}

export async function generateProposalPdfBlob(model: ProposalPdfModel): Promise<GenerateProposalPdfResult> {
  const docElement = React.createElement(ProposalPdfDocument, { model })
  const asPdf = pdf(docElement as any)
  const blob = await asPdf.toBlob()
  const blobUrl = URL.createObjectURL(blob)

  const sanitizedClient = model.clientName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const sanitizedNumber = model.proposalNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `Proposta_${sanitizedNumber}_${sanitizedClient}.pdf`

  return { blob, blobUrl, fileName }
}

export async function downloadProposalPdf(model: ProposalPdfModel): Promise<void> {
  const { blobUrl, fileName } = await generateProposalPdfBlob(model)

  // 1. Trigger browser download
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 2. Record export event in database if Supabase is active
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('proposal_exports').insert({
        agency_id: 'demo-agency',
        proposal_id: model.proposalId,
        storage_path: `exports/${fileName}`,
        branding_snapshot: model.branding,
      })

      await supabase.from('proposal_events').insert({
        agency_id: 'demo-agency',
        proposal_id: model.proposalId,
        event_type: 'edited',
        metadata: { action: 'pdf_exported', fileName, generatedAt: new Date().toISOString() },
      })
    } catch (err) {
      console.warn('Could not record proposal PDF export in Supabase:', err)
    }
  }

  // Revoke URL after 10s
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, 10000)
}
