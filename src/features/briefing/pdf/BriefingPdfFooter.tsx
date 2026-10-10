// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Running Footer Component (Discreet, Agency Name, Document ID, Page Numbers)
// ============================================================

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { BriefingPdfModel } from './types'

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 24,
    left: 56, // matches page paddingLeft
    right: 56, // matches page paddingRight
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agencyAndDoc: {
    fontSize: 8,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  pageNumberText: {
    fontSize: 8,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
})

export const BriefingPdfFooter: React.FC<{ model: BriefingPdfModel }> = ({ model }) => {
  return (
    <View style={styles.footerContainer} fixed>
      <Text style={styles.agencyAndDoc}>
        {model.branding.agencyName} • {model.documentId}
      </Text>
      <Text
        style={styles.pageNumberText}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  )
}
