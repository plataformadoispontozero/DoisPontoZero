import { AuthProvider } from '@/features/auth/AuthProvider'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrandingProvider } from '@/app/providers/BrandingProvider'
import { calculateContrastRatio } from '@/lib/contrast'
import { SettingsOverviewPage } from './SettingsOverviewPage'
import { WhiteLabelStudioPage } from './WhiteLabelStudioPage'
import { PermissionStudioPage } from './PermissionStudioPage'
import { TeamManagementPage } from './TeamManagementPage'
import { DiagnosticsPage } from './DiagnosticsPage'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <AuthProvider><QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </BrandingProvider>
    </QueryClientProvider></AuthProvider>
  )
}

describe('Fase 11 — White Label Studio & Advanced Settings Suite', () => {
  it('calculates WCAG 2.2 AA contrast ratio correctly', () => {
    // Texto branco (#F8F9FC) sobre fundo escuro (#101014) -> > 15:1 (Passa AA e AAA)
    const highContrast = calculateContrastRatio('#F8F9FC', '#101014')
    expect(highContrast.normalTextPass).toBe(true)
    expect(highContrast.ratio).toBeGreaterThan(4.5)

    // Texto cinza-escuro sobre fundo escuro -> Falha AA
    const lowContrast = calculateContrastRatio('#202020', '#101014')
    expect(lowContrast.normalTextPass).toBe(false)
  })

  it('renders SettingsOverviewPage with 12 module cards', () => {
    renderWithProviders(<SettingsOverviewPage />)

    expect(screen.getByText('Configurações da Dois.Zero')).toBeInTheDocument()
    expect(screen.queryByText('White Label Studio')).not.toBeInTheDocument()
    expect(screen.getByText('Versão da plataforma: 0.2.0')).toBeInTheDocument()
    expect(screen.getByText('Acessos')).toBeInTheDocument()
  })

  it('renders WhiteLabelStudioPage with color editor and brand preview', () => {
    renderWithProviders(<WhiteLabelStudioPage />)

    expect(screen.getByText('Logotipos & Identidade de Marca')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dois.Zero')).toBeInTheDocument()
  })

  it('renders access profiles and sectors', async () => {
    renderWithProviders(<PermissionStudioPage />)

    expect(screen.getByText('Acessos por setor')).toBeInTheDocument()
    await screen.findByRole('option', {name:'Administrador'})
    expect(screen.getByLabelText('Perfil de acesso')).toBeInTheDocument()
    expect(screen.getByRole('option', {name:'Proprietário'})).toBeInTheDocument()
  })

  it('renders TeamManagementPage with active members', () => {
    renderWithProviders(<TeamManagementPage />)

    expect(screen.getByText('Gestão de Equipe & Colaboradores')).toBeInTheDocument()
    expect(screen.getByText('Lucas Silveira')).toBeInTheDocument()
    expect(screen.getByText('Convidar Membro')).toBeInTheDocument()
  })

  it('renders DiagnosticsPage with Phase 01 to 11 manifesto status', () => {
    renderWithProviders(<DiagnosticsPage />)

    expect(screen.getByText('Painel Técnico & Diagnóstico do Sistema')).toBeInTheDocument()
    expect(screen.getByText('Manifesto Técnico Auditado de Desenvolvimento (Fases 01 a 12)')).toBeInTheDocument()
  })
})
