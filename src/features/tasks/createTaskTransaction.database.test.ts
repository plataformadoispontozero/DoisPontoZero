// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import {expect,it} from 'vitest'
import migration from '../../../supabase/migrations/20261018120000_atomic_task_creation.sql?raw'

const agency='00000000-0000-4000-8000-000000000001',user='00000000-0000-4000-8000-000000000002',project='00000000-0000-4000-8000-000000000003',board='00000000-0000-4000-8000-000000000004',column='00000000-0000-4000-8000-000000000005',assignee='00000000-0000-4000-8000-000000000006',request='00000000-0000-4000-8000-000000000007'

async function setup(){
 const db=new PGlite()
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create table public.agencies(id uuid primary key);create table public.profiles(id uuid primary key);
 create table public.projects(id uuid primary key,agency_id uuid not null,created_by uuid);
 create table public.project_boards(id uuid primary key,agency_id uuid not null,project_id uuid not null);
 create table public.board_columns(id uuid primary key,agency_id uuid not null,board_id uuid not null);
 create table public.project_members(project_id uuid,agency_id uuid,user_id uuid);
 create table public.tasks(id uuid primary key default gen_random_uuid(),agency_id uuid not null,project_id uuid not null,board_id uuid not null,column_id uuid not null,parent_task_id uuid,title text not null,description text,priority text not null,status text not null,position double precision not null,start_date date,due_date date,completed_at timestamptz,created_by uuid not null,archived_at timestamptz);
 create table public.task_assignees(id uuid primary key default gen_random_uuid(),agency_id uuid,task_id uuid,user_id uuid,constraint unique_task_assignee unique(task_id,user_id));
 create table public.task_activity(agency_id uuid,task_id uuid,actor_user_id uuid,action text,metadata jsonb);
 create table private.client_assignees(project_id uuid,user_id uuid);
 create function private.can_editorial(a uuid,p text) returns boolean language sql stable as $$select p='tasks.create' or p='tasks.assign'$$;
 create function public.can_access_project(p uuid) returns boolean language sql stable as $$select exists(select 1 from public.projects where id=p)$$;
 create function private.auto_assign() returns trigger language plpgsql as $$begin insert into public.task_assignees(agency_id,task_id,user_id) select new.agency_id,new.id,user_id from private.client_assignees where project_id=new.project_id on conflict(task_id,user_id) do nothing;return new;end$$;
 create trigger assign_client_demand after insert on public.tasks for each row execute function private.auto_assign();
 insert into public.agencies values('${agency}');insert into public.profiles values('${user}'),('${assignee}');
 insert into public.projects values('${project}','${agency}','${user}');insert into public.project_boards values('${board}','${agency}','${project}');
 insert into public.board_columns values('${column}','${agency}','${board}');insert into public.project_members values('${project}','${agency}','${assignee}');
 insert into private.client_assignees values('${project}','${assignee}');select set_config('test.uid','${user}',false);`)
 await db.exec(migration)
 return db
}

const call=(db:PGlite,assignees:string[]=[assignee])=>db.query<{id:string}>(`select public.create_task_with_assignees($1,$2,$3,$4,null,'[Design] Test task','Description','normal','open',null,null,$5::uuid[],$6) id`,[agency,project,board,column,assignees,request])

it('creates task, automatic and explicit assignment, activity and idempotency record atomically',async()=>{
 const db=await setup();try{
  await db.exec('set role authenticated')
  const first=(await call(db)).rows[0].id,second=(await call(db)).rows[0].id
  await db.exec('reset role')
  expect(second).toBe(first)
  expect((await db.query('select id from tasks')).rows).toHaveLength(1)
  expect((await db.query('select user_id from task_assignees')).rows).toEqual([{user_id:assignee}])
  expect((await db.query("select action from task_activity where action='created'")).rows).toHaveLength(1)
 }finally{await db.close()}
})

it('rolls back a task and activity when an explicit assignee is outside the project',async()=>{
 const db=await setup();try{
  await db.exec('set role authenticated')
  await expect(call(db,[user])).rejects.toThrow('Responsável fora do projeto')
  await db.exec('reset role')
  expect((await db.query('select id from tasks')).rows).toHaveLength(0)
  expect((await db.query('select task_id from task_activity')).rows).toHaveLength(0)
  expect((await db.query('select task_id from private.task_create_requests')).rows).toHaveLength(0)
 }finally{await db.close()}
})
