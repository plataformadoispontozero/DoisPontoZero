import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react'
import {beforeEach,describe,it,expect,vi} from 'vitest'
import {PermissionStudioPage} from './PermissionStudioPage'
const state=vi.hoisted(()=>({rpc:vi.fn(),invalidate:vi.fn(),reload:vi.fn(),success:vi.fn(),error:vi.fn(),querySpy:vi.fn(),auth:{} as any,query:{} as any}))
vi.mock('@/features/auth/AuthProvider',()=>({useAuth:()=>state.auth,useAgencyId:()=>state.auth.activeAgency?.agencyId,usePermission:(p:string)=>state.auth.permissions.has(p)}))
vi.mock('@/lib/supabase/client',()=>({supabase:{rpc:(...args:unknown[])=>state.rpc(...args)},isSupabaseConfigured:true}))
vi.mock('@tanstack/react-query',()=>({useQuery:(options:unknown)=>{state.querySpy(options);return state.query},useQueryClient:()=>({invalidateQueries:state.invalidate})}))
vi.mock('@/components/ui/Toast',()=>({toast:{success:state.success,error:state.error}}))
beforeEach(()=>{
 cleanup();vi.clearAllMocks();state.rpc.mockResolvedValue({error:null});state.invalidate.mockResolvedValue(undefined)
 state.auth={user:{id:'session-a'},activeAgency:{agencyId:'agency-a',roleName:'OWNER'},permissions:new Set(),isDemo:false,reloadAccess:state.reload}
 state.query={data:{roles:[{id:'owner',name:'OWNER'},{id:'designer',name:'DESIGNER'}],permissions:[{id:'view',permission_key:'tasks.view',module:'tasks'},{id:'edit',permission_key:'tasks.edit',module:'tasks'},{id:'clients',permission_key:'clients.view',module:'clients'}],grants:[{role_id:'designer',permission_id:'clients',allowed:true}]},isError:false,isLoading:false,isFetching:false}
})
describe('Acessos por setor',()=>{
 it('saves only changed permissions and reloads access',async()=>{
  render(<PermissionStudioPage/>);fireEvent.change(screen.getByLabelText('Acesso a Produção e tarefas'),{target:{value:'work'}})
  fireEvent.click(screen.getByRole('button',{name:'Salvar acessos'}))
  await waitFor(()=>expect(state.rpc).toHaveBeenCalledWith('set_agency_role_permissions',{p_agency_id:'agency-a',p_changes:[{role_id:'designer',permission_id:'view',allowed:true},{role_id:'designer',permission_id:'edit',allowed:true}]}))
  await waitFor(()=>expect(state.reload).toHaveBeenCalledOnce());expect(state.success).toHaveBeenCalledOnce()
 })
 it('protects the owner profile',()=>{
  render(<PermissionStudioPage/>);fireEvent.change(screen.getByLabelText('Perfil de acesso'),{target:{value:'owner'}})
  expect(screen.getByLabelText('Acesso a Produção e tarefas')).toBeDisabled();expect(screen.getByRole('button',{name:'Salvar acessos'})).toBeDisabled()
 })
 it('disables saving after reverting the draft',()=>{
  render(<PermissionStudioPage/>);const sector=screen.getByLabelText('Acesso a Produção e tarefas')
  fireEvent.change(sector,{target:{value:'work'}});fireEvent.change(sector,{target:{value:'none'}})
  expect(screen.getByRole('button',{name:'Salvar acessos'})).toBeDisabled()
 })
 it('keeps the draft when the server rejects the change',async()=>{
  state.rpc.mockResolvedValue({error:{message:'Forbidden'}});render(<PermissionStudioPage/>);fireEvent.change(screen.getByLabelText('Acesso a Produção e tarefas'),{target:{value:'read'}});fireEvent.click(screen.getByRole('button',{name:'Salvar acessos'}))
  await waitFor(()=>expect(state.error).toHaveBeenCalledOnce());expect(screen.getByLabelText('Acesso a Produção e tarefas')).toHaveValue('read');expect(state.reload).not.toHaveBeenCalled()
 })
 it('clears the draft after a session change',async()=>{
  const view=render(<PermissionStudioPage/>);fireEvent.change(screen.getByLabelText('Acesso a Produção e tarefas'),{target:{value:'work'}})
  state.auth={...state.auth,user:{id:'session-b'}};view.rerender(<PermissionStudioPage/>);await waitFor(()=>expect(screen.getByLabelText('Acesso a Produção e tarefas')).toHaveValue('none'))
 })
 it('does not allow edits without permission or after load errors',()=>{
  state.auth.activeAgency.roleName='MEMBER';const view=render(<PermissionStudioPage/>);expect(screen.getByLabelText('Acesso a Produção e tarefas')).toBeDisabled()
  state.auth.activeAgency.roleName='OWNER';state.query.isError=true;view.rerender(<PermissionStudioPage/>);expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar');expect(screen.getByLabelText('Acesso a Produção e tarefas')).toBeDisabled()
 })
})
