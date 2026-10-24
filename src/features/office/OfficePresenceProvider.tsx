import {useEffect,useRef,useState,useCallback,type ReactNode} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useAuth} from '@/features/auth/AuthProvider'
import {supabase,isSupabaseConfigured} from '@/lib/supabase/client'
import {officeEnabled} from './officeFeature'
import {OfficePresenceSession,type OfficeMember,type PresenceSnapshot,type PresenceStatus,type PresenceTransport} from './presenceSession'
import {OfficePresenceContext as Context,initialPresence as initial} from './OfficePresenceContext'
import {nativeApp} from '@/features/app-install/appRuntime'
let cleanupQueue:Promise<unknown>=Promise.resolve()
export function OfficePresenceProvider({children}:{children:ReactNode}){
 const auth=useAuth(),agency=auth.activeAgency?.agencyId,user=auth.user?.id
 const allowed=Boolean(officeEnabled&&isSupabaseConfigured&&supabase&&auth.session&&!auth.loading&&!auth.error&&agency&&user&&(auth.activeAgency?.roleName==='OWNER'||auth.permissions.has('chat.access')))
 const [snapshot,setSnapshot]=useState<PresenceSnapshot>(initial),[generation,setGeneration]=useState(0),[paused,setPaused]=useState(false)
 const [availability,setAvailabilityState]=useState<Exclude<PresenceStatus,'offline'|'in_room'>>('available'),[roomId,setRoomId]=useState<string|null>(null)
 const session=useRef<OfficePresenceSession|null>(null),idle=useRef<ReturnType<typeof setTimeout>|null>(null)
 const state=useRef({availability,roomId});state.current={availability,roomId}
 const members=useQuery({queryKey:['office_presence_members',agency,user],enabled:allowed,staleTime:60000,retry:1,queryFn:async():Promise<OfficeMember[]>=>{const result=await supabase!.rpc('office_presence_directory',{p_agency:agency});if(result.error)throw result.error;return result.data||[]}})
 const membersKey=(members.data||[]).map(m=>m.user_id).sort().join(',')
 const setRoom=useCallback((id:string)=>{setRoomId(id);setAvailabilityState('available')},[])
 const retry=()=>{setPaused(false);void members.refetch();setGeneration(n=>n+1)}
 useEffect(()=>{
  if(!allowed||paused||!supabase||!agency||!user||!members.data?.some(m=>m.user_id===user)){setSnapshot({connection:members.isError?'error':allowed&&members.isLoading?'connecting':'offline',people:[]});return}
  const client=supabase;let disposed=false;let control:OfficePresenceSession|null=null
  setSnapshot(initial)
  void cleanupQueue.then(()=>{if(disposed)return
   control=new OfficePresenceSession(client as unknown as PresenceTransport,agency,user,members.data!,value=>{if(!disposed)setSnapshot(value);if(nativeApp())void import('@tauri-apps/api/core').then(({invoke})=>invoke('update_tray_presence',{online:value.connection==='connected'&&Boolean(value.people.find(person=>person.user_id===user&&person.status!=='offline'))})).catch(()=>{})})
   session.current=control;control.start();const current=state.current;control.update(current.availability==='available'&&current.roomId?'in_room':current.availability,current.roomId)
   client.realtime.onHeartbeat(status=>control?.heartbeat(status))
  }).catch(()=>{if(!disposed)setSnapshot({connection:'error',people:[]});cleanupQueue=cleanupQueue.then(()=>control?.stop())})
  const offline=()=>control?.disconnected('offline')
  const online=()=>{if(!disposed){void members.refetch();setGeneration(n=>n+1)}}
  const visible=()=>{if(document.visibilityState==='visible'&&!client.realtime.isConnected())online()}
  window.addEventListener('offline',offline);window.addEventListener('online',online);document.addEventListener('visibilitychange',visible)
  return()=>{disposed=true;session.current=null;if(nativeApp())void import('@tauri-apps/api/core').then(({invoke})=>invoke('update_tray_presence',{online:false})).catch(()=>{});client.realtime.onHeartbeat(()=>{});window.removeEventListener('offline',offline);window.removeEventListener('online',online);document.removeEventListener('visibilitychange',visible);cleanupQueue=cleanupQueue.then(()=>control?.stop())}

 // Directory identity changes restart only this scope, never route transitions.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[allowed,paused,agency,user,membersKey,members.isError,generation])
 useEffect(()=>{session.current?.update(availability==='available'&&roomId?'in_room':availability,roomId)},[availability,roomId])
 useEffect(()=>{if(!allowed||paused)return
  const activity=()=>{if(idle.current)clearTimeout(idle.current);if(state.current.availability==='away')setAvailabilityState('available');idle.current=setTimeout(()=>{if(state.current.availability!=='busy')setAvailabilityState('away')},5*60*1000)}
  window.addEventListener('pointerdown',activity);window.addEventListener('keydown',activity);activity()
  return()=>{window.removeEventListener('pointerdown',activity);window.removeEventListener('keydown',activity);if(idle.current)clearTimeout(idle.current)}
 },[allowed,paused])
 return <Context.Provider value={{...snapshot,enabled:allowed,roomId,setRoom,setAvailability:status=>{if(status==='available')setRoomId(null);setAvailabilityState(status)},leave:()=>{setRoomId(null);setPaused(true);setSnapshot({connection:'offline',people:[]})},retry}}>{children}</Context.Provider>
}
