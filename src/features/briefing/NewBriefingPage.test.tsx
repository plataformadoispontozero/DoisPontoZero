import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NewBriefingPage } from './NewBriefingPage'

const state = vi.hoisted(() => ({ clients: [] as any[], templates: [] as any[], error: false, create: vi.fn() }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAgencyId: () => 'agency-real' }))
vi.mock('@/features/clients/hooks/useClients', () => ({ useClients: () => ({ data: state.clients, isLoading: false, isError: state.error }) }))
vi.mock('./hooks/useBriefings', () => ({
  useBriefingTemplates: () => ({ data: state.templates, isLoading: false, isError: state.error }),
  useCreateBriefing: () => ({ mutateAsync: state.create, isPending: false }),
  useCreatePublicLink: () => ({ mutateAsync: vi.fn() }),
}))

beforeEach(() => { state.clients = []; state.templates = []; state.error = false; state.create.mockReset() })
const show = () => render(<MemoryRouter><NewBriefingPage /></MemoryRouter>)
describe('Briefing prerequisites for a real agency', () => {
  it('offers CRM setup instead of invented clients or templates', () => {
    show()
    expect(screen.getByRole('link', { name: 'Cadastrar cliente no CRM' })).toHaveAttribute('href', '/clients/new')
    expect(screen.getByRole('link', { name: 'Gerenciar modelos de briefing' })).toHaveAttribute('href', '/briefings/templates')
    expect(screen.queryByText('Natura Cosméticos')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
    expect(state.create).not.toHaveBeenCalled()
  })
  it('uses a CRM client even when the client has no project and requires a real template selection', () => {
    state.clients = [{ id: 'real-client', name: 'Cliente real sem projeto', slug: 'real' }]
    state.templates = [{ id: 'real-template', name: 'Modelo real', category: 'general', version: 1 }]
    show()
    fireEvent.click(screen.getByText('Cliente real sem projeto'))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
    fireEvent.click(screen.getByText('Modelo real'))
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled()
  })
  it('blocks advancement when prerequisite queries fail', () => {
    state.error = true
    show()
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar clientes ou modelos')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })
})
