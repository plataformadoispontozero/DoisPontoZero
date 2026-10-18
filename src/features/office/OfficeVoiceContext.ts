import {createContext,useContext} from 'react'
import {initialVoice,type VoiceSnapshot} from './voiceState'
export interface OfficeVoiceValue extends VoiceSnapshot {join:(id:string,name:string)=>Promise<void>;leave:()=>Promise<void>;setMicrophone:(enabled:boolean)=>Promise<void>;setCamera:(enabled:boolean)=>Promise<void>;setScreenShare:(enabled:boolean)=>Promise<void>;switchDevice:(kind:MediaDeviceKind,deviceId:string)=>Promise<boolean>;setOutputVolume:(volume:number)=>void;startAudio:()=>Promise<void>}
export const OfficeVoiceContext=createContext<OfficeVoiceValue>({...initialVoice,join:async()=>{},leave:async()=>{},setMicrophone:async()=>{},setCamera:async()=>{},setScreenShare:async()=>{},switchDevice:async()=>false,setOutputVolume:()=>{},startAudio:async()=>{}})
export const useOfficeVoice=()=>useContext(OfficeVoiceContext)
