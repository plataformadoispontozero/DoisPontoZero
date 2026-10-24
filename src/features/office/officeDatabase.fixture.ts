import {PGlite} from '@electric-sql/pglite'
import migration from '../../../supabase/migrations/20261014184243_office_phase02_tenant_data.sql?raw'
export const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
export const owner='11111111-1111-4111-8111-111111111111',member='22222222-2222-4222-8222-222222222222',outside='33333333-3333-4333-8333-333333333333',other='44444444-4444-4444-8444-444444444444'
export const room='55555555-5555-4555-8555-555555555555',restricted='66666666-6666-4666-8666-666666666666',squadRoom='77777777-7777-4777-8777-777777777777',otherRoom='88888888-8888-4888-8888-888888888888',squad='99999999-9999-4999-8999-999999999999'
export async function setupOfficeDatabase(){const db=new PGlite();await db.exec(`
create schema auth;create schema private;create schema realtime;create role anon;create role authenticated;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table agencies(id uuid primary key,status text default 'active');create table profiles(id uuid primary key,full_name text);create table roles(id uuid primary key,agency_id uuid,name text);
create table agency_members(agency_id uuid,user_id uuid,role_id uuid,status text);
create table squads(id uuid primary key,agency_id uuid);create table squad_members(squad_id uuid,user_id uuid);
create table chat_channels(id uuid primary key,agency_id uuid,name text,description text,channel_type text,visibility text,squad_id uuid,archived_at timestamptz);
create table chat_channel_members(channel_id uuid,agency_id uuid,user_id uuid,left_at timestamptz);
create table chat_preferences(agency_id uuid,user_id uuid,direct_notifications boolean default true,mention_notifications boolean default true,primary key(agency_id,user_id));
create function private.can_editorial(a uuid,p text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.agency_members m where m.agency_id=a and m.user_id=auth.uid() and m.status='active') and coalesce(current_setting('test.permission',true),'yes')<>'no'$$;
create function private.operational_notification_access(a uuid,u uuid,p text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.agency_members m join public.agencies ag on ag.id=m.agency_id where m.agency_id=a and m.user_id=u and m.status='active' and ag.status='active')$$;
create function private.chat_target(a uuid,c uuid,d uuid) returns boolean language sql stable security definer set search_path='' as $$select private.can_editorial(a,'chat.access') and exists(select 1 from public.chat_channels x where x.id=c and x.agency_id=a and x.archived_at is null and (x.visibility='agency' or exists(select 1 from public.chat_channel_members m where m.channel_id=x.id and m.agency_id=a and m.user_id=auth.uid() and m.left_at is null)))$$;
alter table chat_channels enable row level security;create policy chat_read on chat_channels for select to authenticated using(private.chat_target(agency_id,id,null));
alter table chat_preferences enable row level security;create policy pref_own on chat_preferences for all to authenticated using(user_id=auth.uid() and private.can_editorial(agency_id,'chat.access')) with check(user_id=auth.uid() and private.can_editorial(agency_id,'chat.access'));
grant usage on schema private,realtime to authenticated;grant select on chat_channels to authenticated;grant select,insert,update on chat_preferences to authenticated;
create table realtime.messages(topic text,extension text);alter table realtime.messages enable row level security;grant select,insert on realtime.messages to authenticated;
create table notifications(id uuid primary key default gen_random_uuid(),agency_id uuid not null,recipient_id uuid not null,type text not null,title text not null,body text not null,resource_type text,resource_id uuid,created_at timestamptz not null default now(),read_at timestamptz);
create function realtime.topic() returns text language sql as $$select current_setting('test.topic',true)$$;
insert into agencies(id) values('${a}'),('${b}');insert into profiles(id,full_name) values('${owner}','Owner'),('${member}','Member'),('${outside}','Outside'),('${other}','Other');
insert into roles values('${a}','${a}','OWNER'),('${b}','${b}','MEMBER');
insert into agency_members values('${a}','${owner}','${a}','active'),('${a}','${member}','${b}','active'),('${a}','${outside}','${b}','active'),('${b}','${other}','${b}','active');
insert into squads values('${squad}','${a}');insert into squad_members values('${squad}','${member}');
insert into chat_channels values('${room}','${a}','General','','general','agency',null,null),('${restricted}','${a}','Private','','custom','private',null,null),('${squadRoom}','${a}','Squad','','squad','agency','${squad}',null),('${otherRoom}','${b}','Other','','general','agency',null,null);
insert into chat_channel_members values('${restricted}','${a}','${member}',null);
`);await db.exec(migration);await db.exec(`update chat_channels set office_enabled=true;set role authenticated;select set_config('test.uid','${member}',false)`);return db}
