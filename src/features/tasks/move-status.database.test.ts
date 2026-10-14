// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {it,expect} from 'vitest';
import migration from '../../../supabase/migrations/20261014011725_synchronize_task_status_on_move.sql?raw';
it('keeps statuses, timestamps and history synchronized while rejecting forbidden moves',async()=>{
const db=new PGlite();const sql=migration;
try {
await db.exec(`create schema auth;create role authenticated;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table tasks(id uuid primary key,agency_id uuid,project_id uuid,board_id uuid,column_id uuid,position double precision,status text check(status in ('open','in_progress','review','done','archived')),created_by uuid,updated_at timestamptz,completed_at timestamptz);
create table board_columns(id uuid primary key,board_id uuid,name text,category text);
create table task_assignees(task_id uuid,user_id uuid);create table task_activity(agency_id uuid,task_id uuid,actor_user_id uuid,action text,metadata jsonb);
create function public.can_access_project(uuid) returns boolean language sql as $$select coalesce(current_setting('test.allowed',true),'no')='yes'$$;
create function public.has_agency_permission(uuid,text) returns boolean language sql as $$select coalesce(current_setting('test.allowed',true),'no')='yes'$$;
create function public.is_agency_owner(uuid) returns boolean language sql as $$select false$$;
select set_config('test.uid','00000000-0000-4000-8000-000000000001',false);select set_config('test.allowed','yes',false);`);
await db.exec(sql);
const ids=Array.from({length:9},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);const [u,t,a,p,b,open,progress,review,done]=ids;
await db.query(`insert into tasks values($1,$2,$3,$4,$5,0,'open',$6,now(),null)`,[t,a,p,b,open,u]);
for(const [id,category] of [[open,'backlog'],[progress,'in_progress'],[review,'review'],[done,'done']])await db.query('insert into board_columns values($1,$2,$3,$3)',[id,b,category]);
const move=async (column:string)=>db.query('select public.move_task($1,$2,0)',[t,column]);const task=async()=>(await db.query<{status:string;completed_at:string|null}>('select status,completed_at from tasks')).rows[0];
for(const [column,status] of [[progress,'in_progress'],[review,'review'],[done,'done'],[open,'open']]){await move(column);expect((await task()).status).toBe(status);expect((await task()).completed_at!==null).toBe(status==='done');}
await db.query('insert into board_columns values($1,$2,$3,$3)',['00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011','done']);
await expect(move('00000000-0000-4000-8000-000000000010')).rejects.toThrow(/mesmo quadro/);expect((await task()).status).toBe('open');
await db.exec("select set_config('test.allowed','no',false)");await expect(move(done)).rejects.toThrow(/Permissão/);expect((await task()).status).toBe('open');expect((await db.query<{n:number}>('select count(*)::int n from task_activity')).rows[0].n).toBe(4);
}finally{await db.close();}
});
