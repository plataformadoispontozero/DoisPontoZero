import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const credentialKey=/(token|secret|password|senha|api_key|credential|acesso_)/i;
export function sanitize(value) {
 if(Array.isArray(value))return value.map(sanitize);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!credentialKey.test(k)).map(([k,v])=>[k,sanitize(v)]));
 if(typeof value==='string'&&(/data:[^;]+;base64,/i.test(value)||/-----BEGIN.*PRIVATE KEY-----|Bearer\s+[a-z\d._-]{20,}/i.test(value)))return '[REDACTED]';
 return value;
}
const stable=value=>JSON.stringify(value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(stable(value[k]))])):Array.isArray(value)?value.map(v=>JSON.parse(stable(v))):value);
export function plan(records,clientMap,existing=[],userMap={}) {
 const seen=new Set(),bySource=new Map(existing.map(r=>[r.source_id,r]));
 return records.map(record=>{
  const sourceId=record.id,clientId=clientMap[record.source_client_id],payload=sanitize(record.payload||record),previous=bySource.get(sourceId);let outcome='ready';
  if(seen.has(sourceId))outcome='duplicate_source';
  else if(!clientId)outcome='unmatched_client';
  else if(previous&&previous.source_client_id!==record.source_client_id)outcome='client_conflict';
  else if(previous)outcome=stable(sanitize(previous.payload))===stable(payload)?'skip_unchanged':'conflict_review';
  seen.add(sourceId);
  const oldUsers=[payload.criado_por,payload.atualizado_por,payload.alterado_por].filter(Boolean);
  return {source_id:sourceId,source_client_id:record.source_client_id,target_id:previous?.id||null,client_id:clientId||null,outcome,unmapped_users:[...new Set(oldUsers.filter(id=>!userMap[id]))],source_created_at:payload.criado_em||payload.alterado_em||null,source_updated_at:payload.atualizado_em||null};
 });
}
async function json(path){return JSON.parse(await readFile(path,'utf8'));}
export async function run(mode='dry-run',directory){
 if(!['audit','export','dry-run','verify'].includes(mode))throw Error('Migração definitiva indisponível: apresentar relatório e validar piloto primeiro.');
 if(!directory)throw Error('Informe --directory com backups locais; nenhuma conexão/escrita no banco é realizada.');
 const root=resolve(directory),records=await json(join(root,'lovable-briefings-backup.json')),map=await json(join(root,'briefing-client-map.json')),users=await json(join(root,'briefing-user-map.json')),existing=await json(join(root,'destination-briefings.json')),history=await json(join(root,'briefing-history-backup.json'));
 const plans=plan(records,map,existing,users),hist=plan(history.map(h=>({id:h.id,source_client_id:h.source_client_id,payload:h})),map,[],users);
 const counts=rows=>rows.reduce((acc,r)=>({...acc,[r.outcome]:(acc[r.outcome]||0)+1}),{});
 const report={read_only:true,mode,source_briefings:records.length,destination_historical_briefings:existing.length,briefings:counts(plans),source_history:history.length,history:counts(hist),unmapped_user_ids:[...new Set([...plans,...hist].flatMap(r=>r.unmapped_users))],unmatched_clients:[...plans,...hist].filter(r=>r.outcome==='unmatched_client'),records:plans,history_records:hist,planned_database_writes:0,requires_confirmation:true};
 await writeFile(join(root,'briefing-migration-report.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
 if(mode==='export')await writeFile(join(root,'lovable-briefings-backup.sanitized.json'),JSON.stringify(records.map(sanitize),null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({read_only:true,source_briefings:records.length,briefings:report.briefings,source_history:history.length,history:report.history,unmapped_users:report.unmapped_user_ids.length,database_writes:0,report:join(root,'briefing-migration-report.json')},null,2));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const dirIndex=process.argv.indexOf('--directory');await run(process.argv[2]||'dry-run',dirIndex>=0?process.argv[dirIndex+1]:null);}
