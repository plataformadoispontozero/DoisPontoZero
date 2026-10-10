// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Watermark Component (Centered, 5% opacity, across all pages)
// ============================================================

import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PdfBrandingConfig } from './types'

const styles = StyleSheet.create({
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  watermarkImage: {
    width: 240,
    height: 240,
    opacity: 0.05, // 5% opacity according to 4%-8% specification
    objectFit: 'contain',
  },
  watermarkFallback: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.04,
  },
  watermarkSymbolText: {
    fontSize: 140,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 4,
  },
  watermarkSubtext: {
    fontSize: 16,
    color: '#000000',
    letterSpacing: 8,
    marginTop: -10,
    textTransform: 'uppercase',
  },
})

export const BriefingPdfWatermark: React.FC<{ branding: PdfBrandingConfig }> = ({ branding }) => {
  return (
    <View style={styles.watermarkContainer} fixed>
      {branding.symbolUrl ? (
        <Image src={branding.symbolUrl} style={styles.watermarkImage} />
      ) : (
        <View style={styles.watermarkFallback}>
          <Text style={styles.watermarkSymbolText}>
            {branding.agencyName.slice(0, 2).toUpperCase()}
          </Text>
          <Text style={styles.watermarkSubtext}>{branding.agencyName}</Text>
        </View>
      )}
    </View>
  )
}
