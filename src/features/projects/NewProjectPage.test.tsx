import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ mutateAsync: vi.fn(), refetch: vi.fn(), clients: { data: [{ id: 'client-real', name: 'Cliente da agência' }], isLoading: false, isError: false } }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAgencyId: () => 'agency-real', useAuth: () => ({ activeAgency: { roleName: 'OWNER' } }) }))
vi.mock('@/features/projects/hooks/useProjects', () => ({ useCreateProject: () => ({ mutateAsync: state.mutateAsync, isPending: false }) }))
vi.mock('@/features/clients/hooks/useClients', () => ({ useClients: () => ({ ...state.clients, refetch: state.refetch }) }))
vi.mock('@/components/ui/Toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
import { NewProjectPage } from './NewProjectPage'
describe('new project client flow', () => {
 beforeEach(() => { state.mutateAsync.mockReset(); state.refetch.mockReset(); state.clients.isError = false; state.clients.isLoading = false })
 it('sends the selected real client with the active agency to project creation', async () => {
  state.mutateAsync.mockResolvedValue('project-real')
  render(<MemoryRouter><NewProjectPage /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText(/Nome do projeto/), { target: { value: 'Campanha real' } })
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'client-real' } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar Projeto' }))
  await waitFor(() => expect(state.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Campanha real', client_id: 'client-real', agency_id: 'agency-real' })))
 })
 it('blocks creation when client loading fails and provides a retry', () => {
  state.clients.isError = true
  render(<MemoryRouter><NewProjectPage /></MemoryRouter>)
  expect(screen.getByRole('button', { name: 'Criar Projeto' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(state.refetch).toHaveBeenCalledOnce()
  expect(state.mutateAsync).not.toHaveBeenCalled()
 })
})
