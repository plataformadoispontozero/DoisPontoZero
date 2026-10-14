// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import {expect,it} from 'vitest'
import migration from '../../../supabase/migrations/20261014184243_office_phase02_tenant_data.sql?raw'
const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const owner='11111111-1111-4111-8111-111111111111',member='22222222-2222-4222-8222-222222222222',outside='33333333-3333-4333-8333-333333333333',other='44444444-4444-4444-8444-444444444444'
const room='55555555-5555-4555-8555-555555555555',restricted='66666666-6666-4666-8666-666666666666',squadRoom='77777777-7777-4777-8777-777777777777',otherRoom='88888888-8888-4888-8888-888888888888',squad='99999999-9999-4999-8999-999999999999'
async function setup(){const db=new PGlite();await db.exec(`
create schema auth;create schema private;create schema realtime;create role anon;create role authenticated;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table agencies(id uuid primary key);create table profiles(id uuid primary key);create table roles(id uuid primary key,agency_id uuid,name text);
create table agency_members(agency_id uuid,user_id uuid,role_id uuid,status text);
create table squads(id uuid primary key,agency_id uuid);create table squad_members(squad_id uuid,user_id uuid);
create table chat_channels(id uuid primary key,agency_id uuid,name text,description text,channel_type text,visibility text,squad_id uuid,archived_at timestamptz);
create table chat_channel_members(channel_id uuid,agency_id uuid,user_id uuid,left_at timestamptz);
create table chat_preferences(agency_id uuid,user_id uuid,direct_notifications boolean default true,mention_notifications boolean default true,primary key(agency_id,user_id));
create function private.can_editorial(a uuid,p text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.agency_members m where m.agency_id=a and m.user_id=auth.uid() and m.status='active') and coalesce(current_setting('test.permission',true),'yes')<>'no'$$;
create function private.chat_target(a uuid,c uuid,d uuid) returns boolean language sql stable security definer set search_path='' as $$select private.can_editorial(a,'chat.access') and exists(select 1 from public.chat_channels x where x.id=c and x.agency_id=a and x.archived_at is null and (x.visibility='agency' or exists(select 1 from public.chat_channel_members m where m.channel_id=x.id and m.agency_id=a and m.user_id=auth.uid() and m.left_at is null)))$$;
alter table chat_channels enable row level security;create policy chat_read on chat_channels for select to authenticated using(private.chat_target(agency_id,id,null));
alter table chat_preferences enable row level security;create policy pref_own on chat_preferences for all to authenticated using(user_id=auth.uid() and private.can_editorial(agency_id,'chat.access')) with check(user_id=auth.uid() and private.can_editorial(agency_id,'chat.access'));
grant usage on schema private,realtime to authenticated;grant select on chat_channels to authenticated;grant select,insert,update on chat_preferences to authenticated;
create table realtime.messages(topic text,extension text);alter table realtime.messages enable row level security;grant select,insert on realtime.messages to authenticated;
create function realtime.topic() returns text language sql as $$select current_setting('test.topic',true)$$;
insert into agencies values('${a}'),('${b}');insert into profiles values('${owner}'),('${member}'),('${outside}'),('${other}');
insert into roles values('${a}','${a}','OWNER'),('${b}','${b}','MEMBER');
insert into agency_members values('${a}','${owner}','${a}','active'),('${a}','${member}','${b}','active'),('${a}','${outside}','${b}','active'),('${b}','${other}','${b}','active');
insert into squads values('${squad}','${a}');insert into squad_members values('${squad}','${member}');
insert into chat_channels values('${room}','${a}','General','','general','agency',null,null),('${restricted}','${a}','Private','','custom','private',null,null),('${squadRoom}','${a}','Squad','','squad','agency','${squad}',null),('${otherRoom}','${b}','Other','','general','agency',null,null);
insert into chat_channel_members values('${restricted}','${a}','${member}',null);
`);await db.exec(migration);await db.exec(`update chat_channels set office_enabled=true;set role authenticated;select set_config('test.uid','${member}',false)`);return db}
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
