import {describe,it,expect,vi,beforeEach} from 'vitest'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {BriefingPage} from './BriefingPage'
const state=vi.hoisted(()=>({edit:true,mutate:vi.fn(),error:null as Error|null}))
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency',usePermission:(key:string)=>key==='briefings.edit'?state.edit:true}))
vi.mock('./DriveBriefingsPanel',()=>({DriveBriefingsPanel:()=> <div>Drive</div>}))
vi.mock('./hooks/useBriefings',()=>({useBriefings:()=>({data:[{id:'orphan',title:'Briefing preservado',client_id:null,status:'submitted',updated_at:'2026-10-22',client:null},{id:'old',title:'Antigo',client_id:null,status:'archived',updated_at:'2026-10-21'}],isSuccess:true}),useArchiveBriefing:()=>({mutateAsync:state.mutate,reset:vi.fn(),isPending:false,isError:!!state.error,error:state.error})}))
beforeEach(()=>{state.edit=true;state.error=null;state.mutate.mockReset().mockResolvedValue({id:'orphan',archived:true})})
function show(){render(<MemoryRouter><BriefingPage/></MemoryRouter>)}
describe('Briefing recoverable management',()=>{
 it('keeps archived records out of the active list and explains unlinked records',()=>{show();fireEvent.click(screen.getByText('Sem cliente vinculado'));expect(screen.getByText(/o cliente pode ter sido removido/)).toBeInTheDocument();expect(screen.queryByText('Antigo')).not.toBeInTheDocument();expect(screen.queryByText('Área do cliente')).not.toBeInTheDocument()})
 it('requires confirmation then waits for server acknowledgement',async()=>{show();fireEvent.click(screen.getByText('Remover / arquivar'));expect(state.mutate).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Confirmar arquivamento'));await waitFor(()=>expect(state.mutate).toHaveBeenCalledWith({id:'orphan',archived:true}));expect(await screen.findByRole('status')).toHaveTextContent('As respostas foram preservadas')})
 it('offers restoration as a draft without restoring previous public links',async()=>{show();fireEvent.click(screen.getByRole('button',{name:'Arquivados (1)'}));fireEvent.click(screen.getByText('Restaurar como rascunho'));fireEvent.click(screen.getByText('Confirmar restauração'));await waitFor(()=>expect(state.mutate).toHaveBeenCalledWith({id:'old',archived:false}))})
 it('does not offer mutations without edit permission',()=>{state.edit=false;show();expect(screen.queryByText('Remover / arquivar')).not.toBeInTheDocument()})
 it('does not display success when the server fails',async()=>{state.mutate.mockRejectedValue(new Error('Sem acesso'));show();fireEvent.click(screen.getByText('Remover / arquivar'));fireEvent.click(screen.getByText('Confirmar arquivamento'));await waitFor(()=>expect(state.mutate).toHaveBeenCalled());expect(screen.queryByRole('status')).not.toBeInTheDocument();expect(screen.getByText('Confirmar arquivamento')).toBeInTheDocument()})
})
