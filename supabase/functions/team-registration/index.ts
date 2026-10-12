import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
const site='https://doispontozero.renatodesigner.com.br'
const origins=new Set([site,'https://doispontozero.marketingrenatodesigner.workers.dev'])
const professions=new Set(['designer','social_media','videomaker','paid_traffic','manager'])
const targetAgency='a0f00e64-e8ba-44e5-b0cf-2ad7adb44211'
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('')}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||''
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origins.has(origin)?origin:site,'Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'}
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})
 if(origin&&!origins.has(origin))return reply({error:'Origem não permitida.'},403)
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers})
 if(req.method!=='POST')return reply({error:'Método não permitido.'},405)
 const url=Deno.env.get('SUPABASE_URL')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})
 try{
  if(Number(req.headers.get('content-length')||0)>4096)return reply({error:'Solicitação muito grande.'},413)
  const reader=req.body?.getReader();if(!reader)return reply({error:'Solicitação inválida.'},400)
  const chunks:Uint8Array[]=[];let length=0
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>4096){await reader.cancel();return reply({error:'Solicitação muito grande.'},413)}chunks.push(part.value)}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  const raw=new TextDecoder().decode(bytes)
  const body=JSON.parse(raw)
  if(body.action==='register'){
   const email=typeof body.email==='string'?body.email.trim().toLowerCase():''
   const name=typeof body.name==='string'?body.name.trim():''
   if(body.honey)return reply({submitted:true})
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||name.length<2||name.length>120||!professions.has(body.profession)||typeof body.password!=='string'||body.password.length<10||body.password.length>128)return reply({error:'Confira nome, e-mail, função e senha com pelo menos 10 caracteres.'},400)
   // Gateway IP provenance is not guaranteed here; use a shared conservative bucket.
   const ip='public-registration'
   const reserved=await admin.rpc('reserve_team_registration',{p_ip_hash:await hash(ip+secret),p_email_hash:await hash(email+secret)})
   if(reserved.error)return reply({error:'Cadastro indisponível. Tente mais tarde.'},503)
   if(!reserved.data)return reply({error:'Muitas solicitações. Aguarde antes de tentar novamente.'},429)
   const created=await admin.auth.admin.createUser({email,password:body.password,email_confirm:false,user_metadata:{full_name:name}})
   // Do not expose account existence or replace a password belonging to an existing user.
   if(created.error){if(created.error.code==='email_exists'||created.error.code==='user_already_exists')return reply({submitted:true});return reply({error:'Não foi possível criar a solicitação. Confira os dados ou procure o administrador.'},400)}
   const inserted=await admin.from('agency_registration_requests').insert({agency_id:targetAgency,user_id:created.data.user.id,email,full_name:name,profession:body.profession})
   if(inserted.error){await admin.auth.admin.deleteUser(created.data.user.id);return reply({error:'Não foi possível registrar o pedido. Tente novamente.'},503)}
   return reply({submitted:true})
  }
  if(!['approve','reject'].includes(body.action))return reply({error:'Ação inválida.'},400)
  const authorization=req.headers.get('authorization')||''
  if(!authorization.startsWith('Bearer '))return reply({error:'Entre para revisar cadastros.'},401)
  const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error}=await caller.auth.getUser()
  if(error||!user)return reply({error:'Sessão inválida.'},401)
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if(!uuid.test(body.requestId)||!uuid.test(body.agencyId)||(body.action==='approve'&&(!uuid.test(body.roleId)||body.identityConfirmed!==true)))return reply({error:'Confira o papel e confirme a identidade do membro antes de aprovar.'},400)
  const args={p_agency:body.agencyId,p_id:body.requestId,p_actor:user.id,p_decision:body.action,p_role:body.action==='approve'?body.roleId:null}
  const prepared=await admin.rpc('prepare_team_registration_review',args)
  if(prepared.error)return reply({error:prepared.error.message},403)
  if(body.action==='approve'){
   // Manual review substitutes email confirmation for this account only. No session/token is returned.
   const released=await admin.auth.admin.updateUserById(prepared.data.userId,{email_confirm:true})
   if(released.error)return reply({error:'Não foi possível liberar a conta. Nenhum acesso foi concedido.'},503)
  }
  const completed=await admin.rpc('finalize_team_registration_review',args)
  if(completed.error)return reply({error:completed.error.message},409)
  return reply({reviewed:true})
 }catch{return reply({error:'Não foi possível concluir a solicitação.'},400)}
})
