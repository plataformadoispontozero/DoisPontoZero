export interface BrandingColors {
  background: string
  primary: string
  surface: string
  surfaceElevated: string
  textPrimary: string
  textSecondary: string
  accent: string
  border: string
  success: string
  warning: string
  error: string
  hover: string
  muted: string
}

export interface BrandingTypography {
  heading: string
  sans: string
}

export interface BrandingConfig {
  name: string
  category: string
  slogan: string
  version: string
  colors: BrandingColors
  typography: BrandingTypography
  company: {
    legalName: string
    workspaceName: string
    avatarUrl?: string
  }
}
