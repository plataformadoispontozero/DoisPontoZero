// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF WATERMARK
// Watermark background with 5% opacity
// ============================================================

import React from 'react'
import { View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  watermarkContainer: {
    position: 'absolute',
    top: 250,
    left: 150,
    right: 150,
    bottom: 250,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.05,
    zIndex: -1,
  },
  logo: {
    width: 260,
    height: 260,
    objectFit: 'contain',
  },
})

interface Props {
  logoUrl?: string
}

export const PresentationPdfWatermark: React.FC<Props> = ({ logoUrl }) => {
  if (!logoUrl) return null

  return (
    <View style={styles.watermarkContainer} fixed>
      <Image src={logoUrl} style={styles.logo} />
    </View>
  )
}
