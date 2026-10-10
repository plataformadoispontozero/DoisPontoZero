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
  const [branding, setBranding] = useState<BrandingConfig>(initialConfig)

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
