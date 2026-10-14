// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import {it,expect} from 'vitest'
import phase from '../../../supabase/migrations/20261010000008_phase10_meetings_chat.sql?raw'
import retirement from '../../../supabase/migrations/20261014054352_disable_legacy_meeting_conversion.sql?raw'
it('retires the four-argument unguarded overload without removing the canonical conversion or records',async()=>{
 const db=new PGlite();try{await db.exec('create schema private;create role authenticated;create role anon;');const start=phase.indexOf('CREATE OR REPLACE FUNCTION convert_action_item_to_task('),end=phase.indexOf('$$;',start);await db.exec(phase.slice(start,end+3));await db.exec('create function public.convert_action_item_to_task(uuid,uuid) returns uuid language sql as $$select $1$$;grant execute on function public.convert_action_item_to_task(uuid,uuid) to authenticated;');await db.exec(retirement);
 expect((await db.query("select to_regprocedure('public.convert_action_item_to_task(uuid,uuid,uuid,timestamp with time zone)') is null removed")).rows[0]).toEqual({removed:true});for(const role of ['anon','authenticated'])expect((await db.query('select has_function_privilege($1,$2,$3) allowed',[role,'private.legacy_convert_action_item_to_task(uuid,uuid,uuid,timestamp with time zone)','execute'])).rows[0]).toEqual({allowed:false});await db.exec('set role authenticated');expect((await db.query('select public.convert_action_item_to_task($1,$2) result',['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'])).rows[0]).toEqual({result:'00000000-0000-4000-8000-000000000001'});
 }finally{await db.close()}
})
