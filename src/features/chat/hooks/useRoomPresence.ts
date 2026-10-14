import {useOfficePresence} from '@/features/office/OfficePresenceContext'
import {officeEnabled} from '@/features/office/officeFeature'
import {useEffect,useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useAuth} from '@/features/auth/AuthProvider'
import {supabase,isSupabaseConfigured} from '@/lib/supabase/client'
export interface RoomParticipant{user_id:string;name:string|null;avatar_url:string|null}
export function useRoomPresence(channelId?:string|null){
 const office=useOfficePresence()
 const {enabled,setRoom}=office
 useEffect(()=>{if(officeEnabled&&enabled&&channelId)setRoom(channelId)},[enabled,setRoom,channelId])
 const auth=useAuth(),agency=auth.activeAgency?.agencyId,userId=auth.user?.id
 const [visible,setVisible]=useState(()=>typeof document==='undefined'||document.visibilityState!=='hidden')
 useEffect(()=>{const onVisibility=()=>setVisible(document.visibilityState!=='hidden');document.addEventListener('visibilitychange',onVisibility);return()=>document.removeEventListener('visibilitychange',onVisibility)},[])
 useEffect(()=>{if(officeEnabled||!visible||!agency||!userId||!channelId||!supabase||!isSupabaseConfigured)return;const client=supabase;return()=>{void client.rpc('leave_chat_work_room',{p_agency:agency,p_channel:channelId}).then(()=>undefined)}},[agency,userId,channelId,visible])
 const legacy=useQuery({queryKey:['chat_room_presence',agency,channelId,userId],enabled:!!(!officeEnabled&&visible&&agency&&userId&&channelId&&supabase&&isSupabaseConfigured),refetchInterval:15000,queryFn:async():Promise<RoomParticipant[]>=>{const r=await supabase!.rpc('chat_work_room_presence',{p_agency:agency,p_channel:channelId});if(r.error)throw r.error;return r.data||[]}})
 return officeEnabled?{data:office.people.filter(p=>p.status==='in_room'&&p.room_id===channelId),isError:['error','offline','reconnecting'].includes(office.connection),isFetching:office.connection==='connecting'}:legacy
}
