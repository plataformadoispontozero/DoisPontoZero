// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { describe, it, expect } from 'vitest';
import migration from '../../../supabase/migrations/20261012130843_client_legacy_records.sql?raw';
describe('legacy snapshot boundaries',()=>{
 it('preserves original document and rejects tenant mismatch, secrets and duplicate imports',async()=>{
 const db=new PGlite();
 const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',c='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',s='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 try {
 await db.exec(`create schema private;create role anon;create role authenticated;create role service_role;
 create table agencies(id uuid primary key);
 create table clients(id uuid primary key,agency_id uuid,profile jsonb);
 create function private.can_editorial(uuid,text) returns boolean language sql as $$select false$$;
 insert into agencies values('${a}');insert into clients values('${c}','${a}','{"source_id":"${s}"}');`);
 await db.exec(migration);
 const insert=async(payload:unknown,source=s)=>db.query(`insert into client_legacy_records(agency_id,client_id,source_project,source_kind,source_id,source_client_id,payload) values($1,$2,'88ee1363-3966-494f-a78d-ad375651555f','calendarios',gen_random_uuid(),$3,$4::jsonb) returning id`,[a,c,source,JSON.stringify(payload)]);
 await expect(insert({tema:'Original',status:'aprovado',status_aprovacao:'rascunho'})).resolves.toBeDefined();
 await expect(insert({token_aprovacao:s})).rejects.toThrow(/tokens/);
 await expect(insert({nested:[{token_cliente:s}]})).rejects.toThrow(/tokens/);
 await expect(insert({tema:'Other'},a)).rejects.toThrow(/mapping/);
 const result=await db.query<{payload:unknown}>('select payload from client_legacy_records');
 expect(result.rows[0].payload).toEqual({tema:'Original',status:'aprovado',status_aprovacao:'rascunho'});
 await expect(db.exec('insert into client_legacy_records select * from client_legacy_records')).rejects.toThrow(/duplicate/);
 await db.exec('set role authenticated');
 expect((await db.query('select * from client_legacy_records')).rows).toEqual([]);
 await expect(db.exec('delete from client_legacy_records')).rejects.toThrow(/permission denied/);
 }finally{await db.close();}
 });
});
