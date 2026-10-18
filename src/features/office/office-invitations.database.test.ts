import {it,expect} from 'vitest'
import {PGlite} from '@electric-sql/pglite'
import officeData from '../../../supabase/migrations/20261014184243_office_phase02_tenant_data.sql?raw'
import voiceTokens from '../../../supabase/migrations/20261014195239_office_phase04_voice_token.sql?raw'
import invitations from '../../../supabase/migrations/20261018230000_office_phase07_voice_invitations.sql?raw'

const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',otherAgency='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const owner='11111111-1111-4111-8111-111111111111',member='22222222-2222-4222-8222-222222222222'
const outside='33333333-3333-4333-8333-333333333333',foreign='44444444-4444-4444-8444-444444444444'

async function setup(){
 const db=new PGlite()
 await db.exec(`create schema auth;create schema private;create schema realtime;create role anon;create role authenticated;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create table agencies(id uuid primary key,status text default 'active');create table profiles(id uuid primary key,full_name text);
 create table roles(id uuid primary key,agency_id uuid,name text);create table agency_members(agency_id uuid,user_id uuid,role_id uuid,status text);
 create table squads(id uuid primary key,agency_id uuid);create table squad_members(squad_id uuid,user_id uuid);
 create table chat_channels(id uuid primary key,agency_id uuid,name text,description text,channel_type text,visibility text,squad_id uuid,archived_at timestamptz);
 create table chat_channel_members(channel_id uuid,agency_id uuid,user_id uuid,left_at timestamptz);
 create table chat_preferences(agency_id uuid,user_id uuid,direct_notifications boolean default true,mention_notifications boolean default true,primary key(agency_id,user_id));
 create table notifications(id uuid primary key default gen_random_uuid(),agency_id uuid not null,recipient_id uuid not null,type text not null,title text not null,body text not null,resource_type text,resource_id uuid,created_at timestamptz not null default now(),read_at timestamptz);
 create function private.can_editorial(a uuid,p text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.agency_members m where m.agency_id=a and m.user_id=auth.uid() and m.status='active') and coalesce(current_setting('test.permission',true),'yes')<>'no'$$;
 create function private.operational_notification_access(a uuid,u uuid,p text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.agency_members m join public.agencies ag on ag.id=m.agency_id where m.agency_id=a and m.user_id=u and m.status='active' and ag.status='active')$$;
 create function private.chat_target(a uuid,c uuid,d uuid) returns boolean language sql stable security definer set search_path='' as $$select private.can_editorial(a,'chat.access') and exists(select 1 from public.chat_channels x where x.id=c and x.agency_id=a and x.archived_at is null and (x.visibility='agency' or exists(select 1 from public.chat_channel_members m where m.channel_id=x.id and m.agency_id=a and m.user_id=auth.uid() and m.left_at is null)))$$;
 alter table chat_channels enable row level security;create policy chat_read on chat_channels for select to authenticated using(private.chat_target(agency_id,id,null));
 alter table chat_preferences enable row level security;create policy pref_own on chat_preferences for all to authenticated using(user_id=auth.uid() and private.can_editorial(agency_id,'chat.access')) with check(user_id=auth.uid() and private.can_editorial(agency_id,'chat.access'));
 grant usage on schema private,realtime to authenticated;grant select on chat_channels to authenticated;grant select,insert,update on chat_preferences to authenticated;
 create table realtime.messages(topic text,extension text);alter table realtime.messages enable row level security;grant select,insert on realtime.messages to authenticated;create function realtime.topic() returns text language sql as $$select current_setting('test.topic',true)$$;
 insert into agencies(id) values('${agency}'),('${otherAgency}');
 insert into profiles values('${owner}','Owner'),('${member}','Member'),('${outside}','Outside'),('${foreign}','Foreign');
 insert into roles values('${agency}','${agency}','OWNER'),('${otherAgency}','${otherAgency}','MEMBER');
 insert into agency_members values('${agency}','${owner}','${agency}','active'),('${agency}','${member}','${agency}','active'),('${agency}','${outside}','${agency}','active'),('${otherAgency}','${foreign}','${otherAgency}','active');
 insert into chat_channels values('55555555-5555-4555-8555-555555555555','${agency}','General','','general','agency',null,null);`)
 await db.exec(officeData);await db.exec(voiceTokens);await db.exec(invitations)
 await asUser(db,owner)
 return db
}
async function asUser(db:PGlite,user:string){await db.exec(`reset role;select set_config('test.uid','${user}',false);set role authenticated`)}
async function send(db:PGlite,target=member){return (await db.query<{data:{id:string;status:string}}>('select office_voice_invite_send($1,$2) data',[agency,target])).rows[0].data}

