import {render,screen,fireEvent} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe,it,expect,vi,beforeEach} from 'vitest'
import {SocialMediaPage} from './SocialMediaPage'
import {campaignSummary,campaignLink,type SocialCampaign} from './operations'
const state=vi.hoisted(()=>({fail:false,canCreate:true,canTasks:true}))
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency',usePermission:(p:string)=>p==='strategy.create'?state.canCreate:state.canTasks}))
vi.mock('@/features/clients/hooks/useClients',()=>({useClients:()=>({data:[{id:'a',name:'Cliente A',profile:{monthly_objective:'Objetivo A'}},{id:'b',name:'Cliente B',profile:{monthly_objective:'Objetivo B'}}]})}))
vi.mock('@/lib/supabase/client',()=>({supabase:{},isSupabaseConfigured:true}))
vi.mock('@tanstack/react-query',()=>({useQuery:({queryKey}: {queryKey:string[]})=>({data:queryKey[0]==='social-operations'?(state.fail?undefined:[{id:'campaign',client_id:queryKey[2]||'a',month:'2026-10-01',status:'changes_requested',project_id:'project',items:[{title:'Conteúdo'}]}]):[],isError:state.fail&&queryKey[0]==='social-operations',isSuccess:true,isFetching:false,isLoading:false,refetch:vi.fn()})}))
beforeEach(()=>{state.fail=false;state.canCreate=true;state.canTasks=true})
describe('Social Media operations',()=>{
 it('connects selected client to its campaign and clears old context when switching',()=>{render(<MemoryRouter initialEntries={['/social-media?clientId=a']}><SocialMediaPage/></MemoryRouter>);expect(screen.getByText('Objetivo A')).toBeInTheDocument();expect(screen.getByRole('link',{name:'Criar calendário'})).toHaveAttribute('href','/editorial/new?clientId=a');expect(screen.getByRole('link',{name:'Abrir calendário'})).toHaveAttribute('href','/editorial?clientId=a&campaignId=campaign');fireEvent.change(screen.getByLabelText('Cliente da operação'),{target:{value:'b'}});expect(screen.queryByText('Objetivo A')).not.toBeInTheDocument();expect(screen.getByText('Objetivo B')).toBeInTheDocument();expect(screen.getByRole('link',{name:'Abrir calendário'})).toHaveAttribute('href','/editorial?clientId=b&campaignId=campaign')})
 it('shows query errors and removes creation/production actions without permission',()=>{state.fail=true;state.canCreate=false;state.canTasks=false;render(<MemoryRouter initialEntries={['/social-media?clientId=a']}><SocialMediaPage/></MemoryRouter>);expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os calendários');expect(screen.queryByRole('link',{name:'Criar calendário'})).not.toBeInTheDocument();expect(screen.queryByRole('link',{name:'Design'})).not.toBeInTheDocument();expect(screen.queryByRole('heading',{name:'Demandas do cliente'})).not.toBeInTheDocument()})
 it('counts actual contents and pending stages without inventing production',()=>{const c={id:'x',client_id:'a',month:'2026-10-01',status:'pending',project_id:null,items:[{},{}]} as SocialCampaign;expect(campaignSummary([c,{...c,id:'y',status:'changes_requested',items:[]}])).toEqual({campaigns:2,pieces:2,pending:1,adjustments:1});expect(campaignLink(c)).toBe('/editorial?clientId=a&campaignId=x')})
})
