import fs from 'node:fs';
import ts from 'typescript';
const args=Object.fromEntries(process.argv.slice(2).map((v,i,a)=>v.startsWith('--')?[v.slice(2),a[i+1]]:null).filter(Boolean));
if(!args.input||!args.output)throw Error('Informe --input e --output para o relatório privado.');
async function module(path){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}
const engine=await module('src/features/editorial/campaignEngine.ts'),ctx=await module('src/features/editorial/editorialContext.ts');
const data=JSON.parse(fs.readFileSync(args.input,'utf8')),report=[];
for(const c of data.clientes){const brief=c.briefing||{},profile={niche:c.nicho,positioning:c.posicionamento,differential:c.diferencial};const context={objective:c.objetivo_mes||'',audience:c.publico_alvo||'',tone:c.tom_comunicacao||'',positioning:c.diferencial||'',restrictions:'',...ctx.briefingEditorialContext(Object.entries(brief).map(([questionKey,value])=>({questionKey,value}))),topics:ctx.suggestEditorialTopics(profile,c.briefing?[{id:brief.id,payload:brief}]:[],[]).map(t=>t.text)};try{const plan=engine.generateCampaignPlan('2026-11',c.nome_negocio,context,{post:4,reels:4,carousel:2},{clientId:c.id,history:ctx.legacyCalendarHistory(c.id,(c.calendarios||[]).map(v=>({id:v.id,payload:v})))});report.push({source_id:c.id,ok:true,count:plan.length});if(args['pilot-sql']&&c.id==='8fde80c6-307c-4cab-b6ad-96c0bbafb278'){
 const quote=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
 const agency='a0f00e64-e8ba-44e5-b0cf-2ad7adb44211',briefId='cc5f33d5-236f-41c2-9abc-c31ce09bb50e';
 const sql=`begin;\nset local request.jwt.claim.sub='f90b702c-ff8c-4dde-9a51-918b3c4f1f93';\nselect public.save_monthly_editorial(null,'${agency}','b006af7c-9719-4471-8d60-106101c14a67','${briefId}','2026-11-01',${quote({...context,engineVersion:engine.ENGINE_VERSION,repertoireVersion:0,requestedCounts:{post:4,reels:4,carousel:2},forbiddenTerms:engine.forbiddenTerms(context)})}||jsonb_build_object('briefingRevision',public.get_editorial_briefing('${agency}','b006af7c-9719-4471-8d60-106101c14a67','${briefId}')->>'revision'),${quote(plan)}) is not null as saved;\nrollback;\n`;
 fs.writeFileSync(args['pilot-sql'],sql,{mode:0o600});
 }}catch(e){report.push({source_id:c.id,ok:false,reason:/Preencha cliente, objetivo/.test(e.message)?'missing_context':/esgotado/.test(e.message)?'repertoire_exhausted':'generation_error'});}}
fs.writeFileSync(args.output,JSON.stringify(report),{mode:0o600});console.log(JSON.stringify({clients:report.length,generated:report.filter(r=>r.ok).length,failures:report.filter(r=>!r.ok)}));
