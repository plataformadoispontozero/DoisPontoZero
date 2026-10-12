// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {describe,it,expect} from 'vitest';
import migration from '../../../supabase/migrations/20261012134754_google_agency_connection.sql?raw';
const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',owner='11111111-1111-4111-8111-111111111111',designer='22222222-2222-4222-8222-222222222222',other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
async function database(){const db=new PGlite();await db.exec(`create schema auth;create schema private;create role anon;create role authenticated;create role service_role;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table auth.users(id uuid primary key);create table public.agencies(id uuid primary key,status text);
create table public.roles(id uuid primary key,agency_id uuid,name text);create table public.agency_members(agency_id uuid,user_id uuid,status text,role_id uuid);
create table public.permissions(id uuid primary key,permission_key text);create table public.role_permissions(role_id uuid,permission_id uuid,allowed boolean);
create table private.google_workspace_secrets(agency_id uuid,user_id uuid,ciphertext text,updated_at timestamptz default now(),primary key(agency_id,user_id));
create table private.google_workspace_states(hash text primary key,agency_id uuid,user_id uuid,ciphertext text,expires_at timestamptz default now()+interval '10 minutes');
insert into auth.users values('${owner}'),('${designer}');insert into agencies values('${agency}','active'),('${other}','active');
insert into roles values('${owner}','${agency}','OWNER'),('${designer}','${agency}','DESIGNER');
insert into agency_members values('${agency}','${owner}','active','${owner}'),('${agency}','${designer}','active','${designer}');
insert into private.google_workspace_secrets(agency_id,user_id,ciphertext) values('${agency}','${owner}','encrypted-test'),('${agency}','${designer}','encrypted-other');`);await db.exec(migration);return db;}
describe('Central agency Google credential boundary',()=>{
 it('only an active administrator can set the central connection; tenant and revoked membership stay isolated',async()=>{const db=await database();try{
  await expect(db.query('select public.google_workspace_connection($1,$2,$3)',['set',agency,designer])).rejects.toThrow('Administrator required');
  await expect(db.query('select public.google_workspace_connection($1,$2,$3)',['set',other,owner])).rejects.toThrow('Administrator required');
  await db.query('select public.google_workspace_connection($1,$2,$3)',['set',agency,owner]);
  expect((await db.query<{data:{user:string|null}}>('select public.google_workspace_connection($1,$2) data',['read',agency])).rows[0].data.user).toBe(owner);
  expect((await db.query<{data:{user:string|null}}>('select public.google_workspace_connection($1,$2) data',['read',other])).rows[0].data.user).toBeNull();
  await db.exec(`update agency_members set status='inactive' where user_id='${owner}'`);
  expect((await db.query<{data:{user:string|null}}>('select public.google_workspace_connection($1,$2) data',['read',agency])).rows[0].data.user).toBeNull();
 }finally{await db.close();}});
 it('authenticated members cannot resolve private connector IDs or read the connection table',async()=>{const db=await database();try{
  await db.exec('grant usage on schema private to authenticated;set role authenticated');
  await expect(db.query('select public.google_workspace_connection($1,$2)',['read',agency])).rejects.toThrow(/permission denied/);
  await expect(db.exec('select * from private.google_agency_connections')).rejects.toThrow(/permission denied/);
 }finally{await db.close();}});
 it('OAuth callback rejects a production member, and admin OAuth state can be consumed only once',async()=>{const db=await database();try{
  await db.query('select public.google_workspace_secret($1,$2,$3,$4,$5)',['state',agency,designer,'designer-state','encrypted']);
  await expect(db.query('select public.google_workspace_secret($1,null,null,$2)',['consume','designer-state'])).rejects.toThrow('Permissão revogada');
  await db.query('select public.google_workspace_secret($1,$2,$3,$4,$5)',['state',agency,owner,'owner-state','encrypted']);
  expect((await db.query<{data:{user:string}}>('select public.google_workspace_secret($1,null,null,$2) data',['consume','owner-state'])).rows[0].data.user).toBe(owner);
  await expect(db.query('select public.google_workspace_secret($1,null,null,$2)',['consume','owner-state'])).rejects.toThrow('Estado inválido ou expirado');
 }finally{await db.close();}});
});

describe('Atomic Google agency connection publication',()=>{
 it('rejects a nonadministrator without replacing any stored credential or publishing a connector',async()=>{const db=await database();try{
  await expect(db.query('select public.google_workspace_connect($1,$2,$3)',[agency,designer,'new-token'])).rejects.toThrow('Administrator required');
  expect((await db.query<{ciphertext:string}>('select ciphertext from private.google_workspace_secrets where agency_id=$1 and user_id=$2',[agency,designer])).rows[0].ciphertext).toBe('encrypted-other');
  expect((await db.query('select * from private.google_agency_connections')).rows).toHaveLength(0);
  await db.query('select public.google_workspace_connect($1,$2,$3)',[agency,owner,'new-encrypted-token']);
  expect((await db.query<{ciphertext:string}>('select ciphertext from private.google_workspace_secrets where agency_id=$1 and user_id=$2',[agency,owner])).rows[0].ciphertext).toBe('new-encrypted-token');
  expect((await db.query<{connector_user_id:string}>('select connector_user_id from private.google_agency_connections')).rows[0].connector_user_id).toBe(owner);
 }finally{await db.close();}});
});
