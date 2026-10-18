import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react'
import {RoomContext,RoomAudioRenderer} from '@livekit/components-react'
import type {Room} from 'livekit-client'
import {useAuth} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'
import {officeEnabled} from './officeFeature'
import {OfficeVoiceContext} from './OfficeVoiceContext'
import {OfficeVoiceSession,initialVoice,type VoiceSnapshot,type VoiceToken} from './voiceSession'
import {VoiceEntryError,tokenInvocationError} from './voiceErrors'
import {nativeApp} from '@/features/app-install/appRuntime'
let voiceCleanup:Promise<void>=Promise.resolve()
export function OfficeVoiceProvider({children}:{children:ReactNode}){
 const auth=useAuth();const allowed=Boolean(officeEnabled&&supabase&&auth.session&&!auth.loading&&!auth.error&&auth.activeAgency&&(auth.activeAgency.roleName==='OWNER'||auth.permissions.has('chat.access')))
 const [view,setView]=useState<{snapshot:VoiceSnapshot;room:Room|null}>({snapshot:initialVoice,room:null})
 const session=useRef<OfficeVoiceSession|null>(null)
 const setOutputVolume=useCallback((volume:number)=>{session.current?.setOutputVolume(volume)},[])
 useEffect(()=>{
  if(!nativeApp())return
  let active=true,unlisten:(()=>void)|undefined
  void import('@tauri-apps/api/event').then(async({listen})=>{
   const stop=await listen('office-tray-mute-toggle',()=>{void session.current?.toggleMicrophone()})
   if(active)unlisten=stop;else stop()
  }).catch(()=>{})
  return()=>{active=false;unlisten?.()}
 },[])
 useEffect(()=>{
  if(!allowed)return
  let disposed=false
  const controller=new OfficeVoiceSession(async(id,signal)=>{await voiceCleanup;if(disposed)throw new Error('session_ended');const result=await supabase!.functions.invoke('office-room-token',{body:{roomId:id},signal,timeout:15000});if(result.error)throw await tokenInvocationError(result.error);const data=result.data as VoiceToken;if(!data?.token||!data.serverUrl?.startsWith('wss://'))throw new VoiceEntryError('invalid_token_response');return data},(snapshot,room)=>{if(!disposed)setView({snapshot,room});if(nativeApp())void import('@tauri-apps/api/core').then(({invoke})=>invoke('update_tray_status',{connected:snapshot.state==='connected',microphone:snapshot.microphone,camera:snapshot.camera})).catch(()=>{})})
  session.current=controller
  return()=>{disposed=true;session.current=null;voiceCleanup=controller.leave()}
 },[allowed,auth.user?.id,auth.activeAgency?.agencyId])
 const snapshot=allowed?view.snapshot:initialVoice
 const content=allowed&&view.room?<RoomContext.Provider value={view.room}>{children}<RoomAudioRenderer/></RoomContext.Provider>:children
 return <OfficeVoiceContext.Provider value={{...snapshot,join:async(id,name)=>{await session.current?.join(id,name)},leave:async()=>{await session.current?.leave()},setMicrophone:async enabled=>{await session.current?.setMicrophone(enabled)},setCamera:async enabled=>{await session.current?.setCamera(enabled)},setScreenShare:async enabled=>{await session.current?.setScreenShare(enabled)},switchDevice:async(kind,id)=>session.current?.switchDevice(kind,id)??false,setOutputVolume,startAudio:async()=>{await session.current?.startAudio()}}}>{content}</OfficeVoiceContext.Provider>
}
