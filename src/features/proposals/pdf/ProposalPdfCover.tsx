// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL PDF COVER PAGE
// Cover page with editorial B2B layout
// ============================================================

import React from 'react'
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { ProposalPdfModel } from './types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  topSection: {
    marginTop: 20,
  },
  logo: {
    height: 48,
    maxWidth: 180,
    objectFit: 'contain',
    marginBottom: 24,
  },
  badge: {
    fontSize: 10,
    color: '#C74410',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 40,
  },
  metaContainer: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#C74410',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  agencyInfo: {
    fontSize: 9,
    color: '#64748B',
  },
})

interface Props {
  model: ProposalPdfModel
}

export const ProposalPdfCover: React.FC<Props> = ({ model }) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.topSection}>
        {model.branding.logoUrl ? (
          <Image src={model.branding.logoUrl} style={styles.logo} />
        ) : (
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#C74410', marginBottom: 24 }}>
            {model.branding.agencyName}
          </Text>
        )}
        <Text style={styles.badge}>Proposta Comercial • {model.proposalNumber}</Text>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.subtitle}>Preparada para {model.clientCompany}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Cliente</Text>
              <Text style={styles.metaValue}>{model.clientName}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Empresa</Text>
              <Text style={styles.metaValue}>{model.clientCompany}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Data de Emissão</Text>
              <Text style={styles.metaValue}>{model.dateFormatted}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Validade da Proposta</Text>
              <Text style={styles.metaValue}>{model.validUntilFormatted}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.agencyInfo}>{model.branding.agencyName} • {model.branding.website}</Text>
        <Text style={styles.agencyInfo}>{model.branding.contactEmail}</Text>
      </View>
    </Page>
  )
}
