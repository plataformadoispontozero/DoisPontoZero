// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import {describe,it,expect} from 'vitest'
import workflow from '../../../supabase/migrations/20261011173520_monthly_editorial_workflow.sql?raw'
import migration from '../../../supabase/migrations/20261013151444_permission_studio_transaction.sql?raw'
const agency='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002'
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',manager='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',target='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',foreign='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
const user='dddddddd-dddd-4ddd-8ddd-ddddddddddd1',viewer='dddddddd-dddd-4ddd-8ddd-ddddddddddd2'
const manage='cccccccc-cccc-4ccc-8ccc-ccccccccccc1',tasks='cccccccc-cccc-4ccc-8ccc-ccccccccccc2',clients='cccccccc-cccc-4ccc-8ccc-ccccccccccc3'
async function setup(){const db=new PGlite();await db.exec(`create schema private;create schema auth;create role anon;create role authenticated;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table agencies(id uuid primary key,status text);create table roles(id uuid primary key,agency_id uuid references agencies,name text);create table permissions(id uuid primary key,permission_key text);
create table role_permissions(role_id uuid references roles,permission_id uuid references permissions,allowed boolean not null,primary key(role_id,permission_id));
create table agency_members(agency_id uuid references agencies,user_id uuid,role_id uuid references roles,status text);
insert into agencies values('${agency}','active'),('${other}','active');
insert into roles values('${owner}','${agency}','OWNER'),('${manager}','${agency}','ADMIN'),('${target}','${agency}','DESIGNER'),('${foreign}','${other}','OWNER');
insert into permissions values('${manage}','permissions.manage'),('${tasks}','tasks.view'),('${clients}','clients.view');
insert into role_permissions values('${manager}','${manage}',true),('${target}','${tasks}',false),('${owner}','${tasks}',true);
insert into agency_members values('${agency}','${user}','${manager}','active'),('${agency}','${viewer}','${target}','active');
grant usage on schema public,private,auth to authenticated;select set_config('test.uid','${user}',false);`);
// The production authorizer is executed unchanged, with its real role/catalog joins.
await db.exec(workflow.slice(0,workflow.indexOf('CREATE TABLE public.monthly_editorial_campaigns')));await db.exec(migration);return db;}
const change=(role=target,permission=tasks,allowed:unknown=true)=>({role_id:role,permission_id:permission,allowed})
const save=(db:PGlite,p:unknown,a=agency)=>db.query('select public.set_agency_role_permissions($1,$2)',[a,p])
const grants=(db:PGlite)=>db.query<{role_id:string;permission_id:string;allowed:boolean}>('select * from role_permissions order by role_id,permission_id')
describe('Permission Studio with real database authorization',()=>{
 it('lets an active manager with the catalogue permission update a validated batch atomically',async()=>{const db=await setup();try{await db.exec('set role authenticated');await save(db,[change(),change(target,clients,false)]);await db.exec('reset role');expect((await grants(db)).rows).toEqual(expect.arrayContaining([change(),change(target,clients,false),change(owner,tasks,true)]));}finally{await db.close()}})
 it.each(['owner','foreignRole','foreignPermission','invalidBoolean'])('rejects %s after a valid first row without partial writes',async(kind)=>{const db=await setup();try{const before=(await grants(db)).rows;const invalid=kind==='owner'?change(owner):kind==='foreignRole'?change(foreign):kind==='foreignPermission'?change(target,'99999999-9999-4999-8999-999999999999'):change(target,clients,'true');await expect(save(db,[change(),invalid])).rejects.toThrow();expect((await grants(db)).rows).toEqual(before);}finally{await db.close()}})
 it('rejects duplicate UUID identities including different letter casing before writing',async()=>{const db=await setup();try{const before=(await grants(db)).rows;await expect(save(db,[change(),change(target.toUpperCase(),tasks.toUpperCase(),false)])).rejects.toThrow(/duplicada/);expect((await grants(db)).rows).toEqual(before);}finally{await db.close()}})
 it('denies inactive agency, suspended member, absent manage permission and a different agency using the real authorizer',async()=>{const db=await setup();try{const before=(await grants(db)).rows;await expect(save(db,[change()],other)).rejects.toThrow(/administrativa/);await db.exec("update agencies set status='inactive' where id='"+agency+"'");await expect(save(db,[change()])).rejects.toThrow(/administrativa/);await db.exec("update agencies set status='active';update agency_members set status='suspended' where user_id='"+user+"'");await expect(save(db,[change()])).rejects.toThrow(/administrativa/);await db.exec("update agency_members set status='active';update role_permissions set allowed=false where permission_id='"+manage+"'");await expect(save(db,[change()])).rejects.toThrow(/administrativa/);expect((await grants(db)).rows.filter(r=>r.permission_id!==manage)).toEqual(before.filter(r=>r.permission_id!==manage));}finally{await db.close()}})
 it('ignores forged user metadata and grants no anonymous execution',async()=>{const db=await setup();try{await db.exec(`select set_config('test.uid','${viewer}',false);select set_config('request.jwt.claims','{"user_metadata":{"role":"OWNER"}}',false)`);await expect(save(db,[change()])).rejects.toThrow(/administrativa/);expect((await db.query<{allowed:boolean}>("select has_function_privilege('anon','public.set_agency_role_permissions(uuid,jsonb)','EXECUTE') allowed")).rows[0].allowed).toBe(false);await db.exec("select set_config('test.uid','',false)");await expect(save(db,[change()])).rejects.toThrow(/administrativa/);}finally{await db.close()}})
 it('rejects empty or malformed batches without changing grants',async()=>{const db=await setup();try{const before=(await grants(db)).rows;for(const p of [null,{},[],[null],[change(target,tasks,null)]])await expect(save(db,p)).rejects.toThrow();expect((await grants(db)).rows).toEqual(before);}finally{await db.close()}})
});
