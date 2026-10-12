import {renderHook,act,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {beforeEach,expect,it,vi} from 'vitest';
import {useSingleMeeting} from './useMeetings';
const {rpc,from}=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock('@/features/auth/AuthProvider',()=>({useAuth:()=>({user:{id:'11111111-1111-4111-8111-111111111111'},activeAgency:{agencyId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}})}));
vi.mock('@/lib/supabase/client',()=>({isSupabaseConfigured:true,supabase:{rpc,from}}));
const meeting={id:'33333333-3333-4333-8333-333333333333',agency_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',meeting_agenda_items:[],meeting_minutes:[],meeting_decisions:[],meeting_action_items:[]};
function wrapper({children}:any){return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>}
beforeEach(()=>{vi.clearAllMocks();rpc.mockResolvedValue({data:true,error:null});const q:any={select:()=>q,eq:()=>q,single:()=>Promise.resolve({data:meeting,error:null})};from.mockReturnValue(q);});
it('writes new agenda with UUID through transactional tenant RPC',async()=>{const {result}=renderHook(()=>useSingleMeeting(meeting.id),{wrapper});await waitFor(()=>expect(result.current.meeting).not.toBeNull());await act(async()=>{await result.current.addAgendaItem({title:'Revisão'});});const [name,args]=rpc.mock.calls[0];expect(name).toBe('save_meeting_content');expect(args.p_agency_id).toBe(meeting.agency_id);expect(args.p_meeting_id).toBe(meeting.id);expect(args.p_changes.agenda[0].id).toMatch(/^[0-9a-f-]{36}$/);expect(args.p_changes.agenda[0].title).toBe('Revisão');});
it('saves minutes without swallowing transaction errors',async()=>{const {result}=renderHook(()=>useSingleMeeting(meeting.id),{wrapper});await waitFor(()=>expect(result.current.meeting).not.toBeNull());rpc.mockResolvedValue({error:{message:'Acesso negado'}});await act(async()=>{await expect(result.current.updateMinutes('Ata revisada')).rejects.toEqual({message:'Acesso negado'});});expect(rpc.mock.calls[0][1].p_changes.minutes.content).toBe('Ata revisada');});
