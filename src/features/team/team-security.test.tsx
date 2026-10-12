import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAgencyTeam } from '@/features/settings/hooks/useAgencySettings'

const state = vi.hoisted(() => ({ update: vi.fn(), rpc: vi.fn(), invoke: vi.fn(), error: { message: 'permission denied', code: '42501' } }))
vi.mock('@/features/auth/AuthProvider', () => ({ usePermission: () => true, useAgencyId: () => 'agency-real', useAuth: () => ({ user: { id: 'actor-real' } }) }))
vi.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: true, supabase: { rpc: (...args: unknown[]) => state.rpc(...args), functions: {invoke: (...args: unknown[]) => state.invoke(...args)}, from: () => {
  const builder: any = { then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve) }
  for (const key of ['select','eq','is','order']) builder[key] = () => builder
  builder.update = state.update.mockImplementation(() => builder)
  builder.single = async () => ({ data: null, error: state.error })
  return builder
} } }))
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{children}</QueryClientProvider>
beforeEach(() => {state.update.mockClear();state.rpc.mockReset();state.invoke.mockReset()})
describe('Team operations require backend confirmation', () => {
 it('uses guarded RPC for roles and propagates a rejected write', async()=>{
  state.rpc.mockResolvedValue({data:null,error:state.error})
  const {result}=renderHook(()=>useAgencyTeam(),{wrapper})
  await act(async()=>{await expect(result.current.updateMemberRole({memberId:'member',newRoleId:'role'})).rejects.toEqual(state.error)})
  expect(state.rpc).toHaveBeenCalledWith('update_team_member_role',{p_id:'member',p_agency:'agency-real',p_role:'role'})
  expect(state.update).not.toHaveBeenCalled()
 })
 it('propagates a rejected revoke instead of returning success',async()=>{
  state.rpc.mockResolvedValue({data:null,error:state.error})
  const {result}=renderHook(()=>useAgencyTeam(),{wrapper})
  await act(async()=>{await expect(result.current.revokeInvitation('invitation')).rejects.toEqual(state.error)})
 })
 it('rejects unconfirmed invite responses',async()=>{
  state.invoke.mockResolvedValue({data:{},error:null})
  const {result}=renderHook(()=>useAgencyTeam(),{wrapper})
  await act(async()=>{await expect(result.current.inviteMember({email:'test@example.com',roleId:'role'})).rejects.toThrow('não confirmou')})
 })
 it('returns a manual sharing link only after server confirmation',async()=>{
  state.invoke.mockResolvedValue({data:{inviteUrl:'https://site/accept-invitation#id=test',invitationId:'test',existingAccount:true},error:null})
  const {result}=renderHook(()=>useAgencyTeam(),{wrapper})
  await act(async()=>{expect((await result.current.inviteMember({email:'test@example.com',roleId:'role'})).inviteUrl).toContain('#id=test')})
 })
})
