// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL PDF DOCUMENT
// Complete @react-pdf/renderer Document template for proposals
// ============================================================

import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ProposalPdfModel } from './types'
import { ProposalPdfHeader } from './ProposalPdfHeader'
import { ProposalPdfFooter } from './ProposalPdfFooter'
import { ProposalPdfWatermark } from './ProposalPdfWatermark'
import { ProposalPdfCover } from './ProposalPdfCover'
import { formatCurrencyCents } from '../services/pricingEngine'

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 50,
    paddingHorizontal: 36,
    backgroundColor: '#FFFFFF',
    fontSize: 10,
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginTop: 14,
  },
  paragraph: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  table: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    padding: 8,
    alignItems: 'center',
  },
  colName: { width: '40%', fontWeight: 'bold' },
  colQty: { width: '15%', textAlign: 'center' },
  colBilling: { width: '20%', textAlign: 'center' },
  colTotal: { width: '25%', textAlign: 'right', fontWeight: 'bold' },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 6,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#C74410',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    fontWeight: 'bold',
    fontSize: 12,
  },
})

interface Props {
  model: ProposalPdfModel
}

export const ProposalPdfDocument: React.FC<Props> = ({ model }) => {
  return (
    <Document title={`${model.title} - ${model.clientName}`}>
      {/* Cover Page */}
      <ProposalPdfCover model={model} />

      {/* Main Proposal Sections */}
      <Page size="A4" style={styles.page}>
        <ProposalPdfWatermark logoUrl={model.branding.logoUrl} />
        <ProposalPdfHeader branding={model.branding} proposalNumber={model.proposalNumber} />

        {/* Dynamic Proposal Sections */}
        {model.sections.map((sec) => (
          <View key={sec.id || sec.title} wrap={false}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>

            {sec.content?.text && (
              <Text style={styles.paragraph}>{sec.content.text}</Text>
            )}

            {Array.isArray(sec.content?.list) && (
              <View style={{ marginBottom: 10 }}>
                {sec.content.list.map((item: string, idx: number) => (
                  <Text key={idx} style={styles.paragraph}>
                    • {item}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Services & Investment Summary Table */}
        <View wrap={false}>
          <Text style={styles.sectionTitle}>Escopo & Investimento Comercial</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colName, { color: '#64748B' }]}>Serviço / Entregável</Text>
              <Text style={[styles.colQty, { color: '#64748B' }]}>Qtd</Text>
              <Text style={[styles.colBilling, { color: '#64748B' }]}>Cobrança</Text>
              <Text style={[styles.colTotal, { color: '#64748B' }]}>Valor Total</Text>
            </View>

            {model.items.map((item, i) => (
              <View key={item.id || i} style={styles.tableRow}>
                <View style={styles.colName}>
                  <Text style={{ fontSize: 10, color: '#0F172A' }}>{item.name}</Text>
                  {item.description && (
                    <Text style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>{item.description}</Text>
                  )}
                </View>
                <Text style={styles.colQty}>{item.quantity} {item.unit}</Text>
                <Text style={styles.colBilling}>
                  {item.billing_type === 'recurring' ? 'Mensal' : item.billing_type === 'optional' ? 'Opcional' : 'Pontual'}
                </Text>
                <Text style={styles.colTotal}>{formatCurrencyCents(item.total_cents, model.pricing.currency)}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#475569' }}>Subtotal dos Serviços:</Text>
              <Text>{formatCurrencyCents(model.pricing.subtotal_cents, model.pricing.currency)}</Text>
            </View>

            {model.pricing.discount_cents > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: '#16A34A' }}>Desconto Aplicado:</Text>
                <Text style={{ color: '#16A34A' }}>
                  -{formatCurrencyCents(model.pricing.discount_cents, model.pricing.currency)}
                </Text>
              </View>
            )}

            {model.pricing.one_time_total_cents > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: '#475569' }}>Investimento Pontual (Setup/Único):</Text>
                <Text>{formatCurrencyCents(model.pricing.one_time_total_cents, model.pricing.currency)}</Text>
              </View>
            )}

            {model.pricing.recurring_monthly_total_cents > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: '#475569' }}>Investimento Recorrente (Mensalidade):</Text>
                <Text>{formatCurrencyCents(model.pricing.recurring_monthly_total_cents, model.pricing.currency)}/mês</Text>
              </View>
            )}

            <View style={styles.summaryTotal}>
              <Text style={{ color: '#0F172A' }}>Investimento Total do Projeto:</Text>
              <Text style={{ color: '#C74410' }}>
                {formatCurrencyCents(model.pricing.total_cents, model.pricing.currency)}
              </Text>
            </View>
          </View>
        </View>

        <ProposalPdfFooter branding={model.branding} />
      </Page>
    </Document>
  )
}
