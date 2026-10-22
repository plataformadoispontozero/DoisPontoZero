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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  opacity?: number
}

export const PresentationPdfWatermark: React.FC<Props> = ({ logoUrl, opacity=0.05 }) => {
  if (!logoUrl) return null

  return (
    <View style={[styles.watermarkContainer,{opacity}]} fixed>
      <Image src={logoUrl} style={styles.logo} />
    </View>
  )
}
