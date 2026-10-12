import {describe,it,expect,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MigratedBriefingHistory} from './MigratedBriefingHistory';
const state=vi.hoisted(()=>({eq:vi.fn(),order:vi.fn()}));
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency-A'}));
vi.mock('@/lib/supabase/client',()=>({supabase:{from:()=>({select:()=>({eq:state.eq})})}}));
beforeEach(()=>{state.eq.mockReset();state.order.mockReset();state.eq.mockReturnValue({eq:state.eq,order:state.order});});
function show(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MigratedBriefingHistory briefingId="brief-A"/></QueryClientProvider>);}
describe('Historical briefing review',()=>{
 it('scopes records to the agency and briefing and excludes the final snapshot from the change count',async()=>{state.order.mockResolvedValue({data:[{id:'change',created_at:'2026-10-01',snapshot:{legacy_history:{campo_alterado:'objetivo_principal',valor_anterior:'Reconhecimento',valor_novo:'Relacionamento',alterado_em:'2026-10-01'}}},{id:'final',snapshot:{legacy_snapshot:{}}}],error:null});show();fireEvent.click(await screen.findByText('Ver 1 alterações históricas'));expect(screen.getByText('Reconhecimento')).toBeInTheDocument();expect(screen.getByText('Relacionamento')).toBeInTheDocument();expect(state.eq).toHaveBeenCalledWith('agency_id','agency-A');expect(state.eq).toHaveBeenCalledWith('briefing_id','brief-A');expect(state.eq).toHaveBeenCalledWith('source_system','lovable');});
 it('shows failure explicitly without presenting an empty successful history',async()=>{state.order.mockResolvedValue({data:null,error:{message:'permission denied'}});show();expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');expect(screen.queryByText('Ver 0 alterações históricas')).not.toBeInTheDocument();});
});
