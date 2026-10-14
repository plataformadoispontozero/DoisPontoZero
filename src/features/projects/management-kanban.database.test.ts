// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import {it,expect} from 'vitest'
import migration from '../../../supabase/migrations/20261014022802_management_kanban.sql?raw'
it('restricts the management endpoint by active role, agency and caller permissions',async()=>{
 const db=new PGlite(),agency='00000000-0000-4000-8000-000000000001',user='00000000-0000-4000-8000-000000000002',role='00000000-0000-4000-8000-000000000003',project='00000000-0000-4000-8000-000000000004'
 try{await db.exec(`create role anon;create role authenticated;create schema auth;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function public.has_agency_permission(uuid,text) returns boolean language sql as $$select current_setting('test.allowed',true)='yes'$$;
 create table agency_members(agency_id uuid,user_id uuid,role_id uuid,status text);create table roles(id uuid,agency_id uuid,name text);create table clients(id uuid,agency_id uuid,name text);create table projects(id uuid,agency_id uuid,client_id uuid,name text,archived_at timestamptz);create table board_columns(id uuid,agency_id uuid);create table tasks(id uuid,agency_id uuid,project_id uuid,column_id uuid,due_date date,archived_at timestamptz,parent_task_id uuid);
 grant usage on schema auth to authenticated;grant select on all tables in schema public to authenticated;`);await db.exec(migration)
 await db.query('insert into roles values($1,$2,$3)',[role,agency,'MANAGER']);await db.query('insert into agency_members values($1,$2,$3,$4)',[agency,user,role,'active']);await db.query('insert into projects values($1,$2,null,$3,null)',[project,agency,'Projeto de teste']);await db.query('insert into tasks values($1,$2,$3,null,current_date,null,null)',['00000000-0000-4000-8000-000000000005',agency,project]);
 await db.query("select set_config('test.uid',$1,false),set_config('test.allowed','yes',false)",[user]);await db.exec('set role authenticated');const read=()=>db.query<{result:{tasks:unknown[]}}>('select get_management_kanban($1) result',[agency]);expect((await read()).rows[0].result.tasks).toHaveLength(1)
 await expect(db.query('select get_management_kanban($1)',['00000000-0000-4000-8000-000000000099'])).rejects.toThrow(/restrito/)
 await db.exec('reset role');await db.query("update roles set name='MEMBER'");await db.exec('set role authenticated');await expect(read()).rejects.toThrow(/restrito/)
 await db.exec('reset role');await db.exec("update roles set name='MANAGER';update agency_members set status='inactive'");await db.exec('set role authenticated');await expect(read()).rejects.toThrow(/restrito/)
 await db.exec('reset role');await db.query("update agency_members set status='active'");await db.exec("select set_config('test.allowed','no',false);set role authenticated");await expect(read()).rejects.toThrow(/restrito/)
 await db.exec('reset role;set role anon');await expect(read()).rejects.toThrow(/permission denied/)
 }finally{await db.close()}
})
