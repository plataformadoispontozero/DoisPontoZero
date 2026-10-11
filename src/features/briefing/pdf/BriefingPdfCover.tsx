// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Cover Page Component (A4 Cover: Centered Logo, Title, Client, Category, Date, Version)
// ============================================================

import React from 'react'
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { BriefingPdfModel } from './types'
import { BriefingPdfWatermark } from './BriefingPdfWatermark'

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    paddingTop: 70,    // 25mm ~ 70pt
    paddingBottom: 56, // 20mm ~ 56pt
    paddingLeft: 56,   // 20mm ~ 56pt
    paddingRight: 56,  // 20mm ~ 56pt
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topSection: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    maxWidth: 160,
    maxHeight: 60,
    objectFit: 'contain',
    marginBottom: 12,
  },
  agencyNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111116',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  agencySubtitle: {
    fontSize: 9,
    color: '#98989F',
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  categoryBadge: {
    backgroundColor: '#F3F0FF',
    color: '#C74410',
    fontSize: 9,
    fontWeight: 'bold',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  documentTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111116',
    textAlign: 'center',
    lineHeight: 1.25,
    marginBottom: 12,
  },
  description: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: 420,
    marginBottom: 20,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#C74410',
    borderRadius: 2,
    marginBottom: 24,
  },
  clientContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  clientLabel: {
    fontSize: 9,
    color: '#98989F',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111116',
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaBlock: {
    display: 'flex',
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 8,
    color: '#98989F',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metaStatusBadge: {
    fontSize: 8,
    color: '#10B981',
    fontWeight: 'bold',
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
})

export const BriefingPdfCover: React.FC<{ model: BriefingPdfModel }> = ({ model }) => {
  return (
    <Page size="A4" style={styles.page}>
      <BriefingPdfWatermark branding={model.branding} />

      {/* Top: Agency Logo centered */}
      <View style={styles.topSection}>
        {model.branding.logoUrl ? (
          <Image src={model.branding.logoUrl} style={styles.logo} />
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.agencyNameText}>{model.branding.agencyName}</Text>
            <Text style={styles.agencySubtitle}>Creative Agency OS</Text>
          </View>
        )}
      </View>

      {/* Center: Title, Client, Category */}
      <View style={styles.centerSection}>
        <Text style={styles.categoryBadge}>{model.categoryLabel}</Text>
        <Text style={styles.documentTitle}>{model.title}</Text>
        {model.description ? (
          <Text style={styles.description}>{model.description}</Text>
        ) : null}
        <View style={styles.divider} />

        <View style={styles.clientContainer}>
          <Text style={styles.clientLabel}>Cliente / Marca</Text>
          <Text style={styles.clientName}>{model.clientName}</Text>
        </View>
      </View>

      {/* Bottom: Date, Version, Document ID */}
      <View style={styles.bottomSection}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Data do Documento</Text>
          <Text style={styles.metaValue}>{model.formattedDate}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Identificação</Text>
          <Text style={styles.metaValue}>{model.documentId}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Versão</Text>
          <Text style={styles.metaValue}>V{model.version}.0</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.metaStatusBadge}>{model.statusLabel}</Text>
        </View>
      </View>
    </Page>
  )
}
