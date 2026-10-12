import {beforeEach,describe,it,expect,vi} from 'vitest';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {DriveBriefingsPanel} from './DriveBriefingsPanel';
const state=vi.hoisted(()=>({invoke:vi.fn(),rpc:vi.fn(),documents:[] as any[],review:true}));
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency-A',usePermission:(p:string)=>p==='briefings.review'?state.review:true}));
vi.mock('@/features/clients/hooks/useClients',()=>({useClients:()=>({data:[{id:'client-A',name:'Cliente A'}]})}));
vi.mock('@/lib/supabase/client',()=>({supabase:{functions:{invoke:state.invoke},rpc:state.rpc}}));
vi.mock('./driveDocuments',async importOriginal=>({...await importOriginal<object>(),useDriveBriefDocuments:()=>({data:state.documents,isPending:false,isError:false})}));
const doc={id:'doc-A',agency_id:'agency-A',client_id:'client-A',google_file_id:'google-doc-12345',name:'Briefing da marca',path:'02 BRIEFINGS & DOCS/Briefing',mime_type:'text/plain',version:'2',reviewed_version:null,reviewed_at:null,reviewed_context:{},available:true,can_read_text:true,synced_at:'2026-10-12T00:00:00Z'};
beforeEach(()=>{state.documents=[doc];state.review=true;state.invoke.mockReset();state.rpc.mockReset();state.rpc.mockResolvedValue({data:'doc-A',error:null});});
function show(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><DriveBriefingsPanel clientId="client-A"/></MemoryRouter></QueryClientProvider>);}
describe('Drive briefing mirror',()=>{
 it('shows a partial scan explicitly and scopes the request to the selected client',async()=>{state.invoke.mockResolvedValue({data:{scan:{complete:false}}});show();fireEvent.click(screen.getByRole('button',{name:'Buscar briefs no Drive'}));await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('lista é parcial'));expect(state.invoke).toHaveBeenCalledWith('google-workspace',{body:{agencyId:'agency-A',clientId:'client-A',action:'client-drive-documents'}});});
 it('requires confirmation and saves only reviewed structured context, not the source text',async()=>{state.invoke.mockResolvedValue({data:{document:{version:'3'},text:'Documento original privado'}});show();fireEvent.click(screen.getByRole('button',{name:'Revisar contexto'}));await screen.findByText('Documento original privado');expect(screen.getByRole('button',{name:'Salvar contexto revisado'})).toBeDisabled();fireEvent.change(screen.getByLabelText('Objetivo'),{target:{value:'Melhorar reconhecimento'}});fireEvent.click(screen.getByLabelText('Conferi o documento e revisei as informações acima'));fireEvent.click(screen.getByRole('button',{name:'Salvar contexto revisado'}));await waitFor(()=>expect(state.rpc).toHaveBeenCalledWith('save_client_drive_review',{p_document:'doc-A',p_version:'3',p_context:{objective:'Melhorar reconhecimento'}}));});
 it('does not offer stale or unavailable reviews for calendar generation',()=>{state.documents=[{...doc,reviewed_at:'2026-10-12',reviewed_version:'1'},{...doc,id:'doc-B',available:false,reviewed_at:'2026-10-12',reviewed_version:'2'}];show();expect(screen.queryByRole('link',{name:'Usar no calendário'})).not.toBeInTheDocument();});
 it('restricts review controls to reviewers',()=>{state.review=false;show();expect(screen.queryByRole('button',{name:'Revisar contexto'})).not.toBeInTheDocument();});
});
