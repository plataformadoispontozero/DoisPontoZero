import { describe, it, expect } from 'vitest'
import { defaultBranding } from '@/config/branding'

describe('White Label Branding Configuration - Phase 01', () => {
  it('should define core platform attributes correctly', () => {
    expect(defaultBranding.name).toBe('Dois.Zero')
    expect(defaultBranding.category).toBe('Creative Agency OS')
    expect(defaultBranding.slogan).toBe('Sua agência. Tudo conectado.')
  })

  it('should match the design system color specifications', () => {
    expect(defaultBranding.colors.background).toBe('#101014')
    expect(defaultBranding.colors.primary).toBe('#7952FF')
    expect(defaultBranding.colors.surface).toBe('#1C1C24')
    expect(defaultBranding.colors.surfaceElevated).toBe('#252530')
    expect(defaultBranding.colors.textPrimary).toBe('#F8F9FC')
    expect(defaultBranding.colors.textSecondary).toBe('#A1A1B0')
    expect(defaultBranding.colors.accent).toBe('#B8FF65')
    expect(defaultBranding.colors.border).toBe('#30303B')
    expect(defaultBranding.colors.success).toBe('#34D399')
    expect(defaultBranding.colors.warning).toBe('#FBBF24')
    expect(defaultBranding.colors.error).toBe('#FB7185')
  })

  it('should define standard typography', () => {
    expect(defaultBranding.typography.heading).toBe('Space Grotesk')
    expect(defaultBranding.typography.sans).toBe('Inter')
  })
})
