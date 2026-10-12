import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {sanitize} from './audit.mjs';
// Preparation only: this script never opens a database connection.
const args=process.argv.slice(2),get=name=>args[args.indexOf(name)+1];
for(const flag of ['--directory','--out','--expected-source-hash'])if(!args.includes(flag))throw Error(`Informe ${flag}.`);
if(!args.includes('--confirm-single-client'))throw Error('Este comando prepara apenas o piloto autorizado de um cliente.');
const agency='a0f00e64-e8ba-44e5-b0cf-2ad7adb44211',client='b006af7c-9719-4471-8d60-106101c14a67',sourceClient='8fde80c6-307c-4cab-b6ad-96c0bbafb278',source='33a11b01-7656-4080-bfd7-e5b845837061';
const expected=get('--expected-source-hash');if(!/^[a-f0-9]{32}$/.test(expected))throw Error('Hash de origem inválido.');
const directory=resolve(get('--directory'));
const records=JSON.parse(await readFile(join(directory,'lovable-briefings-backup.json'),'utf8'));
const record=records.find(r=>r.id===source&&r.source_client_id===sourceClient);if(!record)throw Error('Briefing piloto não encontrado no backup auditado.');
const mapping=JSON.parse(await readFile(join(directory,'briefing-client-map.json'),'utf8'));if(mapping[sourceClient]!==client)throw Error('Vínculo do cliente piloto divergente.');
const history=JSON.parse(await readFile(join(directory,'briefing-history-backup.json'),'utf8')).filter(h=>h.briefing_id===source).map(sanitize);
if(history.length!==18||history.some(h=>h.source_client_id!==sourceClient)||new Set(history.map(h=>h.id)).size!==history.length)throw Error('Histórico piloto divergente; audite novamente antes de importar.');
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const sql=`begin;\nset local standard_conforming_strings=on;\ndo $guard$ begin if not exists(select 1 from public.client_legacy_records where agency_id='${agency}' and client_id='${client}' and source_kind='briefings' and source_id='${source}' and md5(payload::text)='${expected}') then raise exception 'Snapshot divergiu da origem auditada; piloto cancelado';end if;end $guard$;\nselect private.import_legacy_briefing('${agency}'::uuid,'${client}'::uuid,'${source}'::uuid,${quote(JSON.stringify(history))}::jsonb) as result;\ncommit;\n`;
await writeFile(resolve(get('--out')),sql,{mode:0o600});
console.log(JSON.stringify({prepared:true,database_writes:0,clients:1,briefings:1,history:history.length,output:resolve(get('--out'))}));
