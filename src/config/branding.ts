import type { BrandingConfig } from '@/types/branding'

export const defaultBranding: BrandingConfig = {
  name: 'Dois.Zero',
  category: '2.0',
  slogan: 'Sua agência. Tudo conectado.',
  version: '0.2.0-phase01',
  colors: {
    background: '#101014',
    primary: '#C74410',
    surface: '#1C1C24',
    surfaceElevated: '#252530',
    textPrimary: '#F8F9FC',
    textSecondary: '#B8B8C0',
    accent: '#FF8759',
    border: '#30303B',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#FB7185',
    hover: '#292938',
    muted: '#98989F',
  },
  typography: {
    heading: 'Space Grotesk',
    sans: 'Inter',
  },
  company: {
    legalName: 'Dois.Zero Sistemas Criativos Ltda.',
    workspaceName: 'Matriz Criativa',
  },
}
