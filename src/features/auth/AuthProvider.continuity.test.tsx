import {act,render,screen,waitFor} from '@testing-library/react'
import {it,expect,vi} from 'vitest'
import {AuthProvider,useAuth} from './AuthProvider'
const h=vi.hoisted(()=>({callback:null as null|((event:string,session:any)=>void),getUser:vi.fn(),session:{user:{id:'member',email:'member@example.com'},access_token:'test-session'}}))
vi.mock('@/lib/supabase/client',()=>({isSupabaseConfigured:true,supabase:{auth:{onAuthStateChange:(callback:any)=>{h.callback=callback;return {data:{subscription:{unsubscribe:vi.fn()}}}},getSession:async()=>({data:{session:h.session}}),getUser:h.getUser},from:(table:string)=>{const result=table==='agency_members'?{data:[{agency_id:'agency',role_id:'role',agencies:{id:'agency',name:'Agência',status:'active'},roles:{name:'OWNER'}}]}:{data:{full_name:'Membro'}};const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>result,then:(resolve:any)=>Promise.resolve(result).then(resolve)};return q}}}))
function State(){const auth=useAuth();return <div>{auth.loading?'Verificando':`${auth.user?.id||'anônimo'}:${auth.activeAgency?.agencyId||'sem agência'}`}</div>}
it('preserves hydrated access on token refresh and repeated sign in, then clears on sign out',async()=>{
 h.getUser.mockResolvedValue({data:{user:h.session.user}})
 render(<AuthProvider><State/></AuthProvider>);expect(await screen.findByText('member:agency')).toBeVisible()
 let resolve:any;h.getUser.mockReturnValue(new Promise(done=>{resolve=done}))
 act(()=>h.callback?.('TOKEN_REFRESHED',{...h.session,access_token:'refreshed'}))
 expect(screen.getByText('member:agency')).toBeVisible();expect(screen.queryByText('Verificando')).toBeNull()
 await act(async()=>resolve({data:{user:h.session.user}}))
 act(()=>h.callback?.('SIGNED_IN',{...h.session}));expect(screen.getByText('member:agency')).toBeVisible()
 act(()=>h.callback?.('SIGNED_OUT',null));await waitFor(()=>expect(screen.getByText('anônimo:sem agência')).toBeVisible())
})
