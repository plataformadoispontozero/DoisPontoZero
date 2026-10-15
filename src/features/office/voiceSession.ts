import {Room,RoomEvent,ConnectionState,type Participant} from 'livekit-client'
import {voiceEntryMessage} from './voiceErrors'
import {initialVoice,type VoiceSnapshot,type VoiceToken} from './voiceState'
export {initialVoice} from './voiceState'
export type {VoiceSnapshot,VoiceToken} from './voiceState'
export class OfficeVoiceSession {
 room:Room|null=null
 private generation=0
 private request:AbortController|null=null
 private queue:Promise<void>=Promise.resolve()
 private micQueue:Promise<void>=Promise.resolve()
 private snapshot:VoiceSnapshot={...initialVoice}
 constructor(private token:(id:string,signal:AbortSignal)=>Promise<VoiceToken>,private changed:(state:VoiceSnapshot,room:Room|null)=>void,private create:()=>Room=()=>new Room({adaptiveStream:true,dynacast:true})){this.changed(this.snapshot,null)}
 private emit(next:Partial<VoiceSnapshot>){this.snapshot={...this.snapshot,...next};this.changed(this.snapshot,this.room)}
 private members(room:Room){const all:Participant[]=[room.localParticipant,...room.remoteParticipants.values()];this.emit({microphone:room.localParticipant.isMicrophoneEnabled,audioBlocked:!room.canPlaybackAudio,participants:all.map(p=>({id:p.identity,name:p.name||p.identity,speaking:p.isSpeaking,microphone:p.isMicrophoneEnabled,quality:p.connectionQuality}))})}
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
   let stage:'token'|'connection'='token'
   try{
    this.request=new AbortController()
    const credentials=await this.token(id,this.request.signal)
    if(generation!==this.generation)return
    stage='connection';room=this.create();this.room=room
    const refresh=()=>{if(this.room===room&&generation===this.generation)this.members(room!)}
    room.on(RoomEvent.ConnectionStateChanged,state=>{if(this.room===room&&generation===this.generation)this.emit({state:state===ConnectionState.Connected?'connected':state===ConnectionState.Reconnecting||state===ConnectionState.SignalReconnecting?'reconnecting':'connecting'})})
    for(const event of [RoomEvent.ParticipantConnected,RoomEvent.ParticipantDisconnected,RoomEvent.ActiveSpeakersChanged,RoomEvent.TrackMuted,RoomEvent.TrackUnmuted,RoomEvent.LocalTrackPublished,RoomEvent.LocalTrackUnpublished,RoomEvent.ConnectionQualityChanged,RoomEvent.AudioPlaybackStatusChanged])room.on(event,refresh)
    room.on(RoomEvent.Disconnected,()=>{if(this.room===room&&generation===this.generation){this.room=null;this.emit({...initialVoice,state:'error',error:'A conexão com a sala terminou. Entre novamente para reconectar.'})}})
    // Room.connect subscribes only; no capture/publish calls on entry.
    await room.connect(credentials.serverUrl,credentials.token,{autoSubscribe:true})
    if(generation!==this.generation){room.removeAllListeners();await room.disconnect(true);if(this.room===room)this.room=null;return}
    this.emit({state:'connected'});this.members(room)
   }catch(error){if(room){room.removeAllListeners();await room.disconnect(true);if(this.room===room)this.room=null}if(generation===this.generation)this.emit({...initialVoice,state:'error',error:voiceEntryMessage(error,stage)})}
  });return this.queue
 }
 leave(){this.request?.abort();++this.generation;const room=this.room;this.room=null;room?.removeAllListeners();this.emit({...initialVoice});this.queue=this.queue.catch(()=>{}).then(async()=>{await room?.disconnect(true)});return this.queue}
 setMicrophone(enabled:boolean){const room=this.room,generation=this.generation;if(!room||this.snapshot.state!=='connected')return Promise.resolve();this.emit({microphoneBusy:true,error:null});this.micQueue=this.micQueue.catch(()=>{}).then(async()=>{if(this.room!==room||generation!==this.generation)return;try{await room.localParticipant.setMicrophoneEnabled(enabled);if(this.room!==room||generation!==this.generation){await room.localParticipant.setMicrophoneEnabled(false);return}this.members(room)}catch{if(this.room===room)this.emit({error:'Microfone indisponível. Permita o acesso nas configurações do navegador e tente novamente. Você pode continuar ouvindo a sala.'})}finally{if(this.room===room)this.emit({microphoneBusy:false})}});return this.micQueue}
 async startAudio(){try{await this.room?.startAudio();if(this.room)this.members(this.room)}catch{this.emit({audioBlocked:true,error:'Clique em Ativar áudio para permitir a reprodução no navegador.'})}}
}
