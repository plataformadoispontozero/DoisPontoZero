import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RegistrationRequestsPanel } from './RegistrationRequestsPanel'
const state=vi.hoisted(()=>({role:'MANAGER',invoke:vi.fn(),query:vi.fn()}))
vi.mock('@/features/auth/AuthProvider',()=>({useAuth:()=>({activeAgency:{roleName:state.role}}),useAgencyId:()=> 'agency-test',usePermission:()=>true}))
vi.mock('@/lib/supabase/client',()=>({supabase:{functions:{invoke:state.invoke},from:()=>{
 const b:any={select:()=>b,eq:()=>b,order:()=>state.query()};return b
}}}))
beforeEach(()=>{state.role='MANAGER';vi.clearAllMocks();state.query.mockResolvedValue({data:[{id:'request-test',full_name:'Profissional Teste',email:'person@example.com',profession:'designer',status:'pending',created_at:'2026-10-12T08:00:00Z'}],error:null})})
const roles=[{id:'admin',name:'ADMIN'},{id:'owner',name:'OWNER'},{id:'member',name:'MEMBER'}]
function show(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><RegistrationRequestsPanel roles={roles}/></QueryClientProvider>)}
describe('Registration review',()=>{
 it('requires identity confirmation and prevents a manager from selecting privileged roles',async()=>{
  show();await screen.findByText('Profissional Teste')
  expect(screen.queryByRole('option',{name:'Administrador'})).not.toBeInTheDocument()
  expect(screen.queryByRole('option',{name:'OWNER'})).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Papel de acesso a liberar'),{target:{value:'member'}})
  expect(screen.getByRole('button',{name:'Aprovar e ativar'})).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox'))
  state.invoke.mockResolvedValue({data:{reviewed:true},error:null})
  fireEvent.click(screen.getByRole('button',{name:'Aprovar e ativar'}))
  await waitFor(()=>expect(state.invoke).toHaveBeenCalledWith('team-registration',{body:{action:'approve',agencyId:'agency-test',requestId:'request-test',roleId:'member',identityConfirmed:true}}))
 })
 it('does not expose the review panel to a regular collaborator',()=>{
  state.role='MEMBER';show()
  expect(screen.queryByText('Cadastros aguardando aprovação')).not.toBeInTheDocument()
  expect(state.query).not.toHaveBeenCalled()
 })
})
