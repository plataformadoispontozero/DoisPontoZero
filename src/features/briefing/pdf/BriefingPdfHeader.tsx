// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Running Header Component (Centered Logo, Proper Aspect Ratio)
// ============================================================

import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PdfBrandingConfig } from './types'

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 28,
    left: 44,
    right: 44,
    height: 40,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,

    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logoImage: {
    height: 24,
    width: 160,
    objectFit: 'contain',
  },
  agencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
})

export const BriefingPdfHeader: React.FC<{ branding: PdfBrandingConfig }> = ({ branding }) => {
  return (
    <View style={styles.headerContainer} fixed>
      {branding.logoUrl ? (
        <Image src={branding.logoUrl} style={styles.logoImage} />
      ) : (
        <Text style={styles.agencyText}>{branding.agencyName}</Text>
      )}
    </View>
  )
}