it('accepts only the invited tenant member and authorizes the temporary LiveKit room only for participants',async()=>{
 const db=await setup();try{
  const invite=await send(db);expect(invite.status).toBe('pending')
  await expect(db.query('select office_voice_context($1,false)',[invite.id])).rejects.toThrow(/Sala indisponível/)
  await asUser(db,member);expect((await db.query<{data:unknown[]}>('select office_voice_invite_directory($1) data',[agency])).rows[0].data).toMatchObject([{id:invite.id,direction:'incoming',counterpart_id:owner,counterpart_name:'Owner'}])
  await db.query("select office_voice_invite_respond($1,'accept')",[invite.id])
  const context=(await db.query<{data:{room_name:string;room_type:string;user_id:string}}>('select office_voice_context($1,false) data',[invite.id])).rows[0].data
  expect(context).toEqual({agency_id:agency,user_id:member,room_id:invite.id,room_type:'private_call',room_name:`office_call_${agency}_${invite.id}`})
  await asUser(db,foreign);await expect(db.query('select office_voice_context($1,false)',[invite.id])).rejects.toThrow(/Sala indisponível/)
  await asUser(db,owner);expect((await db.query<{data:{room_type:string;room_name:string}}>('select office_voice_context($1,false) data',[invite.id])).rows[0].data).toMatchObject({room_type:'private_call',room_name:`office_call_${agency}_${invite.id}`})
  await db.query("select office_voice_invite_respond($1,'end')",[invite.id]);await expect(db.query('select office_voice_context($1,false)',[invite.id])).rejects.toThrow(/Sala indisponível/)
 }finally{await db.close()}
})

it('declines, cancels and expires race-safely with idempotent responses and missed notifications',async()=>{
 const db=await setup();try{
  const declined=await send(db);await asUser(db,member)
  await db.query("select office_voice_invite_respond($1,'decline')",[declined.id]);await db.query("select office_voice_invite_respond($1,'decline')",[declined.id])
  await asUser(db,owner);const cancelled=await send(db,outside);await db.query("select office_voice_invite_respond($1,'cancel')",[cancelled.id]);await db.query("select office_voice_invite_respond($1,'cancel')",[cancelled.id])
  const expired=await send(db);await db.exec(`reset role;update office_voice_invitations set expires_at=now()-interval '1 second' where id='${expired.id}';set role authenticated`)
  await asUser(db,member);expect((await db.query<{data:unknown[]}>('select office_voice_invite_directory($1) data',[agency])).rows[0].data).toEqual([])
  await db.exec('reset role');expect((await db.query('select title,read_at from notifications where resource_id=$1',[expired.id])).rows[0]).toMatchObject({title:'Chamada perdida'})
  expect((await db.query<{status:string}>('select status from office_voice_invitations where id=$1',[expired.id])).rows[0].status).toBe('expired')
 }finally{await db.close()}
})

it('rejects cross-tenant, duplicate-busy and do-not-disturb invitations; limits spam',async()=>{
 const db=await setup();try{
  await expect(send(db,foreign)).rejects.toThrow(/Membro indisponível/)
  const pending=await send(db);await asUser(db,outside);await expect(send(db)).rejects.toThrow(/OFFICE_PARTICIPANT_BUSY/)
  await asUser(db,member);await db.query('select office_voice_set_do_not_disturb($1,true)',[agency]);
  await asUser(db,owner);await db.query("select office_voice_invite_respond($1,'cancel')",[pending.id]);await expect(send(db,member)).rejects.toThrow(/OFFICE_RECIPIENT_BUSY/)
  await asUser(db,member);await db.query('select office_voice_set_do_not_disturb($1,false)',[agency]);await asUser(db,owner)
  const sent=await send(db,outside);await db.query("select office_voice_invite_respond($1,'cancel')",[sent.id])
  for(let i=1;i<4;i++){const item=await send(db,i%2?member:outside);await db.query("select office_voice_invite_respond($1,'cancel')",[item.id])}
  await expect(send(db,member)).rejects.toThrow(/OFFICE_INVITATION_RATE_LIMIT/)
 }finally{await db.close()}
})

it('keeps invitation rows private to caller and recipient and denies anonymous access',async()=>{
 const db=await setup();try{
  const invite=await send(db);await db.exec('reset role');await db.query('set role anon');await expect(db.query('select id from office_voice_invitations')).rejects.toThrow(/permission denied/)
  await asUser(db,outside);expect((await db.query('select id from office_voice_invitations')).rows).toEqual([])
  await db.exec('reset role');expect((await db.query<{allowed:boolean}>("select has_function_privilege('anon','public.office_voice_invite_send(uuid,uuid)','EXECUTE') allowed")).rows[0].allowed).toBe(false)
  await asUser(db,member);expect((await db.query('select id from office_voice_invitations')).rows).toEqual([{id:invite.id}])
 }finally{await db.close()}
})
