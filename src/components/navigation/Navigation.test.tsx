import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { MobileNav } from '@/components/navigation/MobileNav'
import { AppProviders } from '@/app/providers/AppProviders'
import { navItems } from '@/components/navigation/NavLinks'

describe('Navigation Components - Phase 01', () => {
  it('renders required modules in sidebar', () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <Sidebar collapsed={false} onToggleCollapse={() => {}} />
        </MemoryRouter>
      </AppProviders>
    )

    // Verifica presença de itens do Menu Principal
    expect(screen.getByText('Visão Geral')).toBeInTheDocument()
    expect(screen.getByText('Minha Agenda')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Kanban Geral')).toBeInTheDocument()
    expect(screen.getByText('Tarefas')).toBeInTheDocument()
    expect(screen.getByText('Squads')).toBeInTheDocument()

    // Ferramentas
    expect(screen.getByText('Briefings')).toBeInTheDocument()
    expect(screen.getByText('Estratégia')).toBeInTheDocument()
    expect(screen.queryByText('Propostas')).not.toBeInTheDocument()
    expect(screen.getByText('Reuniões')).toBeInTheDocument()
    expect(screen.getByText('Escritório Digital')).toBeInTheDocument()
    expect(screen.getByText('Apresentações')).toBeInTheDocument()

    // Sistema
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('contains distinct navigation destinations including editorial and production areas', () => {
    expect(new Set(navItems.map(item => item.path)).size).toBe(navItems.length)
    expect(navItems.map(item => item.path)).toEqual(expect.arrayContaining(['/editorial', '/production/design', '/production/video', '/production/traffic']))
  })

  it('renders mobile navigation structure and touch controls', () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <MobileNav />
        </MemoryRouter>
      </AppProviders>
    )

    // Mobile bottom navigation tem os itens rápidos
    expect(screen.getByRole('navigation', { name: /navegação rápida mobile/i })).toBeInTheDocument()
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Tarefas')).toBeInTheDocument()
  })
})
