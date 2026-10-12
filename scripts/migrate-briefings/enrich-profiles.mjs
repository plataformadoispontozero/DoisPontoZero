import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
for(const k of ['--backup','--mapping','--out'])if(!args.includes(k))throw Error(`Informe ${k}`);
const backup=JSON.parse(await readFile(resolve(get('--backup')),'utf8'));
const map=JSON.parse(await readFile(resolve(get('--mapping')),'utf8'));
if(backup.clientes.length!==29||Object.keys(map).length!==29)throw Error('Mapa auditado divergente');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const fields={nicho:'niche',cidade:'city',instagram:'instagram',plano:'plan',ticket_medio:'average_ticket',quantidade_conteudos:'monthly_content_count',publico_alvo:'target_audience',faixa_etaria:'age_range',genero:'audience_gender',tom_comunicacao:'tone',diferencial:'differential',estrutura:'structure',objetivo_mes:'monthly_objective',datas_especiais:'special_dates',data_renovacao:'renewal_date'};
const fallback={persona_descricao:'target_audience',faixa_etaria:'age_range',genero_predominante:'audience_gender',tom_de_voz:'tone',diferenciais:'differential',diferenciais_vs_concorrentes:'positioning',objetivo_principal:'monthly_objective'};
let sql='begin;\nset local standard_conforming_strings=on;\n';
for(const c of backup.clientes){
 const id=map[c.id];if(!id)throw Error('Cliente sem vínculo UUID');
 const profile={};for(const [a,b]of Object.entries(fields))if(c[a]!=null&&c[a]!=='')profile[b]=c[a];
 for(const [a,b]of Object.entries(fallback))if(profile[b]==null&&c.briefing?.[a]!=null&&c.briefing[a]!=='')profile[b]=c.briefing[a];
 if(c.drive_folder_id&&/^[a-zA-Z0-9_-]{5,200}$/.test(c.drive_folder_id))profile.drive_url=`https://drive.google.com/drive/folders/${c.drive_folder_id}`;
 for(const [k,v]of Object.entries(profile))if(typeof v==='string'&&v.length>4000)delete profile[k];
 sql+=`select private.enrich_legacy_client('a0f00e64-e8ba-44e5-b0cf-2ad7adb44211','${id}','${c.id}',${quote(JSON.stringify(profile))}::jsonb) as result;\n`;
}
sql+='commit;\n';await writeFile(resolve(get('--out')),sql,{mode:0o600});
console.log(JSON.stringify({prepared:true,clients:29,database_writes:0,policy:'fill-empty-preserve-local-and-audit-conflicts',output:resolve(get('--out'))}));
