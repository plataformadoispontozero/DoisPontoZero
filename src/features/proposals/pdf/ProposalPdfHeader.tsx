// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL PDF HEADER
// ============================================================

import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { ProposalPdfBranding } from './types'

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
  proposalBadge: {
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
  branding: ProposalPdfBranding
  proposalNumber: string
}

export const ProposalPdfHeader: React.FC<Props> = ({ branding, proposalNumber }) => {
  return (
    <View style={styles.headerContainer} fixed>
      <View>
        <Text style={styles.agencyName}>{branding.agencyName}</Text>
        <Text style={styles.proposalBadge}>Proposta Comercial • {proposalNumber}</Text>
      </View>
      {branding.logoUrl ? (
        <Image src={branding.logoUrl} style={styles.logo} />
      ) : (
        <Text style={{ fontSize: 10, color: '#64748B' }}>{branding.website}</Text>
      )}
    </View>
  )
}
