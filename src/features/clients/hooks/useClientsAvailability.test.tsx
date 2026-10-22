import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, render, screen, waitFor, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ClientsPage } from '../ClientsPage'
vi.mock('@/lib/supabase/client', () => ({ supabase: null, isSupabaseConfigured: false }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAgencyId: () => 'agency-real', usePermission: () => false }))
import { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from './useClients'
function wrapper() {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
 return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
describe('CRM backend unavailable', () => {
 it('shows a recoverable error instead of an empty CRM when loading fails', async () => {
  const Wrapper = wrapper()
  render(<Wrapper><MemoryRouter><ClientsPage /></MemoryRouter></Wrapper>)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os clientes')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  expect(screen.queryByText('Nenhum cliente localizado')).not.toBeInTheDocument()
 })
 it('reports a loading error instead of returning fictional clients', async () => {
  const { result } = renderHook(() => useClients(), { wrapper: wrapper() })
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.data).toBeUndefined()
  expect(result.current.error?.message).toContain('Servidor indisponível')
 })
 it('does not substitute a fictional client in the detail', async () => {
  const { result } = renderHook(() => useClient('client-demo-1'), { wrapper: wrapper() })
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.data).toBeUndefined()
 })
 it('rejects create, update and archive rather than reporting an unsaved success', async () => {
  const { result } = renderHook(() => ({ create: useCreateClient('agency-real'), update: useUpdateClient('agency-real'), archive: useDeleteClient('agency-real') }), { wrapper: wrapper() })
  await act(async () => {
   await expect(result.current.create.mutateAsync({ name: 'Cliente real' })).rejects.toThrow('Nenhuma alteração foi salva')
   await expect(result.current.update.mutateAsync({ id: 'client-real', name: 'Novo nome' })).rejects.toThrow('Nenhuma alteração foi salva')
   await expect(result.current.archive.mutateAsync('client-real')).rejects.toThrow('Nenhuma alteração foi salva')
  })
 })
})
