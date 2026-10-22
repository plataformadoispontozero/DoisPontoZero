// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import workflow from '../../../supabase/migrations/20261011173520_monthly_editorial_workflow.sql?raw'
import engine from '../../../supabase/migrations/20261012033627_campaign_editorial_engine.sql?raw'
import {it,expect} from 'vitest'
import {adaptAiCalendar,type AiCalendarResult} from './aiCalendarAdapter'
const agency='11111111-1111-4111-8111-111111111111',client='22222222-2222-4222-8222-222222222222'
function sqlFunction(source:string,name:string){const start=source.indexOf(`CREATE OR REPLACE FUNCTION ${name}(`);if(start<0)throw Error('Missing canonical SQL function');const end=source.indexOf('$$;',source.indexOf('AS $$',start))+3;return source.slice(start,end)}
// Minimal unrelated relations; guard + save RPC below are actual migration functions, not replicas.
async function setup(){const db=new PGlite();await db.exec(`
CREATE SCHEMA private;CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${client}'::uuid$$;
CREATE FUNCTION private.can_editorial(a uuid,p text) RETURNS boolean LANGUAGE sql AS $$SELECT a='${agency}'::uuid$$;
CREATE TABLE clients(id uuid PRIMARY KEY,agency_id uuid,name text);
CREATE TABLE briefings(id uuid,agency_id uuid,client_id uuid);
CREATE TABLE content_strategies(id uuid,agency_id uuid,client_id uuid);
CREATE TABLE content_ideas(agency_id uuid,strategy_id uuid,title text);
CREATE TABLE editorial_pillars(id uuid,agency_id uuid,strategy_id uuid,percentage integer,example_topics text[],content_formats text[]);
CREATE TABLE editorial_repertoire_versions(agency_id uuid,version integer,families jsonb);
CREATE TABLE editorial_idea_registry(agency_id uuid,client_id uuid,campaign_id uuid,signature text,essential_signature text,first_item jsonb);
CREATE TABLE monthly_editorial_campaigns(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),agency_id uuid,client_id uuid,briefing_id uuid,month date,context jsonb,items jsonb,status text DEFAULT 'draft',project_id uuid,updated_at timestamptz DEFAULT now());
CREATE TABLE monthly_editorial_shares(campaign_id uuid,revoked boolean);
CREATE FUNCTION private.editorial_brief_snapshot(a uuid,b uuid) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
INSERT INTO clients VALUES('${client}','${agency}','Synthetic editorial fixture');
`);await db.exec(sqlFunction(engine,'private.editorial_normalize'));await db.exec(sqlFunction(engine,'private.editorial_campaign_guard'));await db.exec('CREATE TRIGGER editorial_guard BEFORE INSERT OR UPDATE ON monthly_editorial_campaigns FOR EACH ROW EXECUTE FUNCTION private.editorial_campaign_guard()');await db.exec(sqlFunction(workflow,'public.save_monthly_editorial'));return db}
function fixture():AiCalendarResult{return{provider:'gemini',model:'gemini-3.5-flash',requiresReview:true,items:Array.from({length:12},(_,i)=>{const format=i<5?'post':i<9?'carousel':'reels';return{date:`2026-11-${String(i+1).padStart(2,'0')}`,format,title:`Tema aprovado ${i+1}`,headline:'Informação objetiva',support:'Leia a legenda',caption:'Informação editorial aprovada para revisão pela equipe antes de publicar.',visual:'Fotografia aprovada com título legível',...(format==='carousel'?{slides:Array.from({length:5},(_,n)=>({headline:`Etapa ${n+1}`,text:'Orientação curta aprovada',visual:'Fotografia do produto'}))}:{}),...(format==='reels'?{duration:30,scenes:Array.from({length:3},()=>({seconds:10,text:'Fala objetiva da cena',visual:'Plano do produto'}))}:{})}})}}
it('persists twelve adapted AI drafts using the canonical SQL guard and rejects the original invalid trace',async()=>{
 const db=await setup();try{
 const context={objective:'Orientar o público',audience:'Clientes da marca',tone:'Direto',positioning:'Atendimento',restrictions:''}
 const raw=fixture(),items=adaptAiCalendar(raw,context,'2026-11',{post:5,carousel:4,reels:3})
 const canonicalContext={...context,engineVersion:'campaign-rules-1.0',repertoireVersion:0,topics:items.map(i=>i.editorial!.theme),forbiddenTerms:[],generationProvider:'gemini',generationModel:raw.model}
 const save=(content:unknown,ctx:unknown=canonicalContext,id:string|null=null)=>db.query<{id:string}>('SELECT public.save_monthly_editorial($1,$2,$3,null,$4,$5,$6) id',[id,agency,client,'2026-11-01',ctx,content])
 expect(items.every(i=>i.editorial?.family==='educational'&&i.editorial?.angle==='conceito'&&i.editorial?.pillarId==='monthly-priorities')).toBe(true)
 const broken=structuredClone(items);broken[0].editorial!.family='ai-draft';await expect(save(broken)).rejects.toThrow('Ficha editorial inválida')
 await expect(save(items,{...canonicalContext,topics:[]})).rejects.toThrow('Tema não consta nas prioridades aprovadas')
 const wrongAngle=structuredClone(items);wrongAngle[0].editorial!.angle='post';await expect(save(wrongAngle)).rejects.toThrow('Ângulo fora do repertório padrão')
 const saved=(await save(items)).rows[0].id
 const persisted=(await db.query<{items:typeof items;context:typeof canonicalContext;status:string;project_id:null}>('SELECT items,context,status,project_id FROM monthly_editorial_campaigns WHERE id=$1',[saved])).rows[0]
 expect(persisted.items).toHaveLength(12);expect(persisted.items.filter(i=>i.format==='carousel')).toHaveLength(4);expect(persisted.items.filter(i=>i.format==='reels')).toHaveLength(3);expect(persisted.status).toBe('draft');expect(persisted.project_id).toBeNull();expect(persisted.context.generationProvider).toBe('gemini');expect(persisted.items[0].editorial?.rules).toContain('generation:gemini')
 }finally{await db.close()}
})
