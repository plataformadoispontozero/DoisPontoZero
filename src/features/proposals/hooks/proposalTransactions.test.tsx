import {renderHook,act,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {beforeEach,expect,it,vi} from 'vitest';
import {useCreateProposal,useUpdateProposal} from './useProposals';
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('@/features/auth/AuthProvider',()=>({useAuth:()=>({user:{id:'11111111-1111-4111-8111-111111111111'},activeAgency:{agencyId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}})}));
vi.mock('@/lib/supabase/client',()=>({isSupabaseConfigured:true,supabase:{rpc}}));
function wrapper({children}:any){return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>}
beforeEach(()=>{rpc.mockReset();rpc.mockResolvedValue({data:{id:'proposal',sections:[],items:[],pricing:{total_cents:1200}},error:null});});
it('creates with tenant and template through one transaction',async()=>{const {result}=renderHook(()=>useCreateProposal(),{wrapper});await act(async()=>{await result.current.mutateAsync({title:' Oferta ',client_id:'client',template_id:'template'});});expect(rpc).toHaveBeenCalledWith('create_agency_proposal',{p_agency_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',p_payload:{title:'Oferta',client_id:'client',template_id:'template',description:null,briefing_id:null,strategy_id:null}});});
it('saves sections and items atomically without computing trusted totals in browser',async()=>{const {result}=renderHook(()=>useUpdateProposal(),{wrapper});const changes={sections:[],items:[],title:'Revisada'};await act(async()=>{await result.current.mutateAsync({id:'proposal',...changes});});expect(rpc).toHaveBeenCalledWith('save_agency_proposal',{p_agency_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',p_proposal_id:'proposal',p_changes:changes});await waitFor(()=>expect(result.current.data?.pricing?.total_cents).toBe(1200));});
it('reports failure without replacing the original error',async()=>{rpc.mockResolvedValue({error:{message:'Transação rejeitada'}});const {result}=renderHook(()=>useUpdateProposal(),{wrapper});await act(async()=>{await expect(result.current.mutateAsync({id:'proposal',items:[]})).rejects.toEqual({message:'Transação rejeitada'});});await waitFor(()=>expect(result.current.isError).toBe(true));});
