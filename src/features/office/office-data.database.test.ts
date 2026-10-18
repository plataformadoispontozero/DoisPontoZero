// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import {expect,it} from 'vitest'
import {setupOfficeDatabase as setup,a,b,owner,member,outside,other,room,restricted,squadRoom,otherRoom} from './officeDatabase.fixture'
async function access(db:PGlite,agency:string,id:string){return (await db.query<{allowed:boolean}>('select private.office_room_access($1,$2) allowed',[agency,id])).rows[0].allowed}
it('isolates two agencies and restricted rooms and squads, including revoked access',async()=>{const db=await setup();try{
 expect(await access(db,a,room)).toBe(true);expect(await access(db,b,otherRoom)).toBe(false);expect(await access(db,a,restricted)).toBe(true);expect(await access(db,a,squadRoom)).toBe(true);
 await db.exec(`select set_config('test.uid','${outside}',false)`);expect(await access(db,a,restricted)).toBe(false);expect(await access(db,a,squadRoom)).toBe(false);
 await db.exec(`select set_config('test.uid','${other}',false)`);expect(await access(db,b,otherRoom)).toBe(true);expect(await access(db,a,room)).toBe(false);
 await db.exec("select set_config('test.permission','no',false)");expect(await access(db,b,otherRoom)).toBe(false);
 }finally{await db.close()}})
it('requires management role as well as permission to enable rooms and denies anonymous RPC',async()=>{const db=await setup();try{
 await expect(db.query('select office_configure_room($1,$2,true)',[a,room])).rejects.toThrow(/Sem permissão/);
 await db.exec(`select set_config('test.uid','${owner}',false)`);await db.query('select office_configure_room($1,$2,false)',[a,room]);expect(await access(db,a,room)).toBe(false);
 await expect(db.query('select office_configure_room($1,$2,true)',[b,otherRoom])).rejects.toThrow(/Sem permissão/);
 expect((await db.query("select has_function_privilege('anon','public.office_configure_room(uuid,uuid,boolean)','EXECUTE') allowed")).rows[0]).toEqual({allowed:false});
 await expect(db.query('update chat_channels set office_enabled=true')).rejects.toThrow(/permission denied/);
 }finally{await db.close()}})
it('persists only own preferences, rejects cross-tenant/private preferred rooms and oversized device IDs',async()=>{const db=await setup();try{
 await db.query('insert into chat_preferences(agency_id,user_id,office_preferred_room) values($1,$2,$3)',[a,member,squadRoom]);
 expect((await db.query('select office_auto_join,direct_notifications from chat_preferences')).rows[0]).toEqual({office_auto_join:false,direct_notifications:true});
 await expect(db.query('update chat_preferences set office_preferred_room=$1',[otherRoom])).rejects.toThrow(/Sala preferida/);
 await expect(db.query('insert into chat_preferences(agency_id,user_id) values($1,$2)',[a,owner])).rejects.toThrow(/row-level security/);
 await expect(db.query('update chat_preferences set office_microphone_id=$1',['x'.repeat(257)])).rejects.toThrow(/check constraint/);
 await db.exec(`select set_config('test.uid','${outside}',false)`);expect((await db.query('select * from chat_preferences')).rows).toHaveLength(0);
 }finally{await db.close()}})
it('disabled or archived office rooms disappear without hiding existing chat and preferences remain editable',async()=>{const db=await setup();try{
 await db.query('insert into chat_preferences(agency_id,user_id,office_preferred_room) values($1,$2,$3)',[a,member,room]);
 await db.exec(`reset role;update chat_channels set office_enabled=false where id='${room}';update chat_channels set archived_at=now() where id='${squadRoom}';set role authenticated`);
 expect(await access(db,a,room)).toBe(false);expect(await access(db,a,squadRoom)).toBe(false);
 expect((await db.query('select * from chat_channels where id=$1',[room])).rows).toHaveLength(1);
 await db.query('update chat_preferences set direct_notifications=false');
 const rooms=(await db.query<{rooms:{id:string}[]}>('select office_directory($1) rooms',[a])).rows[0].rooms;expect(rooms.map(x=>x.id)).toEqual([restricted]);
 }finally{await db.close()}})
it('authorizes only private office topic namespace and fails closed for forged or malformed topics',async()=>{const db=await setup();try{
 for(const topic of [`office:${b}:${otherRoom}`,`office:${a}:${otherRoom}`,'office:bad:bad','chat:anything',`office:${a}:${room}:extra`]){expect((await db.query<{allowed:boolean}>('select private.office_topic_access($1) allowed',[topic])).rows[0].allowed).toBe(false)}
 await db.query("select set_config('test.topic',$1,false)",[`office:${a}:${squadRoom}`]);await db.query("insert into realtime.messages values($1,'presence')",[`office:${a}:${squadRoom}`]);expect((await db.query('select * from realtime.messages')).rows).toHaveLength(1);
 await db.exec(`select set_config('test.uid','${outside}',false)`);expect((await db.query('select * from realtime.messages')).rows).toHaveLength(0);await expect(db.query("insert into realtime.messages values('test','broadcast')")).rejects.toThrow(/row-level security/);
 }finally{await db.close()}})
