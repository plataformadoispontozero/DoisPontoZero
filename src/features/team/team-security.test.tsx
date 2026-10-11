import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAgencyTeam } from '@/features/settings/hooks/useAgencySettings'

const state = vi.hoisted(() => ({ update: vi.fn(), error: { message: 'permission denied', code: '42501' } }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAgencyId: () => 'agency-real', useAuth: () => ({ user: { id: 'actor-real' } }) }))
vi.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: true, supabase: { from: () => {
  const builder: any = { then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve) }
  for (const key of ['select','eq','is','order']) builder[key] = () => builder
  builder.update = state.update.mockImplementation(() => builder)
  builder.single = async () => ({ data: null, error: state.error })
  return builder
} } }))
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{children}</QueryClientProvider>
beforeEach(() => state.update.mockClear())
describe('Team writes fail closed', () => {
  it('does not call a direct membership update while secure administration is blocked', async () => {
    const { result } = renderHook(() => useAgencyTeam(), { wrapper })
    await act(async () => { await expect(result.current.updateMemberRole({ memberId: 'member', newRoleId: 'role' })).rejects.toThrow('bloqueada') })
    expect(state.update).not.toHaveBeenCalled()
  })
  it('propagates a rejected revoke instead of returning success', async () => {
    const { result } = renderHook(() => useAgencyTeam(), { wrapper })
    await act(async () => { await expect(result.current.revokeInvitation('invitation')).rejects.toEqual(state.error) })
  })
  it('never reports an invitation sent without a secure backend', async () => {
    const { result } = renderHook(() => useAgencyTeam(), { wrapper })
    await act(async () => { await expect(result.current.inviteMember({ email: 'test@example.com', roleId: 'role' })).rejects.toThrow('nenhum convite foi enviado') })
    expect(state.update).not.toHaveBeenCalled()
  })
})
