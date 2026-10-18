import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {supabase,isSupabaseConfigured} from '@/lib/supabase/client'
import {useAuth} from '@/features/auth/AuthProvider'
import {useOfficeVoice} from './OfficeVoiceContext'
import {useOfficePresence} from './OfficePresenceContext'
import {officeCallsEnabled} from './officeFeature'
import {nativeApp} from '@/features/app-install/appRuntime'
import {OfficeCallsContext,type OfficeVoiceInvitation} from './OfficeCallsContext'

type InvitationRow=OfficeVoiceInvitation
interface PreviousSession{roomId:string|null;roomName:string;availability:'available'|'away'|'busy'}
function message(error:unknown){const raw=error&&typeof error==='object'&&'message'in error?String(error.message):'';if(/OFFICE_RECIPIENT_BUSY|OFFICE_PARTICIPANT_BUSY/.test(raw))return 'A pessoa está ocupada ou ativou Não perturbe.';if(/OFFICE_INVITATION_RATE_LIMIT/.test(raw))return 'Limite de convites atingido. Tente novamente mais tarde.';if(/LiveKit|not configured|livekit_not_configured/i.test(raw))return 'A chamada não está configurada no momento.';return 'Não foi possível concluir o convite. Verifique a conexão e tente novamente.'}
export function OfficeCallsProvider({children}:{children:ReactNode}){
 const auth=useAuth(),agency=auth.activeAgency?.agencyId,user=auth.user?.id,voice=useOfficeVoice(),presence=useOfficePresence(),client=useQueryClient()
 const allowed=Boolean(officeCallsEnabled&&isSupabaseConfigured&&supabase&&auth.session&&!auth.loading&&!auth.error&&agency&&user&&(auth.activeAgency?.roleName==='OWNER'||auth.permissions.has('chat.access')))
 const key=['office_voice_invitations',agency,user] as const
 const [current,setCurrent]=useState<InvitationRow|null>(null),currentRef=useRef<InvitationRow|null>(null)
 const [previous,setPrevious]=useState<PreviousSession|null>(null),previousRef=useRef<PreviousSession|null>(null)
 const [error,setError]=useState<string|null>(null),[dnd,setDnd]=useState(false),[dndBusy,setDndBusy]=useState(false)
 const query=useQuery({queryKey:key,enabled:allowed,refetchInterval:current?10000:20000,queryFn:async():Promise<InvitationRow[]>=>{const result=await supabase!.rpc('office_voice_invite_directory',{p_agency:agency});if(result.error)throw result.error;return (result.data||[]) as InvitationRow[]}})
 const replaceCurrent=(value:InvitationRow|null)=>{currentRef.current=value;setCurrent(value)}
 const replacePrevious=(value:PreviousSession|null)=>{previousRef.current=value;setPrevious(value)}
 useEffect(()=>{if(!allowed||!supabase||!agency)return;const channel=supabase.channel(`office_voice_invites_${agency}_${user}`)
  .on('postgres_changes',{event:'*',schema:'public',table:'office_voice_invitations',filter:`agency_id=eq.${agency}`},()=>void client.invalidateQueries({queryKey:key}))
  .subscribe();return()=>{void supabase?.removeChannel(channel)}
 },[allowed,agency,user,client])
 useEffect(()=>{if(!allowed||!supabase||!agency||!user)return;let alive=true
  void supabase.from('chat_preferences').select('office_do_not_disturb').eq('agency_id',agency).eq('user_id',user).maybeSingle().then(({data,error:readError})=>{if(alive&&!readError)setDnd(Boolean(data?.office_do_not_disturb))})
  return()=>{alive=false}
 },[allowed,agency,user])
 const rememberSession=useCallback(()=>{
  const self=presence.people.find(person=>person.user_id===user)
  const status=self?.status==='away'?'away':dnd||self?.status==='busy'?'busy':'available'
  replacePrevious({roomId:voice.roomId,roomName:voice.roomName,availability:status})
  presence.setAvailability('busy')
 },[presence.people,user,dnd,voice.roomId,voice.roomName])
 const restoreSession=useCallback(async()=>{
  const prior=previousRef.current;replacePrevious(null);await voice.leave();
  if(prior){presence.setAvailability(prior.availability);if(prior.roomId)await voice.join(prior.roomId,prior.roomName)}
 },[voice.leave,voice.join,presence.setAvailability])
 const respond=useCallback(async(invitation:OfficeVoiceInvitation,action:'accept'|'decline'|'cancel')=>{
  if(!supabase||!agency)return
  const result=await supabase.rpc('office_voice_invite_respond',{p_invitation:invitation.id,p_response:action});if(result.error)throw result.error
  await client.invalidateQueries({queryKey:key})
 },[agency,client])
 const accept=useCallback(async(invitation:OfficeVoiceInvitation)=>{
  if(!allowed||!supabase)return
  setError(null)
  try{
   await respond(invitation,'accept');rememberSession()
   const accepted={...invitation,status:'accepted' as const};replaceCurrent(accepted)
   client.setQueryData<InvitationRow[]>(key,old=>[accepted,...(old||[]).filter(item=>item.id!==accepted.id)])
   await voice.join(invitation.id,`Conversa privada · ${invitation.counterpart_name||'Equipe'}`)
  }catch(cause){setError(message(cause))}
 },[allowed,agency,respond,rememberSession,client,voice.join])
 const invite=useCallback(async(target:string,name:string)=>{
  if(!allowed||!supabase||!agency)return
  setError(null)
  try{
   const result=await supabase.rpc('office_voice_invite_send',{p_agency:agency,p_recipient:target});if(result.error)throw result.error
   const data=result.data as {id:string;status:'pending';expires_at:string}
   const outgoing:InvitationRow={...data,direction:'outgoing',counterpart_id:target,counterpart_name:name,created_at:new Date().toISOString()}
   rememberSession();replaceCurrent(outgoing);client.setQueryData<InvitationRow[]>(key,old=>[outgoing,...(old||[]).filter(item=>item.id!==outgoing.id)])
   void client.invalidateQueries({queryKey:key})
  }catch(cause){setError(message(cause))}
 },[allowed,agency,rememberSession,client,voice.join])
 const decline=useCallback(async(invitation:OfficeVoiceInvitation)=>{try{setError(null);await respond(invitation,'decline')}catch(cause){setError(message(cause))}},[respond])
 const cancel=useCallback(async(invitation:OfficeVoiceInvitation)=>{try{setError(null);await respond(invitation,'cancel');if(currentRef.current?.id===invitation.id){replaceCurrent(null);await restoreSession()}}catch(cause){setError(message(cause))}},[respond,restoreSession])
 const leave=useCallback(async()=>{
  const active=currentRef.current
  if(!active){await voice.leave();return}
  setError(null);replaceCurrent(null)
  try{if(active.status==='accepted'){const result=await supabase?.rpc('office_voice_invite_respond',{p_invitation:active.id,p_response:'end'});if(result?.error)throw result.error}else await respond(active,'cancel')}catch(cause){setError(message(cause))}
  await restoreSession()
 },[respond,restoreSession,voice.leave])
 const leaveOffice=useCallback(async()=>{
  const active=currentRef.current
  replaceCurrent(null);replacePrevious(null)
  if(active&&supabase){try{const result=await supabase.rpc('office_voice_invite_respond',{p_invitation:active.id,p_response:active.status==='accepted'?'end':'cancel'});if(result.error)setError(message(result.error))}catch(cause){setError(message(cause))}}
  await voice.leave();presence.leave()
 },[presence.leave,voice.leave])
 useEffect(()=>{
  if(!nativeApp())return
  let active=true,unlisten:(()=>void)|undefined
  void import('@tauri-apps/api/event').then(async({listen})=>{
   const stop=await listen('office-tray-leave',()=>void leaveOffice())
   const stopQuit=await listen('office-tray-quit',()=>{void leaveOffice().finally(async()=>{try{const api=await import('@tauri-apps/api/event');await api.emit('office-tray-quit-ready')}catch{}})})
   const stopAll=()=>{stop();stopQuit()}
   if(active)unlisten=stopAll;else stopAll()
  }).catch(()=>{})
  return()=>{active=false;unlisten?.()}
 },[leaveOffice])
 useEffect(()=>{
  const active=currentRef.current
  if(!active||query.isPending||query.isError||!query.data)return
  const updated=query.data.find(invitation=>invitation.id===active.id)
  if(updated?.status==='accepted'&&active.status==='pending'){
   replaceCurrent(updated)
   void voice.join(updated.id,`Conversa privada · ${updated.counterpart_name||'Equipe'}`).catch(cause=>setError(message(cause)))
   return
  }
  if(query.data.some(invitation=>invitation.id===active.id))return
  replaceCurrent(null);void restoreSession()
 },[query.data,query.isPending,query.isError,restoreSession,voice.join])
 const setDoNotDisturb=useCallback(async(enabled:boolean)=>{
  if(!allowed||!supabase||!agency)return
  setDndBusy(true);setError(null)
  try{const result=await supabase.rpc('office_voice_set_do_not_disturb',{p_agency:agency,p_enabled:enabled});if(result.error)throw result.error;setDnd(enabled);if(!currentRef.current)presence.setAvailability(enabled?'busy':'available')}
  catch(cause){setError(message(cause))}finally{setDndBusy(false)}
 },[allowed,agency,presence.setAvailability])
 const incoming=(query.data||[]).find(invitation=>invitation.direction==='incoming'&&invitation.status==='pending')||null
 const outgoing=(query.data||[]).find(invitation=>invitation.direction==='outgoing'&&invitation.status==='pending')||null
 return <OfficeCallsContext.Provider value={{enabled:allowed,invitations:query.data||[],current,doNotDisturb:dnd,loading:query.isPending||dndBusy,error:error|| (query.isError?'Não foi possível carregar os convites de voz.':null),invite,accept,decline,cancel,leave,setDoNotDisturb}}>
  {children}
  {incoming&&<aside role="dialog" aria-label="Convite para conversa de voz" className="fixed right-4 top-24 z-[70] w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-orange-400/40 bg-[#1c1c24] p-4 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-wide text-orange-300">Convite para conversar</p><p className="mt-2 text-sm">{incoming.counterpart_name||'Um membro da equipe'} está chamando você.</p><p className="mt-1 text-xs text-zinc-400">Ao atender, você entra ouvindo; o microfone permanece desligado.</p><div className="mt-4 flex gap-2"><button className="min-h-10 rounded-lg bg-orange-600 px-3 text-sm" onClick={()=>void accept(incoming)}>Aceitar</button><button className="min-h-10 rounded-lg border border-white/20 px-3 text-sm" onClick={()=>void decline(incoming)}>Recusar</button></div></aside>}
  {outgoing&&<aside role="status" className="fixed right-4 top-24 z-[70] rounded-xl border border-white/15 bg-[#1c1c24] p-4 shadow-xl"><p className="text-sm">Chamando {outgoing.counterpart_name||'membro da equipe'}…</p><button className="mt-2 text-xs text-orange-300 underline" onClick={()=>void cancel(outgoing)}>Cancelar convite</button></aside>}
  {error&&<aside role="alert" className="fixed right-4 top-24 z-[80] max-w-sm rounded-xl border border-red-400/30 bg-[#1c1c24] p-4 text-sm text-red-200">{error}<button className="ml-3 underline" onClick={()=>setError(null)}>Fechar</button></aside>}
 </OfficeCallsContext.Provider>
}
