import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
const site='https://doispontozero.renatodesigner.com.br'
const origins=new Set([site,'https://doispontozero.marketingrenatodesigner.workers.dev'])
Deno.serve(async (req:Request)=>{
 const origin=req.headers.get('origin')||''
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origins.has(origin)?origin:site,'Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'}
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})
 if(origin && !origins.has(origin)) return reply({error:'Origem não permitida.'},403)
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers})
 if(req.method!=='POST') return reply({error:'Método não permitido.'},405)
 const authorization=req.headers.get('authorization')||''
 if(!authorization.startsWith('Bearer ')) return reply({error:'Entre na plataforma para convidar.'},401)
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}})
 const {data:{user},error:sessionError}=await caller.auth.getUser()
 if(sessionError||!user) return reply({error:'Sessão inválida.'},401)
 let invitationId:string|undefined
 try {
  if(Number(req.headers.get('content-length')||0)>4096) return reply({error:'Solicitação inválida.'},400)
  const body=await req.json(), email=typeof body.email==='string'?body.email.trim().toLowerCase():''
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if(!uuid.test(body.agencyId)||!uuid.test(body.roleId)||!email||email.length>254) return reply({error:'Confira e-mail e papel.'},400)
  const created=await caller.rpc('create_team_invitation',{p_agency:body.agencyId,p_email:email,p_role:body.roleId})
  if(created.error||!created.data) return reply({error:created.error?.message||'Não foi possível criar o convite.'},400)
  invitationId=created.data
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})
  const target=await admin.rpc('team_invitation_auth_target',{p_email:email})
  if(target.error) throw Error('Falha ao verificar destinatário.')
  const existingAccount=!!target.data && !(target.data.invited && !target.data.confirmed)
  const fragment=new URLSearchParams({id:invitationId!})
  const inviteUrl=site+'/accept-invitation#'+fragment.toString()
  if(!existingAccount) {
   // Auth sends the email itself. The invitation ID survives the verification redirect.
   const sent=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:site+'/accept-invitation?id='+encodeURIComponent(invitationId!)+'&setup=1'})
   if(sent.error) {
    const code=sent.error.code||''
    if(code==='over_email_send_rate_limit') throw Error('Limite de envio de e-mails atingido. Aguarde ou configure SMTP no Supabase.')
    if(code==='email_address_not_authorized') throw Error('O Supabase ainda não permite enviar para este endereço. Configure SMTP para convidar a equipe.')
    throw Error('Não foi possível enviar o e-mail de convite: '+sent.error.message)
   }
  }
  // Existing accounts authenticate themselves; never give their login tokens to the inviter.
  return reply({invitationId,inviteUrl,existingAccount,emailSent:!existingAccount})
 } catch(error) {
  if(invitationId) await caller.rpc('revoke_team_invitation',{p_id:invitationId,p_agency:(await caller.from('agency_invitations').select('agency_id').eq('id',invitationId).single()).data?.agency_id})
  return reply({error:error instanceof Error?error.message:'Não foi possível preparar o convite.'},400)
 }
})
