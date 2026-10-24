import {Room,RoomEvent,ConnectionState,type Participant} from 'livekit-client'
import {voiceEntryMessage,voiceDisconnectMessage} from './voiceErrors'
import {initialVoice,type VoiceSnapshot,type VoiceToken} from './voiceState'
export {initialVoice} from './voiceState'
export type {VoiceSnapshot,VoiceToken} from './voiceState'
function readPreference(key:string){try{return typeof localStorage==='undefined'?'':localStorage.getItem(key)||''}catch{return ''}}
export class OfficeVoiceSession {
 room:Room|null=null
 private generation=0
 private request:AbortController|null=null
 private queue:Promise<void>=Promise.resolve()
 private micQueue:Promise<void>=Promise.resolve()
 private mediaQueue:Promise<void>=Promise.resolve()
 private volume=1
 private preferredInput=''
 private preferredOutput=''
 private preferredCamera=''
 private snapshot:VoiceSnapshot={...initialVoice}
 constructor(private token:(id:string,signal:AbortSignal)=>Promise<VoiceToken>,private changed:(state:VoiceSnapshot,room:Room|null)=>void,private create:()=>Room=()=>new Room({adaptiveStream:true,dynacast:true,singlePeerConnection:false})){this.preferredInput=readPreference('office.voice.audioinput');this.preferredOutput=readPreference('office.voice.audiooutput');this.preferredCamera=readPreference('office.voice.videoinput');this.volume=Number(readPreference('office.voice.volume')||1);this.changed(this.snapshot,null)}
 private emit(next:Partial<VoiceSnapshot>){this.snapshot={...this.snapshot,...next};this.changed(this.snapshot,this.room)}
 private members(room:Room){const all:Participant[]=[room.localParticipant,...room.remoteParticipants.values()];for(const p of room.remoteParticipants.values())p.setVolume(this.volume);this.emit({microphone:room.localParticipant.isMicrophoneEnabled,camera:room.localParticipant.isCameraEnabled,screenShare:room.localParticipant.isScreenShareEnabled,audioBlocked:!room.canPlaybackAudio,participants:all.map(p=>({id:p.identity,name:p.name||p.identity,speaking:p.isSpeaking,microphone:p.isMicrophoneEnabled,quality:p.connectionQuality}))})}
 join(id:string,name:string){
  if(this.snapshot.roomId===id&&['connecting','connected','reconnecting'].includes(this.snapshot.state))return this.queue
  this.request?.abort()
  const generation=++this.generation
  this.emit({roomId:id,roomName:name,state:'connecting',error:null,microphone:false,participants:[]})
  // A single queue serializes disconnect/connect, including pending SDK handshakes.
  this.queue=this.queue.catch(()=>{}).then(async()=>{
   if(this.room){const old=this.room;this.room=null;old.removeAllListeners();await old.disconnect(true)}
   if(generation!==this.generation)return
   let room:Room|null=null
   let stage:'token'|'connection'|'media'='token'
   let terminalDisconnect=false
   try{
    this.request=new AbortController()
    const credentials=await this.token(id,this.request.signal)
    if(generation!==this.generation)return
    stage='connection';room=this.create();this.room=room
    const refresh=()=>{if(this.room===room&&generation===this.generation)this.members(room!)}
    room.on(RoomEvent.ConnectionStateChanged,state=>{if(this.room===room&&generation===this.generation)this.emit({state:state===ConnectionState.Connected?'connected':state===ConnectionState.Reconnecting||state===ConnectionState.SignalReconnecting?'reconnecting':'connecting'})})
    for(const event of [RoomEvent.ParticipantConnected,RoomEvent.ParticipantDisconnected,RoomEvent.ActiveSpeakersChanged,RoomEvent.TrackMuted,RoomEvent.TrackUnmuted,RoomEvent.LocalTrackPublished,RoomEvent.LocalTrackUnpublished,RoomEvent.ConnectionQualityChanged,RoomEvent.AudioPlaybackStatusChanged])room.on(event,refresh)
    room.on(RoomEvent.SignalConnected,()=>{if(this.room===room&&generation===this.generation)stage='media'})
    room.on(RoomEvent.Disconnected,reason=>{if(this.room===room&&generation===this.generation){terminalDisconnect=true;room!.removeAllListeners();this.room=null;this.emit({...initialVoice,state:'error',error:voiceDisconnectMessage(reason)})}})
    // Room.connect subscribes only; no capture/publish calls on entry.
    await room.connect(credentials.serverUrl,credentials.token,{autoSubscribe:true})
    if(this.preferredOutput)await room.switchActiveDevice('audiooutput',this.preferredOutput).catch(()=>false)
    if(terminalDisconnect||this.room!==room||generation!==this.generation){room.removeAllListeners();await room.disconnect(true);if(this.room===room)this.room=null;return}
    this.emit({state:'connected'});this.members(room)
   }catch(error){if(room){room.removeAllListeners();await room.disconnect(true);if(this.room===room)this.room=null}if(!terminalDisconnect&&generation===this.generation)this.emit({...initialVoice,state:'error',error:voiceEntryMessage(error,stage)})}
  });return this.queue
 }
 leave(){this.request?.abort();++this.generation;const room=this.room;this.room=null;room?.removeAllListeners();this.emit({...initialVoice});this.queue=this.queue.catch(()=>{}).then(async()=>{await room?.disconnect(true)});return this.queue}
 setMicrophone(enabled:boolean){const room=this.room,generation=this.generation;if(!room||this.snapshot.state!=='connected')return Promise.resolve();this.emit({microphoneBusy:true,error:null});this.micQueue=this.micQueue.catch(()=>{}).then(async()=>{if(this.room!==room||generation!==this.generation)return;try{await room.localParticipant.setMicrophoneEnabled(enabled,this.preferredInput?{deviceId:this.preferredInput}:undefined);if(this.room!==room||generation!==this.generation){await room.localParticipant.setMicrophoneEnabled(false);return}this.members(room)}catch{if(this.room===room)this.emit({error:'Microfone indisponível. Permita o acesso nas configurações do navegador e tente novamente. Você pode continuar ouvindo a sala.'})}finally{if(this.room===room)this.emit({microphoneBusy:false})}});return this.micQueue}
 toggleMicrophone(){return this.setMicrophone(!this.snapshot.microphone)}
 setCamera(enabled:boolean){return this.setMedia('camera',enabled)}
 setScreenShare(enabled:boolean){return this.setMedia('screen',enabled)}
 private setMedia(kind:'camera'|'screen',enabled:boolean){const room=this.room,generation=this.generation;if(!room||this.snapshot.state!=='connected')return Promise.resolve();this.emit({mediaBusy:true,error:null});this.mediaQueue=this.mediaQueue.catch(()=>{}).then(async()=>{if(this.room!==room||generation!==this.generation)return;try{if(kind==='camera')await room.localParticipant.setCameraEnabled(enabled,this.preferredCamera?{deviceId:this.preferredCamera}:undefined);else await room.localParticipant.setScreenShareEnabled(enabled,{audio:false});if(this.room===room)this.members(room)}catch{if(this.room===room)this.emit({error:kind==='camera'?'Câmera indisponível. Confira a permissão e se o dispositivo está conectado.':'Compartilhamento indisponível ou cancelado. Você pode continuar na chamada de voz.'})}finally{if(this.room===room)this.emit({mediaBusy:false})}});return this.mediaQueue}
 async switchDevice(kind:MediaDeviceKind,deviceId:string){if(kind==='audioinput')this.preferredInput=deviceId;if(kind==='audiooutput')this.preferredOutput=deviceId;if(kind==='videoinput')this.preferredCamera=deviceId;const room=this.room;if(!room||this.snapshot.state!=='connected')return true;if(kind==='audioinput'&&!room.localParticipant.isMicrophoneEnabled)return true;if(kind==='videoinput'&&!room.localParticipant.isCameraEnabled)return true;try{return await room.switchActiveDevice(kind,deviceId)}catch{return false}}
 setOutputVolume(volume:number){this.volume=Math.max(0,Math.min(1,volume));if(this.room)this.members(this.room)}
 async startAudio(){try{await this.room?.startAudio();if(this.room)this.members(this.room)}catch{this.emit({audioBlocked:true,error:'Clique em Ativar áudio para permitir a reprodução no navegador.'})}}
}
