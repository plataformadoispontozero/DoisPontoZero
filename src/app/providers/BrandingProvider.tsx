import {useAgencyBranding} from '@/features/settings/hooks/useAgencySettings'
import {brandHex} from '@/app/theme/brandTokens'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { defaultBranding } from '@/config/branding'
import type { BrandingConfig } from '@/types/branding'

interface BrandingContextValue {
  branding: BrandingConfig
  updateBranding: (updates: Partial<BrandingConfig>) => void
  resetBranding: () => void
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined)

export function BrandingProvider({
  children,
  initialConfig = defaultBranding,
}: {
  children: ReactNode
  initialConfig?: BrandingConfig
}) {
  const [localBranding, setBranding] = useState<BrandingConfig>(initialConfig)
  const source=useAgencyBranding()
  const saved=source.isError||source.isLoading?undefined:source.branding
  const branding:BrandingConfig=saved?{...localBranding,name:saved.display_name||localBranding.name,slogan:saved.tagline,colors:{...localBranding.colors,primary:brandHex(saved.primary_color,localBranding.colors.primary),accent:brandHex(saved.accent_color,localBranding.colors.accent),background:brandHex(saved.background_color,localBranding.colors.background),surface:brandHex(saved.surface_color,localBranding.colors.surface),textPrimary:brandHex(saved.text_color,localBranding.colors.textPrimary),textSecondary:brandHex(saved.secondary_color,localBranding.colors.textSecondary)},typography:{heading:saved.heading_font,sans:saved.body_font},company:{...localBranding.company,legalName:saved.legal_name}}:localBranding

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    setBranding((prev) => ({
      ...prev,
      ...updates,
      colors: {
        ...prev.colors,
        ...(updates.colors || {}),
      },
      typography: {
        ...prev.typography,
        ...(updates.typography || {}),
      },
      company: {
        ...prev.company,
        ...(updates.company || {}),
      },
    }))
  }

  const resetBranding = () => {
    setBranding(defaultBranding)
  }

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext)
  if (!context) {
    // Fallback gracioso caso seja renderizado fora do provider (ex: testes simples)
    return {
      branding: defaultBranding,
      updateBranding: () => {},
      resetBranding: () => {},
    }
  }
  return context
}
