// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF DOCUMENT
// Complete @react-pdf/renderer Document template for presentations
// ============================================================

import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PresentationPdfModel } from './types'
import { PresentationPdfHeader } from './PresentationPdfHeader'
import { PresentationPdfFooter } from './PresentationPdfFooter'
import { PresentationPdfWatermark } from './PresentationPdfWatermark'
import { PresentationPdfCover } from './PresentationPdfCover'

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 50,
    paddingHorizontal: 36,
    backgroundColor: '#FFFFFF',
    fontSize: 10,
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginTop: 14,
  },
  paragraph: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    marginBottom: 10,
  },
})

interface Props {
  model: PresentationPdfModel
}

export const PresentationPdfDocument: React.FC<Props> = ({ model }) => {
  return (
    <Document title={`${model.title} - ${model.clientName}`}>
      {/* Cover Page */}
      <PresentationPdfCover model={model} />

      {/* Presentation Content Pages */}
      <Page size="A4" style={styles.page}>
        <PresentationPdfWatermark logoUrl={model.branding.logoUrl} />
        <PresentationPdfHeader branding={model.branding} periodFormatted={model.periodFormatted} />

        {/* Dynamic Presentation Sections */}
        {model.sections.map((sec) => (
          <View key={sec.id || sec.title} wrap={false}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>

            {sec.content?.text && (
              <Text style={styles.paragraph}>{sec.content.text}</Text>
            )}

            {Array.isArray(sec.content?.list) && (
              <View style={{ marginBottom: 10 }}>
                {sec.content.list.map((item: string, idx: number) => (
                  <Text key={idx} style={styles.paragraph}>
                    • {item}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}

        <PresentationPdfFooter branding={model.branding} />
      </Page>
    </Document>
  )
}
