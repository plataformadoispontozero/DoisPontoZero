/**
 * WCAG 2.2 AA Color Contrast Calculator and Recommendation Utility
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim()
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return { r, g, b }
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return { r, g, b }
  }
  return null
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const normalize = (val: number) => {
    const s = val / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }

  const r = normalize(rgb.r)
  const g = normalize(rgb.g)
  const b = normalize(rgb.b)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export interface ContrastResult {
  ratio: number
  normalTextPass: boolean // >= 4.5:1
  largeTextPass: boolean // >= 3.0:1
  uiComponentPass: boolean // >= 3.0:1
  formattedRatio: string
  suggestion?: string
}

export function calculateContrastRatio(fgHex: string, bgHex: string): ContrastResult {
  const fgRgb = hexToRgb(fgHex)
  const bgRgb = hexToRgb(bgHex)

  if (!fgRgb || !bgRgb) {
    return {
      ratio: 1,
      normalTextPass: false,
      largeTextPass: false,
      uiComponentPass: false,
      formattedRatio: '1.0:1',
      suggestion: 'Formato HEX de cor inválido.',
    }
  }

  const l1 = getRelativeLuminance(fgRgb)
  const l2 = getRelativeLuminance(bgRgb)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  const ratio = (lighter + 0.05) / (darker + 0.05)
  const roundedRatio = Math.round(ratio * 100) / 100

  const normalTextPass = ratio >= 4.5
  const largeTextPass = ratio >= 3.0
  const uiComponentPass = ratio >= 3.0

  let suggestion: string | undefined

  if (!normalTextPass) {
    if (l2 < 0.5) {
      suggestion = 'Considere clarear a cor do texto para atingir contraste >= 4.5:1 (WCAG AA).'
    } else {
      suggestion = 'Considere escurecer a cor do texto para atingir contraste >= 4.5:1 (WCAG AA).'
    }
  }

  return {
    ratio: roundedRatio,
    normalTextPass,
    largeTextPass,
    uiComponentPass,
    formattedRatio: `${roundedRatio.toFixed(2)}:1`,
    suggestion,
  }
}

export const ALLOWED_GOOGLE_FONTS = [
  { name: 'Inter', category: 'Sans-Serif', family: 'Inter, sans-serif' },
  { name: 'Space Grotesk', category: 'Display', family: "'Space Grotesk', sans-serif" },
  { name: 'Manrope', category: 'Sans-Serif', family: 'Manrope, sans-serif' },
  { name: 'DM Sans', category: 'Sans-Serif', family: "'DM Sans', sans-serif" },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif', family: "'Plus Jakarta Sans', sans-serif" },
]
