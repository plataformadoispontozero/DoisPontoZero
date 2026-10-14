import {createClient} from '@supabase/supabase-js'
import {RoomServiceClient} from 'livekit-server-sdk'
import {configurationAvailable} from '../_shared/providerConfig.ts'
import {storedLivekitConfiguration,saveLivekitConfiguration,safeLivekitUrl} from '../_shared/livekitConfig.ts'
const env=(k:string)=>Deno.env.get(k)||''
const origins=new Set(['https://doispontozero.renatodesigner.com.br','https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev'])
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};if(origins.has(origin))headers['Access-Control-Allow-Origin']=origin
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})
 if(origin&&!origins.has(origin))return reply({error:'Origem não permitida.'},403)
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply({error:'Método inválido.'},405)
 try{
  const authorization=req.headers.get('authorization')||'';if(!authorization.startsWith('Bearer '))return reply({error:'Sessão necessária.'},401)
  const client=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:authorization}},auth:{persistSession:false}})
  const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sessão inválida.'},401)
  const raw=await req.text();if(new TextEncoder().encode(raw).length>8192)return reply({error:'Solicitação inválida.'},400)
  let body;try{body=JSON.parse(raw)}catch{return reply({error:'Solicitação inválida.'},400)}
  if(!body||typeof body.agencyId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.agencyId)||!['status','save','test'].includes(body.action))return reply({error:'Solicitação inválida.'},400)
  const permission=await client.rpc('has_agency_permission',{p_agency_id:body.agencyId,p_permission_key:'settings.edit'})
  const member=await client.from('agency_members').select('roles(name)').eq('agency_id',body.agencyId).eq('user_id',user.id).eq('status','active').maybeSingle()
  const role=Array.isArray(member.data?.roles)?member.data.roles[0]?.name:(member.data?.roles as unknown as {name:string})?.name
  if(permission.error||permission.data!==true||member.error||!['OWNER','ADMIN'].includes(role))return reply({error:'Somente administrador pode configurar o LiveKit.'},403)
  const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}})
  const previous=await storedLivekitConfiguration(admin,body.agencyId)
  if(body.action==='status')return reply({configured:!!previous,secureStorageAvailable:configurationAvailable(),url:previous?.url||''})
  if(!configurationAvailable())return reply({error:'Armazenamento criptografado indisponível.'},409)
  if(body.action==='save'){
   const url=typeof body.url==='string'?body.url.trim():'';const apiKey=typeof body.apiKey==='string'&&body.apiKey.trim()?body.apiKey.trim():previous?.apiKey||'';const apiSecret=typeof body.apiSecret==='string'&&body.apiSecret?body.apiSecret:previous?.apiSecret||''
   if(!safeLivekitUrl(url)||apiKey.length<3||apiKey.length>256||apiSecret.length<32||apiSecret.length>4096)return reply({error:'Confira a URL wss:// do LiveKit Cloud, a API Key e o API Secret.'},400)
   if(previous&&previous.url!==url&&(!body.apiKey||!body.apiSecret))return reply({error:'Informe as duas chaves ao alterar a URL do projeto.'},400)
   await saveLivekitConfiguration(admin,body.agencyId,{url,apiKey,apiSecret});return reply({configured:true,url})
  }
  if(!previous)return reply({error:'Salve a configuração antes de testar.'},409)
  if(!safeLivekitUrl(previous.url))return reply({error:'URL do projeto não autorizada.'},400)
  try{const service=new RoomServiceClient(previous.url.replace(/^wss:/,'https:'),previous.apiKey,previous.apiSecret);await service.listRooms([`office_${body.agencyId}_configuration-check`]);return reply({verified:true,message:'Conexão e credenciais validadas no LiveKit. Nenhuma sala foi criada.'})}catch{return reply({error:'Não foi possível validar a conexão. Confira a URL e as chaves do projeto.'},502)}
 }catch{return reply({error:'Não foi possível acessar a configuração segura.'},503)}
})
