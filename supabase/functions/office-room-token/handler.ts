export interface VoiceContext{agency_id:string;user_id:string;room_id:string;room_name:string;room_type?:'team'|'private_call'}
export interface TokenConfiguration{url:string;apiKey:string;apiSecret:string}
export interface TokenDependencies{
 authenticate:(authorization:string)=>Promise<string|null>
 authorize:(authorization:string,room:string,consume:boolean)=>Promise<{context:VoiceContext|null;error?:'denied'|'rate_limited'|'unavailable'}>
 configuration:(context:VoiceContext)=>TokenConfiguration|null|Promise<TokenConfiguration|null>
 issue:(context:VoiceContext,configuration:TokenConfiguration)=>Promise<string>
 log?:(code:string)=>void
}
const homologationOrigin='https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev'
const origins=new Set(['https://doispontozero.renatodesigner.com.br',homologationOrigin])
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function validConfiguration(config:TokenConfiguration|null):config is TokenConfiguration{
 if(!config||!config.apiKey||config.apiSecret.length<32)return false
 try{const url=new URL(config.url);return url.protocol==='wss:'&&!!url.hostname&&!url.username&&!url.password&&!url.search&&!url.hash}catch{return false}
}
export function createTokenHandler(deps:TokenDependencies){return async(req:Request):Promise<Response>=>{
 const origin=req.headers.get('origin')||'';const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}
 if(origins.has(origin))headers['Access-Control-Allow-Origin']=origin
 const reply=(code:string,status:number)=>{if(status>=500)deps.log?.(code);return new Response(JSON.stringify({error:code}),{status,headers})}
 if(origin&&!origins.has(origin))return reply('origin_denied',403)
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers})
 if(req.method!=='POST')return reply('method_not_allowed',405)
 const authorization=req.headers.get('authorization')||''
 if(!authorization.startsWith('Bearer ')||authorization.length>8192)return reply('authentication_required',401)
 try{
  const user=await deps.authenticate(authorization);if(!user)return reply('invalid_session',401)
  if(!req.headers.get('content-type')?.startsWith('application/json'))return reply('json_required',415)
  const raw=await req.text();if(new TextEncoder().encode(raw).length>2048)return reply('invalid_request',400)
  let body:unknown;try{body=JSON.parse(raw)}catch{return reply('invalid_request',400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply('invalid_request',400)
  const input=body as Record<string,unknown>
  if(Object.keys(input).some(k=>k!=='roomId')||typeof input.roomId!=='string'||!uuid.test(input.roomId))return reply('invalid_room',400)
  const first=await deps.authorize(authorization,input.roomId,false)
  if(first.error==='unavailable')return reply('backend_unavailable',503)
  if(!first.context||first.context.user_id!==user)return reply('room_denied',403)
  const config=await deps.configuration(first.context);if(!validConfiguration(config))return reply('livekit_not_configured',503)
  // Revalidate immediately before signing and consume the atomic per-user/agency budget.
  const final=await deps.authorize(authorization,input.roomId,true)
  if(final.error==='rate_limited')return new Response(JSON.stringify({error:'rate_limited'}),{status:429,headers:{...headers,'Retry-After':'60'}})
  if(final.error==='unavailable')return reply('backend_unavailable',503)
  const context=final.context
  const validName=context?.room_type==='private_call'?context.room_name===`office_call_${context.agency_id}_${context.room_id}`:context?.room_type==='team'||!context?.room_type?context?.room_name===`office_${context?.agency_id}_${context?.room_id}`:false
  if(!context||context.user_id!==user||context.room_id!==input.roomId||!uuid.test(context.agency_id)||!validName)return reply('room_denied',403)
  // Keep authenticated identities stable; only the review environment gets its own room.
  // Apply after validating the database-owned namespace, never from a body parameter.
  const signingContext=origin===homologationOrigin?{...context,room_name:`homologacao_${context.room_name}`}:context
  const token=await deps.issue(signingContext,config)
  return new Response(JSON.stringify({token,serverUrl:config.url,expiresIn:120}),{status:200,headers})
 }catch{return reply('backend_unavailable',503)}
}}
