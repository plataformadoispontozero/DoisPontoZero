// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Section Component
// ============================================================

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { BriefingPdfSectionItem, PdfBrandingConfig } from './types'
import { BriefingPdfQuestion } from './BriefingPdfQuestion'

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
  },
  sectionAccentBar: {
    width: 4,
    height: 14,
    backgroundColor: '#C74410',
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 0.2,
  },
  sectionDescription: {
    fontSize: 8.5,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: -4,
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
  },
})

export const BriefingPdfSection: React.FC<{
  section: BriefingPdfSectionItem
  branding: PdfBrandingConfig
  index: number
}> = ({ section, branding }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader} wrap={false}>
        <View style={[styles.sectionAccentBar, { backgroundColor: branding.primaryColor }]} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>

      {section.description ? (
        <Text style={styles.sectionDescription}>{section.description}</Text>
      ) : null}

      <View style={styles.questionsList}>
        {section.questions.map((question, qIdx) => (
          <BriefingPdfQuestion
            key={question.id}
            question={question}
            branding={branding}
            index={qIdx}
          />
        ))}
      </View>
    </View>
  )
}
