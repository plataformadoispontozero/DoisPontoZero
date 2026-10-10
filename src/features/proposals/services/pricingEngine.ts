// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PRICING ENGINE
// Financial calculation engine for proposals in cents (BIGINT integer logic)
// ============================================================

import type { ProposalItem, PricingEngineResult } from '@/types/proposals'

export function calculateProposalPricing(
  items: ProposalItem[],
  globalDiscountCents: number = 0,
  feesCents: number = 0,
  currency: string = 'BRL'
): PricingEngineResult {
  let subtotalCents = 0
  let oneTimeTotalCents = 0
  let recurringMonthlyTotalCents = 0
  let optionalTotalCents = 0

  items.forEach((item) => {
    // Calculate item total: (quantity * unit_price_cents) - discount_cents
    const qty = Math.max(0, item.quantity || 1)
    const unitPrice = Math.max(0, item.unit_price_cents || 0)
    const itemDiscount = Math.max(0, item.discount_cents || 0)
    const itemTotal = Math.max(0, Math.round(qty * unitPrice) - itemDiscount)

    if (item.billing_type === 'optional') {
      optionalTotalCents += itemTotal
    } else {
      subtotalCents += itemTotal
      if (item.billing_type === 'recurring') {
        recurringMonthlyTotalCents += itemTotal
      } else {
        oneTimeTotalCents += itemTotal
      }
    }
  })

  const discountCents = Math.min(subtotalCents, Math.max(0, globalDiscountCents))
  const totalCents = Math.max(0, subtotalCents - discountCents + Math.max(0, feesCents))

  return {
    subtotal_cents: subtotalCents,
    discount_cents: discountCents,
    fees_cents: feesCents,
    total_cents: totalCents,
    one_time_total_cents: oneTimeTotalCents,
    recurring_monthly_total_cents: recurringMonthlyTotalCents,
    optional_total_cents: optionalTotalCents,
    formatted_subtotal: formatCurrencyCents(subtotalCents, currency),
    formatted_discount: formatCurrencyCents(discountCents, currency),
    formatted_fees: formatCurrencyCents(feesCents, currency),
    formatted_total: formatCurrencyCents(totalCents, currency),
    formatted_one_time: formatCurrencyCents(oneTimeTotalCents, currency),
    formatted_recurring: formatCurrencyCents(recurringMonthlyTotalCents, currency),
  }
}

export function formatCurrencyCents(cents: number, currency: string = 'BRL'): string {
  const value = (cents || 0) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function parseCurrencyToCents(formattedValue: string | number): number {
  if (typeof formattedValue === 'number') {
    return Math.round(formattedValue * 100)
  }
  if (!formattedValue) return 0
  const clean = formattedValue.replace(/[^0-9,-]/g, '').replace(',', '.')
  const parsed = parseFloat(clean)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100)
}
