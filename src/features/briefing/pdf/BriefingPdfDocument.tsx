// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Master PDF Document Component
// ============================================================

import React from 'react'
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer'
import type { BriefingPdfModel } from './types'
import { BriefingPdfCover } from './BriefingPdfCover'
import { BriefingPdfHeader } from './BriefingPdfHeader'
import { BriefingPdfWatermark } from './BriefingPdfWatermark'
import { BriefingPdfSection } from './BriefingPdfSection'
import { BriefingPdfFooter } from './BriefingPdfFooter'

const styles = StyleSheet.create({
  contentPage: {
    size: 'A4',
    paddingTop: 70,    // 25mm ~ 70pt
    paddingBottom: 56, // 20mm ~ 56pt
    paddingLeft: 56,   // 20mm ~ 56pt
    paddingRight: 56,  // 20mm ~ 56pt
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
})

export const BriefingPdfDocument: React.FC<{ model: BriefingPdfModel }> = ({ model }) => {
  return (
    <Document
      title={`${model.title} — ${model.clientName}`}
      author={model.branding.agencyName}
      subject={`Briefing Criativo: ${model.title}`}
      keywords="briefing, creative, agency, pdf, dois.zero"
    >
      {/* 1. Cover Page */}
      <BriefingPdfCover model={model} />

      {/* 2. Content Pages */}
      <Page size="A4" style={styles.contentPage}>
        {/* Centered Watermark across all pages (fixed) */}
        <BriefingPdfWatermark branding={model.branding} />

        {/* Running Header (fixed) */}
        <BriefingPdfHeader branding={model.branding} />

        {/* Document Content */}
        <View style={styles.contentContainer}>
          {model.sections.map((section, sIdx) => (
            <BriefingPdfSection
              key={section.id}
              section={section}
              branding={model.branding}
              index={sIdx}
            />
          ))}
        </View>

        {/* Running Footer (fixed) */}
        <BriefingPdfFooter model={model} />
      </Page>
    </Document>
  )
}
