import {render,screen,fireEvent} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe,it,expect,vi,beforeEach} from 'vitest'
import {SocialMediaPage} from './SocialMediaPage'
import {campaignSummary,campaignLink,type SocialCampaign} from './operations'
const state=vi.hoisted(()=>({fail:false,canCreate:true,canTasks:true,demands:[] as {id:string;title:string;status:string;project_id:string;due_date:null;project:{client_id:string;name:string;client:{id:string;name:string}}}[]}))
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency',usePermission:(p:string)=>p==='strategy.create'?state.canCreate:state.canTasks}))
vi.mock('@/features/clients/hooks/useClients',()=>({useClients:()=>({data:[{id:'a',name:'Cliente A',profile:{monthly_objective:'Objetivo A'}},{id:'b',name:'Cliente B',profile:{monthly_objective:'Objetivo B'}}]})}))
vi.mock('@/features/projects/hooks/useProjects',()=>({useProjectBoard:()=>({data:{columns:[]}})}))
vi.mock('@/features/projects/components/TaskDetailPanel',()=>({TaskDetailPanel:({taskId,onClose}:{taskId:string;onClose:()=>void})=><div role="dialog">Demanda {taskId}<button onClick={onClose}>Fechar teste</button></div>}))
vi.mock('@/lib/supabase/client',()=>({supabase:{},isSupabaseConfigured:true}))
vi.mock('@tanstack/react-query',()=>({useQuery:({queryKey}: {queryKey:string[]})=>({data:queryKey[0]==='social-operations'?(state.fail?undefined:[{id:'campaign',client_id:queryKey[2]||'a',month:'2026-10-01',status:'changes_requested',project_id:'project',items:[{title:'Conteúdo'}]}]):state.demands.filter(t=>!queryKey[2]||t.project.client_id===queryKey[2]),isError:state.fail&&queryKey[0]==='social-operations',isSuccess:true,isFetching:false,isLoading:false,refetch:vi.fn()})}))
beforeEach(()=>{state.fail=false;state.canCreate=true;state.canTasks=true;state.demands=[]})
describe('Social Media operations',()=>{
 it('connects selected client to its campaign and clears old context when switching',()=>{render(<MemoryRouter initialEntries={['/social-media?clientId=a']}><SocialMediaPage/></MemoryRouter>);expect(screen.getByText('Objetivo A')).toBeInTheDocument();expect(screen.getByRole('link',{name:'Criar calendário'})).toHaveAttribute('href','/editorial/new?clientId=a');expect(screen.getByRole('link',{name:'Abrir calendário'})).toHaveAttribute('href','/editorial?clientId=a&campaignId=campaign');fireEvent.change(screen.getByLabelText('Cliente da operação'),{target:{value:'b'}});expect(screen.queryByText('Objetivo A')).not.toBeInTheDocument();expect(screen.getByText('Objetivo B')).toBeInTheDocument();expect(screen.getByRole('link',{name:'Abrir calendário'})).toHaveAttribute('href','/editorial?clientId=b&campaignId=campaign')})
 it('shows query errors and removes creation/production actions without permission',()=>{state.fail=true;state.canCreate=false;state.canTasks=false;render(<MemoryRouter initialEntries={['/social-media?clientId=a']}><SocialMediaPage/></MemoryRouter>);expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os calendários');expect(screen.queryByRole('link',{name:'Criar calendário'})).not.toBeInTheDocument();expect(screen.queryByRole('link',{name:'Design'})).not.toBeInTheDocument();expect(screen.queryByRole('heading',{name:'Demandas do cliente'})).not.toBeInTheDocument()})
 it('counts actual contents and pending stages without inventing production',()=>{const c={id:'x',client_id:'a',month:'2026-10-01',status:'pending',project_id:null,items:[{},{}]} as SocialCampaign;expect(campaignSummary([c,{...c,id:'y',status:'changes_requested',items:[]}])).toEqual({campaigns:2,pieces:2,pending:1,adjustments:1});expect(campaignLink(c)).toBe('/editorial?clientId=a&campaignId=x')})
})

it('shows all months and groups all client demands before selection, opening a modal',()=>{
 state.demands=[{id:'task-a',title:'Demanda A',status:'open',project_id:'project-a',due_date:null,project:{client_id:'a',name:'Projeto A',client:{id:'a',name:'Cliente A'}}},{id:'task-b',title:'Demanda B',status:'review',project_id:'project-b',due_date:null,project:{client_id:'b',name:'Projeto B',client:{id:'b',name:'Cliente B'}}}];
 render(<MemoryRouter initialEntries={['/social-media']}><SocialMediaPage/></MemoryRouter>);
 expect(screen.getByLabelText('Mês da operação')).toHaveValue('');
 expect(screen.getByLabelText('Demandas de Cliente A')).toHaveTextContent('Demanda A');
 expect(screen.getByLabelText('Demandas de Cliente B')).toHaveTextContent('Demanda B');
 screen.getByLabelText('Demandas de Cliente A').setAttribute('open','');
 fireEvent.click(screen.getByRole('button',{name:/Demanda A/}));expect(screen.getByRole('dialog')).toHaveTextContent('task-a');
 fireEvent.click(screen.getByRole('button',{name:'Fechar teste'}));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Cliente da operação'),{target:{value:'b'}});
 expect(screen.queryByRole('button',{name:/Demanda A/})).not.toBeInTheDocument();expect(screen.getByText('Demanda B')).toBeInTheDocument();
});
