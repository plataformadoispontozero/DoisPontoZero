export interface VoiceSnapshot {roomId:string|null;roomName:string;state:'idle'|'connecting'|'connected'|'reconnecting'|'error';microphone:boolean;microphoneBusy:boolean;audioBlocked:boolean;error:string|null;participants:{id:string;name:string;speaking:boolean;microphone:boolean;quality:string}[]}
export const initialVoice:VoiceSnapshot={roomId:null,roomName:'',state:'idle',microphone:false,microphoneBusy:false,audioBlocked:false,error:null,participants:[]}
export type VoiceToken={token:string;serverUrl:string;expiresIn:number}
