import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {sanitize} from './audit.mjs';
// Preparation only. Never connects to either database or writes to the source.
const args=process.argv.slice(2),get=name=>args[args.indexOf(name)+1];
for(const flag of ['--directory','--out'])if(!args.includes(flag))throw Error(`Informe ${flag}.`);
if(!args.includes('--confirm-full-import'))throw Error('Confirme a importação completa autorizada.');
const agency='a0f00e64-e8ba-44e5-b0cf-2ad7adb44211',project='88ee1363-3966-494f-a78d-ad375651555f';
const directory=resolve(get('--directory'));
const records=JSON.parse(await readFile(join(directory,'lovable-briefings-backup.json'),'utf8'));
const mapping=JSON.parse(await readFile(join(directory,'briefing-client-map.json'),'utf8'));
const history=JSON.parse(await readFile(join(directory,'briefing-history-backup.json'),'utf8')).map(sanitize);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
if(records.length!==23||history.length!==554||Object.keys(mapping).length!==29||new Set(Object.values(mapping)).size!==29||Object.entries(mapping).some(([a,b])=>!uuid.test(a)||!uuid.test(b)))throw Error('Contagens ou mapa auditado divergentes.');
if(new Set(records.map(r=>r.id)).size!==23||new Set(history.map(h=>h.id)).size!==554)throw Error('IDs históricos duplicados.');
const quote=value=>"'"+value.replaceAll("'","''")+"'";
let sql='begin;\nset local standard_conforming_strings=on;\n';
for(const record of records){
 const client=mapping[record.source_client_id];
 if(!client||!uuid.test(record.id)||record.payload.id!==record.id||record.payload.cliente_id!==record.source_client_id)throw Error('Briefing sem vínculo UUID válido.');
 const entries=history.filter(h=>h.briefing_id===record.id);
 if(entries.some(h=>h.source_client_id!==record.source_client_id||!uuid.test(h.id)))throw Error('Histórico fora do cliente.');
 const payload=quote(JSON.stringify(sanitize(record.payload)));
 sql+=`do $guard$ begin if not exists(select 1 from public.client_legacy_records where agency_id='${agency}' and client_id='${client}' and source_project='${project}' and source_kind='briefings' and source_id='${record.id}' and payload=${payload}::jsonb) then raise exception 'Snapshot divergiu da origem auditada';end if;end $guard$;\n`;
 sql+=`select private.import_legacy_briefing('${agency}'::uuid,'${client}'::uuid,'${record.id}'::uuid,${quote(JSON.stringify(entries))}::jsonb) as result;\n`;
}
if(history.some(h=>!records.some(r=>r.id===h.briefing_id)))throw Error('Histórico órfão.');
sql+='commit;\n';
await writeFile(resolve(get('--out')),sql,{mode:0o600});
console.log(JSON.stringify({prepared:true,database_writes:0,mapped_clients:29,briefings:23,history:554,output:resolve(get('--out'))}));
