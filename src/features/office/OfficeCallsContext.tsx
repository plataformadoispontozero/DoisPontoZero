import {createContext,useContext} from 'react'
export interface OfficeVoiceInvitation {
 id:string;status:'pending'|'accepted';direction:'incoming'|'outgoing';counterpart_id:string;counterpart_name:string|null;expires_at:string;created_at:string
}
export interface OfficeCallsValue {
 enabled:boolean;invitations:OfficeVoiceInvitation[];current:OfficeVoiceInvitation|null;doNotDisturb:boolean;loading:boolean;error:string|null
 invite:(userId:string,name:string)=>Promise<void>;accept:(invitation:OfficeVoiceInvitation)=>Promise<void>;decline:(invitation:OfficeVoiceInvitation)=>Promise<void>;cancel:(invitation:OfficeVoiceInvitation)=>Promise<void>;leave:()=>Promise<void>;setDoNotDisturb:(enabled:boolean)=>Promise<void>
}
const empty:OfficeCallsValue={enabled:false,invitations:[],current:null,doNotDisturb:false,loading:false,error:null,invite:async()=>{},accept:async()=>{},decline:async()=>{},cancel:async()=>{},leave:async()=>{},setDoNotDisturb:async()=>{}}
export const OfficeCallsContext=createContext<OfficeCallsValue>(empty)
export const useOfficeCalls=()=>useContext(OfficeCallsContext)
