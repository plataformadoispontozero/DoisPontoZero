import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AppProviders } from '@/app/providers/AppProviders'

describe('DashboardPage - Phase 01', () => {
  const renderDashboard = () => {
    return render(
      <AppProviders>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </AppProviders>
    )
  }

  it('renders the header with Visão Geral and subtitle', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'Visão Geral' })).toBeInTheDocument()
    expect(screen.getByText(/Acompanhe a operação criativa da sua agência/i)).toBeInTheDocument()
  })

  it('renders the 4 operational indicator cards connected to data layer', () => {
    renderDashboard()
    expect(screen.getByText('Projetos ativos')).toBeInTheDocument()
    expect(screen.getByText('Tarefas pendentes')).toBeInTheDocument()
    expect(screen.getByText('Entregas da semana')).toBeInTheDocument()
    expect(screen.getByText('Aprovações aguardando')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(4)
  })

  it('replaces technical workspace status with operational workload', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'Carga por setor' })).toBeInTheDocument()
    expect(screen.queryByText('Status do Workspace')).not.toBeInTheDocument()
    expect(screen.queryByText('Marca Ativa:')).not.toBeInTheDocument()
  })

  it('renders Suas prioridades with empty state and action to explore projects', () => {
    renderDashboard()
    expect(screen.getByText('Suas prioridades')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma tarefa atribuída ainda.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Explorar projetos/i })).toBeInTheDocument()
  })

  it('renders Projetos recentes, Próximas reuniões and Atividade recente', () => {
    renderDashboard()
    expect(screen.getByText('Projetos recentes')).toBeInTheDocument()
    expect(screen.getByText('Próximas reuniões')).toBeInTheDocument()
    expect(screen.getByText('Atividade recente')).toBeInTheDocument()
  })
})
