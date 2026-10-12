// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {it,expect} from 'vitest';
import migration from '../../../supabase/migrations/20261012130853_drive_material_approval.sql?raw';
it('keeps approval metadata private and blocks tenant mismatch, expired links and repeat responses',async()=>{
 const db=new PGlite();const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',c='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',u='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 try{
 await db.exec(`create schema private;create schema auth;create role anon;create role authenticated;create role service_role;create table auth.users(id uuid primary key);create table agencies(id uuid primary key);create table clients(id uuid primary key,agency_id uuid);create table agency_members(agency_id uuid,user_id uuid,status text);insert into auth.users values('${u}');insert into agencies values('${a}');insert into clients values('${c}','${a}');insert into agency_members values('${a}','${u}','active');`);
 await db.exec(migration);
 const create=()=>db.query("select drive_material_approval_service('create','hash',$1,$2,$3,'folder','[{\"id\":\"file\",\"version\":\"1\"}]') as result",[a,c,u]);
 await expect(db.query("select drive_material_approval_service('create','wrong',$1,$2,$3,'folder','[]')",[u,c,u])).rejects.toThrow(/scope/);
 await create();
 await expect(db.exec("set role anon;select drive_material_approval_service('read','hash')")).rejects.toThrow(/permission denied/);await db.exec('reset role');
 const read=await db.query<{result:Record<string,unknown>}>("select drive_material_approval_service('read','hash') as result");expect(read.rows[0].result).not.toHaveProperty('token_hash');
 await db.exec("select drive_material_approval_service('respond','hash',p_status=>'approved')");
 await expect(db.exec("select drive_material_approval_service('respond','hash',p_status=>'approved')")).rejects.toThrow(/response/);
 await db.exec("update private.drive_material_approvals set expires_at=now()-interval '1 second'");
 await expect(db.exec("select drive_material_approval_service('read','hash')")).rejects.toThrow(/expired/);
 }finally{await db.close();}
},15000);
