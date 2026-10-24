import {describe,it,expect,vi,beforeEach} from 'vitest'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {BriefingPage} from './BriefingPage'
const state=vi.hoisted(()=>({remove:true,mutate:vi.fn(),error:null as Error|null}))
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency',usePermission:(key:string)=>key==='briefings.delete'?state.remove:true}))
vi.mock('./DriveBriefingsPanel',()=>({DriveBriefingsPanel:()=> <div>Drive</div>}))
vi.mock('./hooks/useBriefings',()=>({useBriefings:()=>({data:[{id:'orphan',title:'Briefing preservado',client_id:null,status:'submitted',updated_at:'2026-10-22',client:null},{id:'old',title:'Antigo',client_id:null,status:'archived',updated_at:'2026-10-21'}],isSuccess:true}),useDeleteBriefingPermanently:()=>({mutateAsync:state.mutate,reset:vi.fn(),isPending:false,isError:!!state.error,error:state.error})}))
beforeEach(()=>{state.remove=true;state.error=null;state.mutate.mockReset().mockResolvedValue({id:'orphan'})})
function show(){render(<MemoryRouter><BriefingPage/></MemoryRouter>)}
function openHistory(){fireEvent.click(screen.getByText('Sem cliente vinculado'))}
function chooseDelete(index=0){fireEvent.click(screen.getAllByRole('button',{name:'Apagar definitivamente'})[index])}
function confirmDelete(title:string){fireEvent.change(screen.getByRole('textbox',{name:'Título do briefing para confirmar exclusão'}),{target:{value:title}});fireEvent.click(screen.getAllByRole('button',{name:'Apagar definitivamente'}).at(-1)!)}
describe('Briefing history and permanent deletion',()=>{
 it('opens complete client history including archived and unlinked records',()=>{show();expect(screen.queryByText('Antigo')).not.toBeInTheDocument();openHistory();expect(screen.getAllByText(/As respostas continuam disponíveis/)).toHaveLength(2);expect(screen.getByText('Antigo')).toBeInTheDocument();expect(screen.queryByText('Área do cliente')).not.toBeInTheDocument()})
 it('requires title confirmation then waits for server acknowledgement',async()=>{show();openHistory();chooseDelete();expect(state.mutate).not.toHaveBeenCalled();expect(screen.getAllByRole('button',{name:'Apagar definitivamente'}).at(-1)).toBeDisabled();confirmDelete('Briefing preservado');await waitFor(()=>expect(state.mutate).toHaveBeenCalledWith({id:'orphan',confirmation:'Briefing preservado'}));expect(await screen.findByRole('status')).toHaveTextContent('Briefing apagado definitivamente')})
 it('offers permanent removal of an archived briefing from its history',async()=>{show();fireEvent.click(screen.getByRole('button',{name:'Arquivados (1)'}));openHistory();chooseDelete(1);confirmDelete('Antigo');await waitFor(()=>expect(state.mutate).toHaveBeenCalledWith({id:'old',confirmation:'Antigo'}))})
 it('does not offer mutations without delete permission',()=>{state.remove=false;show();openHistory();expect(screen.queryByRole('button',{name:'Apagar definitivamente'})).not.toBeInTheDocument()})
 it('does not display success when the server fails',async()=>{state.mutate.mockRejectedValue(new Error('Sem acesso'));show();openHistory();chooseDelete();confirmDelete('Briefing preservado');await waitFor(()=>expect(state.mutate).toHaveBeenCalled());expect(screen.queryByRole('status')).not.toBeInTheDocument();expect(screen.getByRole('textbox',{name:'Título do briefing para confirmar exclusão'})).toBeInTheDocument()})
})
