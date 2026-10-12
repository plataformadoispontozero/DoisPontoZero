// @vitest-environment node
import {describe,it,expect} from 'vitest';
// @ts-expect-error The offline CLI is native ESM JavaScript.
import {plan,sanitize,run} from '../../../scripts/migrate-briefings/audit.mjs';
describe('briefing migration read-only preflight',()=>{
 it('quarantines missing or mismatched clients and identifies duplicates without creating destination records',()=>{
 const records=[{id:'one',source_client_id:'client',payload:{criado_por:'legacy-owner',status:'rascunho'}},{id:'one',source_client_id:'client',payload:{}},{id:'two',source_client_id:'missing',payload:{}}];
 const planned=plan(records,{client:'new-client'},[{source_id:'one',id:'target',source_client_id:'other',payload:{}}]);
 expect(planned.map((r:{outcome:string})=>r.outcome)).toEqual(['client_conflict','duplicate_source','unmatched_client']);
 expect(planned[0].unmapped_users).toEqual(['legacy-owner']);
 });
 it('recognizes unchanged snapshots and refuses automatic overwrites even when the source changed',()=>{
 const payload={status:'completo',criado_em:'2025-03-04',respostas:{number:0,flag:false,nested:['á','🙂']}};
 const records=[{id:'one',source_client_id:'client',payload}];
 expect(plan(records,{client:'new'},[{source_id:'one',source_client_id:'client',payload:{...payload}}])[0].outcome).toBe('skip_unchanged');
 expect(plan(records,{client:'new'},[{source_id:'one',source_client_id:'client',payload:{status:'draft'}}])[0].outcome).toBe('conflict_review');
 expect(plan(records,{client:'new'})[0].source_created_at).toBe('2025-03-04');
 });
 it('removes credentials and binaries recursively while preserving document references and structured values',()=>{
 expect(sanitize({acesso_drive:'private',children:[{token:'secret',copy:'olá',reference:'https://drive.google.com/file/d/x/view',binary:'data:image/png;base64,abc'}],flag:false,number:0})).toEqual({children:[{copy:'olá',reference:'https://drive.google.com/file/d/x/view',binary:'[REDACTED]'}],flag:false,number:0});
 });
 it('has no full migration mode before the audit and pilot are approved',async()=>{
 await expect(run('migrate','/tmp')).rejects.toThrow(/indisponível/);
 });
});
