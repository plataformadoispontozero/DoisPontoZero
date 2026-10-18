import {expect,it,vi} from 'vitest'
import {OfficePresenceSession,aggregatePerson,type OfficeMember,type PresenceChannel,type PresencePayload,type PresenceSnapshot,type PresenceTransport} from './presenceSession'
const members:OfficeMember[]=[{user_id:'one',name:'Alice',avatar_url:null},{user_id:'two',name:'Bruno',avatar_url:null}]
class Channel implements PresenceChannel{
 sync:()=>void=()=>{};status:(s:string)=>void=()=>{};state:Record<string,unknown[]>={};payload:PresencePayload|null=null
 track=vi.fn(async(p:PresencePayload)=>{this.payload=p;this.state={tab:[p]};this.sync();return 'ok'})
 untrack=vi.fn(async()=>{});teardown=vi.fn()
 on(_e:string,_f:{event:string},fn:()=>void){this.sync=fn;return this}
 subscribe(fn:(s:string)=>void){this.status=fn;return this}
 presenceState(){return this.state}
}
function fixture(){const channels=new Map<string,Channel>();const factory=vi.fn((topic:string,_options:{config:{private:true;presence:{key:string}}})=>{const c=new Channel();channels.set(topic,c);return c});const client:PresenceTransport={channel:factory,removeChannel:vi.fn(async()=>{})};let snapshot:PresenceSnapshot={connection:'connecting',people:[]};const session=new OfficePresenceSession(client,'tenant','one',members,s=>snapshot=s);session.start();return{session,channels,factory,client,get snapshot(){return snapshot}}}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0))
it('uses private tenant topics and tracks only own identity, never observer presence',async()=>{const f=fixture();for(const c of f.channels.values())c.status('SUBSCRIBED');await tick();expect(f.factory.mock.calls[0][0]).toBe('office-user:tenant:one');expect(f.factory.mock.calls[0][1]).toMatchObject({config:{private:true}});expect(f.channels.get('office-user:tenant:one')!.track).toHaveBeenCalledOnce();expect(f.channels.get('office-user:tenant:two')!.track).not.toHaveBeenCalled();expect(f.snapshot.connection).toBe('connected');await f.session.stop()})
it('deduplicates tabs and ignores forged identity/name from payload',()=>{const p=aggregatePerson(members[0],{a:[{status:'away',user_id:'two',name:'Forged',updated_at:10}],b:[{status:'in_room',room_id:'room',updated_at:5}]});expect(p).toMatchObject({user_id:'one',name:'Alice',connections:2,status:'in_room',room_id:'room'});expect(aggregatePerson(members[0],{}).status).toBe('offline')})
it('syncs joins/leaves, clears stale peers on disconnect and re-tracks after reconnect',async()=>{const f=fixture();const own=f.channels.get('office-user:tenant:one')!,other=f.channels.get('office-user:tenant:two')!;own.status('SUBSCRIBED');other.status('SUBSCRIBED');await tick();other.state={a:[{status:'available',updated_at:1}]};other.sync();expect(f.snapshot.people.filter(p=>p.status!=='offline')).toHaveLength(2);f.session.heartbeat('timeout');expect(f.snapshot.connection).toBe('reconnecting');expect(f.snapshot.people.every(p=>p.status==='offline')).toBe(true);f.session.heartbeat('ok');await tick();expect(f.snapshot.connection).toBe('connected');other.state={};other.sync();expect(f.snapshot.people.find(p=>p.user_id==='two')?.status).toBe('offline');await f.session.stop()})
it('keeps room while availability changes and route consumers do not control transport lifecycle',async()=>{const f=fixture();const own=f.channels.get('office-user:tenant:one')!;own.status('SUBSCRIBED');await tick();f.session.update('in_room','room');await tick();expect(own.payload?.room_id).toBe('room');f.session.update('busy');await tick();expect(own.payload?.status).toBe('busy');expect(f.factory).toHaveBeenCalledTimes(2);expect(own.untrack).not.toHaveBeenCalled();await f.session.stop();expect(own.untrack).toHaveBeenCalledOnce();expect(f.client.removeChannel).toHaveBeenCalledTimes(2)})
it('rejects successful-looking status when track fails and ignores callbacks after logout',async()=>{const f=fixture();const own=f.channels.get('office-user:tenant:one')!;own.track.mockResolvedValue('error');own.status('SUBSCRIBED');await tick();expect(f.snapshot.connection).toBe('error');await f.session.stop();own.status('SUBSCRIBED');own.sync();expect(f.snapshot.connection).toBe('error');expect(own.track).toHaveBeenCalledOnce();expect(own.teardown).toHaveBeenCalledOnce()})
it('waits for untrack before teardown so a new presence scope cannot deadlock',async()=>{
 const f=fixture(),own=f.channels.get('office-user:tenant:one')!;own.status('SUBSCRIBED');await tick()
 let finish!:()=>void;own.untrack.mockImplementation(()=>new Promise<void>(resolve=>{finish=resolve}))
 const stopping=f.session.stop();await tick();expect(f.client.removeChannel).not.toHaveBeenCalled()
 finish();await stopping;expect(f.client.removeChannel).toHaveBeenCalledTimes(2)
})
it('does not enqueue untrack on a channel that never subscribed',async()=>{
 const f=fixture(),own=f.channels.get('office-user:tenant:one')!;await f.session.stop();expect(own.untrack).not.toHaveBeenCalled();expect(f.client.removeChannel).toHaveBeenCalledTimes(2)
})
it('bounds an untrack acknowledgement that never arrives',async()=>{
 vi.useFakeTimers();try{const f=fixture(),own=f.channels.get('office-user:tenant:one')!;own.status('SUBSCRIBED');await Promise.resolve();own.untrack.mockImplementation(()=>new Promise(()=>{}));const stopping=f.session.stop();await vi.advanceTimersByTimeAsync(1600);await stopping;expect(f.client.removeChannel).toHaveBeenCalledTimes(2)}finally{vi.useRealTimers()}
})
