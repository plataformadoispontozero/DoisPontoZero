import {configurationFromInput,publicStatus,parseGenerationInput,parsePlanningInput,validateEditorialAiPlan,validateGeneratedItems,record,UUID,type AiConfiguration,type GenerationInput,type PlanningInput} from './contract.ts'
import {ProviderFailure,type ClientContext,type ProviderDiagnostic} from './gemini.ts'
export interface Actor{userId:string;canManage:boolean;canGenerate:boolean}
export interface AiDependencies{
 authenticate:(authorization:string,agency:string)=>Promise<Actor|null>
 configuration:(agency:string)=>Promise<AiConfiguration|null>
 save:(agency:string,user:string,config:AiConfiguration)=>Promise<void>
 secureStorageAvailable:()=>boolean
 client:(authorization:string,agency:string,client:string)=>Promise<ClientContext|null>
 reserve:(agency:string,user:string)=>Promise<boolean>
 generate:(config:AiConfiguration,input:GenerationInput,client:ClientContext)=>Promise<unknown>
 plan?:(config:AiConfiguration,input:PlanningInput,client:ClientContext)=>Promise<unknown>
 test:(config:AiConfiguration)=>Promise<unknown>
 log?:(code:string,diagnostic?:ProviderDiagnostic)=>void
}
const origins=new Set(['https://doispontozero.renatodesigner.com.br','https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev'])
const messages:Record<string,string>={authentication_required:'Entre novamente para continuar.',access_denied:'Seu usuário não tem permissão para esta ação.',invalid_request:'Confira os dados da solicitação.',storage_unavailable:'Armazenamento seguro indisponível.',ai_not_configured:'Configure o Gemini e autorize o envio dos dados aprovados antes de gerar.',local_prepared_only:'Ollama preparado. A conexão local ainda não está habilitada para geração.',rate_limited:'Limite diário da agência atingido. Tente no próximo dia UTC.',provider_quota_exceeded:'A cota do Gemini foi atingida. Não houve troca para um modelo ou plano pago.',provider_credentials_rejected:'O Gemini recusou a chave ou o acesso ao modelo. Confira a configuração.',provider_timeout:'O Gemini demorou além do limite. Nenhum calendário foi salvo.',provider_invalid_response:'A IA não retornou um calendário válido. Revise a direção e tente novamente.',provider_request_rejected:'O Gemini recusou os parâmetros desta geração. A equipe técnica pode verificar o código seguro da resposta. Nenhum calendário foi salvo.',provider_unavailable:'O provedor de IA está indisponível. Nenhum calendário foi salvo.',backend_unavailable:'Não foi possível acessar a geração segura.',origin_denied:'Origem não permitida.',method_not_allowed:'Método não permitido.'}
async function readBody(req:Request){if(Number(req.headers.get('content-length')||0)>32768)throw Error('large');const reader=req.body?.getReader();if(!reader)throw Error('empty');let total=0;const chunks:Uint8Array[]=[];while(true){const part=await reader.read();if(part.done)break;total+=part.value.byteLength;if(total>32768){await reader.cancel();throw Error('large')}chunks.push(part.value)}const all=new Uint8Array(total);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length}return JSON.parse(new TextDecoder().decode(all))}
export function createEditorialAiHandler(deps:AiDependencies){return async(req:Request):Promise<Response>=>{
 const origin=req.headers.get('origin')||'',headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};if(origins.has(origin))headers['Access-Control-Allow-Origin']=origin
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});const fail=(code:string,status:number,diagnostic?:ProviderDiagnostic)=>{if(status>=500||diagnostic)deps.log?.(code,diagnostic);return reply({code,error:messages[code]||messages.backend_unavailable},status)}
 if(origin&&!origins.has(origin))return fail('origin_denied',403)
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers})
 if(req.method!=='POST')return fail('method_not_allowed',405)
 const authorization=req.headers.get('authorization')||'';if(!authorization.startsWith('Bearer ')||authorization.length>8192)return fail('authentication_required',401)
 if(!req.headers.get('content-type')?.startsWith('application/json'))return fail('invalid_request',415)
 try{
  let body;try{body=await readBody(req)}catch{return fail('invalid_request',400)}
  if(!record(body)||typeof body.agencyId!=='string'||!UUID.test(body.agencyId)||!['status','save','test','generate','plan'].includes(String(body.action)))return fail('invalid_request',400)
  const actor=await deps.authenticate(authorization,body.agencyId);if(!actor)return fail('authentication_required',401)
  if(body.action==='status'?(!actor.canManage&&!actor.canGenerate):(body.action==='generate'||body.action==='plan')?!actor.canGenerate:!actor.canManage)return fail('access_denied',403)
  if(!deps.secureStorageAvailable())return body.action==='status'?reply(publicStatus(null,false)):fail('storage_unavailable',409)
  const config=await deps.configuration(body.agencyId)
  if(body.action==='status')return reply(publicStatus(config,true))
  if(body.action==='save'){
   const next=configurationFromInput(body,config);if(!next)return fail('invalid_request',400)
   await deps.save(body.agencyId,actor.userId,next);return reply(publicStatus(next,true))
  }
  if(config?.provider==='ollama')return fail('local_prepared_only',409)
  if(!config||config.provider==='none'||!config.apiKey)return fail('ai_not_configured',409)
  if(body.action==='test'){
   if(!await deps.reserve(body.agencyId,actor.userId))return fail('rate_limited',429)
   await deps.test(config);return reply({verified:true,provider:'gemini',model:config.model,requiresReview:true})
  }
  if(!config.allowApprovedData)return fail('ai_not_configured',409)
  if(body.action==='plan'){
   const input=parsePlanningInput(body);if(!input)return fail('invalid_request',400);
   const client=await deps.client(authorization,body.agencyId,input.clientId);if(!client)return fail('access_denied',403);
   if(!await deps.reserve(body.agencyId,actor.userId))return fail('rate_limited',429);
   if(!deps.plan)return fail('backend_unavailable',503);
   const plan=validateEditorialAiPlan(await deps.plan(config,input,client),input);if(!plan)return fail('provider_invalid_response',502);
   return reply({...plan,provider:'gemini',model:config.model,requiresReview:true});
  }
  const input=parseGenerationInput(body);if(!input)return fail('invalid_request',400)
  const client=await deps.client(authorization,body.agencyId,input.clientId);if(!client)return fail('access_denied',403)
  if(!await deps.reserve(body.agencyId,actor.userId))return fail('rate_limited',429)
  let validationReason:string|undefined;
  const generated=validateGeneratedItems(await deps.generate(config,input,client),input,reason=>{validationReason=reason});if(!generated)return fail('provider_invalid_response',502,{upstreamStatus:200,canonicalCode:'UNKNOWN',validationReason,stage:'generation_validation',batchCount:input.count,priorItemCount:input.generatedSoFar?.length||0,formatCounts:input.formatCounts})
  return reply({items:generated,provider:'gemini',model:config.model,requiresReview:true})
 }catch(error){if(error instanceof ProviderFailure)return fail(error.code,error.status,error.diagnostic);return fail('backend_unavailable',503)}
}}
