// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import {describe,it,expect} from 'vitest'
import migration from '../../../supabase/migrations/20261012233624_showcase_drive_references.sql?raw'
import anonymousBridge from '../../../supabase/migrations/20261012234001_showcase_anonymous_bridge.sql?raw'
import reviewsMigration from '../../../supabase/migrations/20261013143738_presentation_material_reviews.sql?raw'
const agency='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222', presentation='33333333-3333-4333-8333-333333333333',client='44444444-4444-4444-8444-444444444444',file='55555555-5555-4555-8555-555555555555',token='published-showcase-token-valid-12345'
async function setup(){const db=new PGlite();await db.exec(`
create schema private;create schema extensions;create role anon;create role authenticated;
create function extensions.digest(t text,a text) returns bytea language sql as $$select convert_to(t,'UTF8')$$;
create table agencies(id uuid primary key,name text,logo_url text);
create table clients(id uuid primary key,agency_id uuid,name text,logo_url text);
create table presentations(id uuid primary key,agency_id uuid,client_id uuid,title text,description text,period_month int,period_year int,status text,published_at timestamptz,archived_at timestamptz);
create table presentation_public_links(id uuid primary key,agency_id uuid,presentation_id uuid,token_hash text,revoked_at timestamptz,expires_at timestamptz);
create table presentation_sections(id uuid primary key,agency_id uuid,presentation_id uuid,position int,title text,section_type text,description text,content jsonb);
create table drive_file_references(id uuid primary key,agency_id uuid,availability_status text,web_view_link text,thumbnail_reference text,mime_type text);
create table presentation_assets(id uuid primary key,agency_id uuid,presentation_id uuid,file_reference_id uuid,section_id uuid,position int,title text,description text);
create table presentation_activity(agency_id uuid,presentation_id uuid,action text,metadata jsonb);
create function public.is_agency_member(a uuid) returns boolean language sql as $$select false$$;
create function private.can_editorial(a uuid,p text) returns boolean language sql as $$select false$$;
grant usage on schema public to anon,authenticated;grant usage on schema private to authenticated;
insert into agencies values('${agency}','Test Agency',null),('${other}','Other',null);
insert into clients values('${client}','${agency}','Test Client',null);
insert into presentations values('${presentation}','${agency}','${client}','Showcase',null,10,2026,'published',now(),null);
insert into presentation_public_links values(gen_random_uuid(),'${agency}','${presentation}',encode(extensions.digest('${token}','sha256'),'hex'),null,null);
insert into presentation_sections values(gen_random_uuid(),'${agency}','${presentation}',0,'Briefing content','overview',null,'{"text":"Actual section copy"}');
insert into drive_file_references values('${file}','${agency}','available','https://drive.google.com/file/d/real/view','https://lh3.googleusercontent.com/preview','image/webp');
insert into presentation_assets values(gen_random_uuid(),'${agency}','${presentation}','${file}',null,0,'Art',null);
`);await db.exec(migration);await db.exec(anonymousBridge);await db.exec(reviewsMigration);return db}
async function read(db:PGlite,t=token){return (await db.query<{result:{error?:string;assets:{web_view_link:string|null}[];sections:{content:{text:string}}[]}}>('select public.get_public_showcase($1) result',[t])).rows[0].result}

describe('material feedback token authorization',()=>{
 it('preserves decisions and blocks anonymous table reads, forged assets and invalid links',async()=>{const db=await setup();try{
 const asset=(await db.query<{id:string}>('select id from presentation_assets')).rows[0].id;
 await db.exec('set role anon');
 const submit=(decision:string,note='',t=token,a=asset)=>db.query('select public.submit_showcase_material_review($1,$2,$3,$4)',[t,a,decision,note]);
 await submit('approved'); await submit('changes_requested','Ajustar título'); await submit('rejected','Não corresponde ao briefing');
 const history=await db.query<{result:{asset_id:string;decision:string}[]}>('select public.get_showcase_material_reviews($1) result',[token]);expect(history.rows[0].result).toHaveLength(3);expect(history.rows[0].result.every(r=>r.asset_id===asset)).toBe(true);await expect(db.query('select public.get_showcase_material_reviews($1)', ['invalid-token-of-sufficient-length'])).rejects.toThrow();
 await expect(submit('changes_requested')).rejects.toThrow();
 await expect(submit('approved','',token,'99999999-9999-4999-8999-999999999999')).rejects.toThrow();
 await expect(submit('approved','','invalid')).rejects.toThrow();
 await expect(db.query('select * from presentation_material_reviews')).rejects.toThrow();
 await db.exec('reset role'); expect((await db.query('select * from presentation_material_reviews')).rows).toHaveLength(3);
 for(const sql of ["update presentation_public_links set revoked_at=now()","update presentation_public_links set revoked_at=null,expires_at=now()-interval '1 day'","update presentation_public_links set expires_at=null; update presentations set status='draft'","update presentations set status='published',archived_at=now()"]){await db.exec(sql);await db.exec('set role anon');await expect(submit('approved')).rejects.toThrow();await expect(db.query('select public.get_showcase_material_reviews($1)',[token])).rejects.toThrow();await db.exec('reset role');}
 }finally{await db.close()}})
})
