export type PresenceStatus='offline'|'available'|'away'|'in_room'|'busy'
export type ConnectionStatus='connecting'|'connected'|'reconnecting'|'offline'|'error'
export interface OfficeMember{user_id:string;name:string|null;avatar_url:string|null}
export interface OfficePerson extends OfficeMember{status:PresenceStatus;room_id:string|null;connections:number}
export interface PresencePayload{status:Exclude<PresenceStatus,'offline'>;room_id:string|null;updated_at:number}
export interface PresenceSnapshot{connection:ConnectionStatus;people:OfficePerson[]}
export interface PresenceChannel{
 on(event:string,filter:{event:string},callback:()=>void):PresenceChannel
 subscribe(callback:(status:string)=>void):PresenceChannel
 track(payload:PresencePayload):Promise<string>
 untrack():Promise<unknown>
 teardown?:()=>void
 presenceState():Record<string,unknown[]>
}
export interface PresenceTransport{
 channel(topic:string,options:{config:{private:true;presence:{key:string}}}):PresenceChannel
 removeChannel(channel:PresenceChannel):Promise<unknown>
}
/** Identity comes from a backend-authorized topic; names and avatars come from the directory.
 * Presence payload is a self-reported availability hint, never an authorization credential. */
export function aggregatePerson(member:OfficeMember,state:Record<string,unknown[]>):OfficePerson{
 const entries=Object.values(state).flat().filter((x):x is PresencePayload=>!!x&&typeof x==='object'&&['available','away','in_room','busy'].includes(String((x as PresencePayload).status)))
 const active=entries.filter(x=>x.status!=='away');const latest=[...(active.length?active:entries)].sort((x,y)=>(Number(y.updated_at)||0)-(Number(x.updated_at)||0))[0]
 return {...member,status:latest?.status||'offline',room_id:latest?.status==='in_room'&&typeof latest.room_id==='string'?latest.room_id:null,connections:entries.length}
}
export class OfficePresenceSession{
 private channels=new Map<string,PresenceChannel>()
 private states=new Map<string,Record<string,unknown[]>>()
 private ready=new Set<string>()
 private alive=false
 private ownTracked=false
 private connection:ConnectionStatus='connecting'
 private payload:PresencePayload={status:'available',room_id:null,updated_at:Date.now()}
 constructor(private client:PresenceTransport,private agency:string,private user:string,private members:OfficeMember[],private emit:(snapshot:PresenceSnapshot)=>void){}
 start(){this.alive=true;this.connection='connecting';this.publish();
  for(const member of this.members){
   const channel=this.client.channel(`office-user:${this.agency}:${member.user_id}`,{config:{private:true,presence:{key:crypto.randomUUID()}}})
   this.channels.set(member.user_id,channel)
   channel.on('presence',{event:'sync'},()=>{if(!this.alive||!this.ready.has(member.user_id))return;this.states.set(member.user_id,channel.presenceState());this.publish()})
   channel.subscribe(status=>{if(!this.alive)return
    if(status==='SUBSCRIBED'){this.ready.add(member.user_id);if(member.user_id===this.user){this.ownTracked=false;void this.send()};this.publish()}
    else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){this.ready.delete(member.user_id);this.states.delete(member.user_id);if(member.user_id===this.user){this.connection=this.ownTracked?'reconnecting':'error';this.ownTracked=false;this.states.clear()};this.publish()}
   })
  }
 }
 private async send(){const channel=this.channels.get(this.user);if(!this.alive||!channel||!this.ready.has(this.user))return
  try{const status=await channel.track({...this.payload,updated_at:Date.now()});if(!this.alive)return
   this.ownTracked=status==='ok';this.connection=this.ownTracked?'connected':'error';if(!this.ownTracked)this.states.clear();this.publish()
  }catch{if(this.alive){this.ownTracked=false;this.connection='error';this.states.clear();this.publish()}}
 }
 update(status:Exclude<PresenceStatus,'offline'>,room_id:string|null=null){this.payload={status,room_id:status==='in_room'?room_id:null,updated_at:Date.now()};void this.send()}
 disconnected(status:ConnectionStatus='reconnecting'){this.ownTracked=false;this.connection=status;this.states.clear();this.publish()}
 heartbeat(status:string){if(['timeout','error','disconnected'].includes(status))this.disconnected();else if(status==='ok'&&this.alive){for(const [id,c] of this.channels){if(this.ready.has(id))this.states.set(id,c.presenceState())};if(this.ready.has(this.user)&&!this.ownTracked)void this.send()}}
 private publish(){if(!this.alive)return;this.emit({connection:this.connection,people:this.members.map(m=>aggregatePerson(m,this.connection==='connected'&&this.ready.has(m.user_id)?this.states.get(m.user_id)||{}:{}))})}
 async stop(){if(!this.alive)return;this.alive=false;const own=this.channels.get(this.user);await Promise.allSettled([...(own?[own.untrack()]:[]),...[...this.channels.values()].map(async c=>{try{await this.client.removeChannel(c)}finally{c.teardown?.()}})]);this.channels.clear();this.ready.clear();this.states.clear()}
}
