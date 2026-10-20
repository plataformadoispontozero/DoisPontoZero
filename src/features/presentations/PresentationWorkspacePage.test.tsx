import {render,screen,fireEvent} from '@testing-library/react'
import {describe,it,expect,vi} from 'vitest'
import {MemoryRouter,Routes,Route} from 'react-router-dom'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {PresentationWorkspacePage} from './PresentationWorkspacePage'
vi.mock('@/features/auth/AuthProvider',()=>({usePermission:()=>true,useAgencyId:()=> 'agency-A',useAuth:()=>({user:{id:'member-A'}})}))
const section={id:'section-A',agency_id:'agency-A',presentation_id:'presentation-A',section_type:'gallery',title:'Peças do cliente',content:{},position:0}
vi.mock('./hooks/usePresentations',()=>({SECTION_TYPES:[{type:'gallery',label:'Galeria de imagens',description:'Materiais'}],useSinglePresentation:()=>({presentation:{id:'presentation-A',agency_id:'agency-A',client_id:'client-A',client_name:'Cliente selecionado',title:'Apresentação',period_month:10,period_year:2026,status:'draft'},sections:[section],assets:[],versions:[],isLoading:false,isError:false,updateSection:vi.fn(),addSection:vi.fn(),deleteSection:vi.fn(),reorderSections:vi.fn(),removeAsset:vi.fn(),publishPresentation:vi.fn(),sharingToken:'TEST_LINK_PERSISTENT_123456789012345',createPublicLink:vi.fn()})}))
vi.mock('./ClientPresentationDrivePicker',()=>({ClientPresentationDrivePicker:(p:{clientId:string;presentationId:string;sectionId:string})=><div aria-label="Materiais do cliente">{p.clientId}/{p.presentationId}/{p.sectionId}</div>}))
describe('presentation client Drive integration',()=>{
 it('opens only the current client and section, without the global indexed-file picker',()=>{render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/presentations/presentation-A']}><Routes><Route path="/presentations/:presentationId" element={<PresentationWorkspacePage/>}/></Routes></MemoryRouter></QueryClientProvider>);fireEvent.click(screen.getByRole('button',{name:'Importar do Drive'}));expect(screen.getByLabelText('Materiais do cliente')).toHaveTextContent('client-A/presentation-A/section-A');expect(screen.queryByText(/Arquivos Sincronizados/)).not.toBeInTheDocument();expect(screen.queryByText(/Cliente ID:/)).not.toBeInTheDocument();expect(screen.getByLabelText('Tipo de layout')).toHaveStyle({colorScheme:'dark'})})
})

it('keeps the recovered approval URL visible while switching workspace tabs',()=>{
 render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/presentations/presentation-A']}><Routes><Route path="/presentations/:presentationId" element={<PresentationWorkspacePage/>}/></Routes></MemoryRouter></QueryClientProvider>);
 const expected=screen.getByLabelText('Link de aprovação').getAttribute('value');expect(expected).toContain('/showcase/TEST_LINK_PERSISTENT_123456789012345');fireEvent.click(screen.getByRole('button',{name:'Publicação'}));expect(screen.getByLabelText('Link de aprovação')).toHaveValue(expected);fireEvent.click(screen.getByRole('button',{name:'Editar apresentação'}));expect(screen.getByLabelText('Link de aprovação')).toHaveValue(expected)
})
