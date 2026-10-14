import {useEffect,useRef,useState,type ReactNode} from 'react'
import {RoomContext,RoomAudioRenderer} from '@livekit/components-react'
import type {Room} from 'livekit-client'
import {useAuth} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'
import {officeEnabled} from './officeFeature'
import {OfficeVoiceContext} from './OfficeVoiceContext'
import {OfficeVoiceSession,initialVoice,type VoiceSnapshot,type VoiceToken} from './voiceSession'
let voiceCleanup:Promise<void>=Promise.resolve()
export function OfficeVoiceProvider({children}:{children:ReactNode}){
 const auth=useAuth();const allowed=Boolean(officeEnabled&&supabase&&auth.session&&!auth.loading&&!auth.error&&auth.activeAgency&&(auth.activeAgency.roleName==='OWNER'||auth.permissions.has('chat.access')))
 const [view,setView]=useState<{snapshot:VoiceSnapshot;room:Room|null}>({snapshot:initialVoice,room:null})
 const session=useRef<OfficeVoiceSession|null>(null)
 useEffect(()=>{
  if(!allowed)return
  let disposed=false
  const controller=new OfficeVoiceSession(async(id,signal)=>{await voiceCleanup;if(disposed)throw new Error('session_ended');const result=await supabase!.functions.invoke('office-room-token',{body:{roomId:id},signal,timeout:15000});if(result.error)throw new Error('token_unavailable');const data=result.data as VoiceToken;if(!data?.token||!data.serverUrl?.startsWith('wss://'))throw new Error('invalid_token_response');return data},(snapshot,room)=>{if(!disposed)setView({snapshot,room})})
  session.current=controller
  return()=>{disposed=true;session.current=null;voiceCleanup=controller.leave()}
 },[allowed,auth.user?.id,auth.activeAgency?.agencyId])
 const snapshot=allowed?view.snapshot:initialVoice
 return <OfficeVoiceContext.Provider value={{...snapshot,join:async(id,name)=>{await session.current?.join(id,name)},leave:async()=>{await session.current?.leave()},setMicrophone:async enabled=>{await session.current?.setMicrophone(enabled)},startAudio:async()=>{await session.current?.startAudio()}}}>{children}{allowed&&view.room&&<RoomContext.Provider value={view.room}><RoomAudioRenderer/></RoomContext.Provider>}</OfficeVoiceContext.Provider>
}
