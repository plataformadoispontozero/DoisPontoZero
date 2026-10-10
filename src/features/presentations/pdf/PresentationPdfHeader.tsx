// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF HEADER
// ============================================================

import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PresentationPdfBranding } from './types'

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  agencyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#101014',
  },
  badge: {
    fontSize: 9,
    color: '#7952FF',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  logo: {
    height: 24,
    maxWidth: 120,
    objectFit: 'contain',
  },
})

interface Props {
  branding: PresentationPdfBranding
  periodFormatted: string
}

export const PresentationPdfHeader: React.FC<Props> = ({ branding, periodFormatted }) => {
  return (
    <View style={styles.headerContainer} fixed>
      <View>
        <Text style={styles.agencyName}>{branding.agencyName}</Text>
        <Text style={styles.badge}>Apresentação de Entregas • {periodFormatted}</Text>
      </View>
      {branding.logoUrl ? (
        <Image src={branding.logoUrl} style={styles.logo} />
      ) : (
        <Text style={{ fontSize: 10, color: '#64748B' }}>{branding.website}</Text>
      )}
    </View>
  )
}
