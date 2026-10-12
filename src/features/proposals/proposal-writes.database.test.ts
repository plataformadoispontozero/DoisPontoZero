// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {it,expect} from 'vitest';
import schema from '../../../supabase/migrations/20261010000006_phase08_proposals.sql?raw';
import migration from '../../../supabase/migrations/20261012155239_proposal_transactional_writes.sql?raw';
const a='11111111-1111-4111-8111-111111111111',c='22222222-2222-4222-8222-222222222222',u='33333333-3333-4333-8333-333333333333';
it('creates tenant-scoped proposals, computes totals and rejects foreign IDs/status changes atomically',async()=>{const db=new PGlite();try{
 await db.exec(`create schema private;create schema auth;create role anon;create role authenticated;create function auth.uid() returns uuid language sql as $$select '${u}'::uuid$$;create function private.can_editorial(a uuid,p text) returns boolean language sql as $$select a='${a}'::uuid$$;create table auth.users(id uuid primary key);insert into auth.users values('${u}');create table agencies(id uuid primary key);insert into agencies values('${a}');create table clients(id uuid primary key,agency_id uuid);insert into clients values('${c}','${a}');create table briefings(id uuid primary key,agency_id uuid,client_id uuid);create table content_strategies(id uuid primary key,agency_id uuid,client_id uuid);`);
 await db.exec(schema.slice(schema.indexOf('-- 2. TABELA:'),schema.indexOf('-- 8. TABELA:')));await db.exec(migration);
 const created=(await db.query<{v:{id:string;pricing:{total_cents:number}}}>('select create_agency_proposal($1,$2) v',[a,{client_id:c,title:'Fictício'}])).rows[0].v;
 const item='44444444-4444-4444-8444-444444444444';
 const saved=(await db.query<{v:{pricing:{total_cents:number};items:{total_cents:number}[]}}>('select save_agency_proposal($1,$2,$3) v',[a,created.id,{items:[{id:item,name:'Serviço fictício',quantity:2,unit_price_cents:1000,discount_cents:200,total_cents:1}]}])).rows[0].v;
 expect(saved.pricing.total_cents).toBe(1800);expect(saved.items[0].total_cents).toBe(1800);
 await expect(db.query('select save_agency_proposal($1,$2,$3)',[a,created.id,{status:'accepted'}])).rejects.toThrow(/Status/);
 await expect(db.query('select create_agency_proposal($1,$2)',[c,{client_id:c,title:'Inválido'}])).rejects.toThrow(/permissão/);
 const other=(await db.query<{v:{id:string}}>('select create_agency_proposal($1,$2) v',[a,{client_id:c,title:'Outro'}])).rows[0].v;
 await expect(db.query('select save_agency_proposal($1,$2,$3)',[a,other.id,{items:[{id:item,name:'Falso'}]}])).rejects.toThrow(/fora da proposta/);
 expect((await db.query('select count(*)::int n from proposal_items')).rows[0]).toEqual({n:1});
 }finally{await db.close()}});
