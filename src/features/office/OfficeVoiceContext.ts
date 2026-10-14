import {createContext,useContext} from 'react'
import {initialVoice,type VoiceSnapshot} from './voiceSession'
export interface OfficeVoiceValue extends VoiceSnapshot {join:(id:string,name:string)=>Promise<void>;leave:()=>Promise<void>;setMicrophone:(enabled:boolean)=>Promise<void>;startAudio:()=>Promise<void>}
export const OfficeVoiceContext=createContext<OfficeVoiceValue>({...initialVoice,join:async()=>{},leave:async()=>{},setMicrophone:async()=>{},startAudio:async()=>{}})
export const useOfficeVoice=()=>useContext(OfficeVoiceContext)
