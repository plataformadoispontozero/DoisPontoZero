// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF FOOTER
// ============================================================

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PresentationPdfBranding } from './types'

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
})

interface Props {
  branding: PresentationPdfBranding
}

export const PresentationPdfFooter: React.FC<Props> = ({ branding }) => {
  return (
    <View style={styles.footerContainer} fixed>
      <Text style={styles.footerText} render={() => `${branding.agencyName} • ${branding.website}`} />
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  )
}
