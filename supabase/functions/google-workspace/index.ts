import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
import { providerConfiguration, type ProviderConfiguration } from '../_shared/providerConfig.ts'
import { folderIdFromUrl, validateDriveUpload, isGoogleUploadUrl } from './drive.ts'
import { corsHeaders } from 'npm:@supabase/supabase-js@2.117.3/cors'
const env=(key:string)=>Deno.env.get(key)||''
const origin=env('GOOGLE_WORKSPACE_APP_ORIGIN')||'https://doispontozero.renatodesigner.com.br'
const redirect=env('GOOGLE_WORKSPACE_REDIRECT_URI')
const scopes=['openid','email','https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/calendar.events.readonly']
const configured=()=>!!(env('GOOGLE_WORKSPACE_TOKEN_KEY')||env('INTEGRATION_CONFIG_KEY'))
const base64=(a:Uint8Array)=>btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const nonce=()=>base64(crypto.getRandomValues(new Uint8Array(32)))
const hash=async(s:string)=>base64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
async function key(){const raw=Uint8Array.from(atob(env('GOOGLE_WORKSPACE_TOKEN_KEY')||env('INTEGRATION_CONFIG_KEY')),c=>c.charCodeAt(0));if(raw.length!==32)throw Error('Configuração inválida.');return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt'])}
async function seal(value:unknown){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),new TextEncoder().encode(JSON.stringify(value)));return JSON.stringify([btoa(String.fromCharCode(...iv)),btoa(String.fromCharCode(...new Uint8Array(data)))])}
async function open(value:string){const [iv,data]=JSON.parse(value).map((s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)));return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(),data)))}
Deno.serve(async(req:Request)=>{
 const requestOrigin=req.headers.get('origin')||''
 const allowedOrigins=new Set([origin,'tauri://localhost','https://tauri.localhost','http://tauri.localhost'])
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowedOrigins.has(requestOrigin)?requestOrigin:origin,'Access-Control-Allow-Headers':corsHeaders['Access-Control-Allow-Headers'],'Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'}
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers})
 const back=(status:string)=>new Response(null,{status:303,headers:{Location:`${origin}/settings/integrations/google?google=${status}`,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers})
 if(requestOrigin&&!allowedOrigins.has(requestOrigin))return reply({error:'Origem não permitida.'},403)
 const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}})
 async function secret(action:string,agency?:string,user?:string,h?:string,ciphertext?:string){const {data,error}=await admin.rpc('google_workspace_secret',{p_action:action,p_agency:agency,p_user:user,p_hash:h,p_ciphertext:ciphertext});if(error)throw Error('Armazenamento indisponível.');return data}
 let requestConfig:ProviderConfiguration|null=null
 async function tokens(params:Record<string,string>){const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,client_id:requestConfig?.clientId||env('GOOGLE_WORKSPACE_CLIENT_ID'),client_secret:requestConfig?.clientSecret||env('GOOGLE_WORKSPACE_CLIENT_SECRET')})});if(!r.ok)throw Error('Autorização Google não concluída.');return r.json()}
 try {
  if(req.method==='GET'){
   if(!configured())return back('configuration_required')
   const url=new URL(req.url),state=url.searchParams.get('state')||'';if(state.length!==43)return back('invalid_state')
   const stored=await secret('consume',undefined,undefined,await hash(state))
   requestConfig=await providerConfiguration(admin,stored.agency,'google');if(!requestConfig)return back('configuration_required')
   // Recheck membership/permission before persisting any credential after OAuth.
   const member=await admin.from('agency_members').select('id').eq('agency_id',stored.agency).eq('user_id',stored.user).eq('status','active').maybeSingle()
   if(member.error||!member.data)return back('access_denied')
   if(url.searchParams.has('error'))return back('cancelled')
   const code=url.searchParams.get('code');if(!code)return back('invalid_code')
   const {verifier}=await open(stored.ciphertext)
   const token=await tokens({grant_type:'authorization_code',code,redirect_uri:requestConfig?.redirectUri||redirect,code_verifier:verifier})
   const granted=(token.scope||'').split(' ');if(!scopes.filter(s=>s.startsWith('https:')).every(s=>granted.includes(s)))return back('missing_permissions')
   const accountResponse=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${token.access_token}`}});if(!accountResponse.ok)throw Error('Conta não verificada.')
   const account=await accountResponse.json();if(!account.sub||!account.email_verified)throw Error('Conta não verificada.')
   if(!token.refresh_token)throw Error('Autorização offline necessária.')
   await secret('save',stored.agency,stored.user,undefined,await seal({...token,expires_at:Date.now()+token.expires_in*1000,account:{id:account.sub,email:account.email}}))
   return back('connected')
  }
  if(req.method!=='POST')return reply({error:'Método inválido.'},405)
  const authorization=req.headers.get('authorization')||''
  if(!authorization.startsWith('Bearer '))return reply({error:'Sessão necessária.'},401)
  const caller=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error}=await caller.auth.getUser();if(error||!user)return reply({error:'Sessão inválida.'},401)
  const raw=await req.text();if(raw.length>4096)return reply({error:'Solicitação inválida.'},400)
  const body=JSON.parse(raw),agency=body.agencyId
  if(typeof agency!=='string'||!/^[0-9a-f-]{36}$/i.test(agency))return reply({error:'Agência inválida.'},400)
  const productionAction=['client-drive-list','client-drive-upload-start','client-drive-create-folder'].includes(body.action)
  const can=async(permission:string)=>{const r=await caller.rpc('has_agency_permission',{p_agency_id:agency,p_permission_key:permission});return !r.error&&r.data===true}
  if(productionAction){
   if(!await can('clients.view')||(body.action==='client-drive-upload-start'&&!await can('tasks.edit')))return reply({error:'Permissão para acessar este cliente e produzir materiais necessária.'},403)
  }else{
   const access=await caller.rpc('google_workspace_permission',{p_agency:agency});if(access.error||access.data!==true)return reply({error:'Permissão de editar configurações necessária.'},403)
  }
  requestConfig=await providerConfiguration(admin,agency,'google')
  if(!configured()||!requestConfig)return productionAction?reply({error:'Configure e autorize a integração Google antes de acessar os materiais.'},409):reply({configured:false,connected:false})
  if(body.action==='start'){
   const state=nonce(),verifier=nonce();await secret('state',agency,user.id,await hash(state),await seal({verifier}))
   const params=new URLSearchParams({client_id:requestConfig.clientId,redirect_uri:requestConfig?.redirectUri||redirect,response_type:'code',scope:scopes.join(' '),access_type:'offline',prompt:'consent',state,code_challenge:await hash(verifier),code_challenge_method:'S256',include_granted_scopes:'true'})
   return reply({url:`https://accounts.google.com/o/oauth2/v2/auth?${params}`})
  }
  const stored=await secret('read',agency,user.id)
  if(!stored.ciphertext)return productionAction?reply({error:'Sua conta Google ainda não está conectada. Solicite ao administrador a conexão de trabalho.'},409):reply({configured:true,connected:false})
  let token=await open(stored.ciphertext)
  if(body.action==='status')return reply({configured:true,connected:true,email:token.account.email,scopes:token.scope.split(' ')})
  if(body.action==='disconnect'){
   const revoke=await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:token.refresh_token})})
   if(!revoke.ok)return reply({error:'Não foi possível revogar no Google. Tente novamente.'},502)
   await secret('delete',agency,user.id);return reply({configured:true,connected:false})
  }
  if(token.expires_at<Date.now()+60000){const fresh=await tokens({grant_type:'refresh_token',refresh_token:token.refresh_token});token={...token,...fresh,refresh_token:token.refresh_token,expires_at:Date.now()+fresh.expires_in*1000};await secret('save',agency,user.id,undefined,await seal(token))}
  if(productionAction){
   if(typeof body.clientId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.clientId))return reply({error:'Cliente inválido.'},400)
   // The authenticated client applies tenant RLS; never accept an arbitrary folder ID from the browser.
   const client=await caller.from('clients').select('id,profile').eq('agency_id',agency).eq('id',body.clientId).maybeSingle()
   if(client.error||!client.data)return reply({error:'Cliente não encontrado nesta agência.'},404)
   if(body.action==='client-drive-create-folder'){
    if(!await can('clients.edit'))return reply({error:'Permissão de editar cliente necessária.'},403)
    if(client.data.profile?.drive_url)return reply({error:'Este cliente já possui uma pasta vinculada. Revise o cadastro antes de criar outra.'},409)
    const created=await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink',{method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({name:`Dois.Zero · Cliente ${client.data.id}`,mimeType:'application/vnd.google-apps.folder',appProperties:{agencyId:agency,clientId:body.clientId}})})
    if(!created.ok)return reply({error:'Não foi possível criar a pasta no Google Drive.'},502)
    const folderData=await created.json(),driveUrl=`https://drive.google.com/drive/folders/${folderData.id}`
    const saved=await caller.from('clients').update({profile:{...client.data.profile,drive_url:driveUrl}}).eq('agency_id',agency).eq('id',body.clientId).select('id').maybeSingle()
    if(saved.error||!saved.data){await fetch(`https://www.googleapis.com/drive/v3/files/${folderData.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token.access_token}`}});return reply({error:'Não foi possível vincular a pasta ao cliente.'},409)}
    return reply({folderId:folderData.id,driveUrl})
   }
   const folder=folderIdFromUrl(client.data.profile?.drive_url)
   if(!folder)return reply({error:'Cadastre o link da pasta do Drive no perfil deste cliente.'},409)
   const googleHeaders={Authorization:`Bearer ${token.access_token}`}
   const check=await fetch(`https://www.googleapis.com/drive/v3/files/${folder}?fields=id,mimeType,trashed,capabilities(canAddChildren)&supportsAllDrives=true`,{headers:googleHeaders})
   if(!check.ok)return reply({error:'Esta pasta não está autorizada para o aplicativo Google ou para sua conta. O link da pasta sozinho não concede acesso. Selecione a pasta pelo aplicativo no Google ou vincule uma pasta criada por ele.'},403)
   const metadata=await check.json()
   if(metadata.mimeType!=='application/vnd.google-apps.folder'||metadata.trashed)return reply({error:'A pasta do cliente não está disponível.'},409)
   if(body.action==='client-drive-upload-start'){
    const invalid=validateDriveUpload(body);if(invalid)return reply({error:invalid},400)
    if(!metadata.capabilities?.canAddChildren)return reply({error:'Sua conta Google não pode enviar arquivos a esta pasta.'},403)
    const response=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,webViewLink,modifiedTime,size',{method:'POST',headers:{...googleHeaders,'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':body.mimeType,'X-Upload-Content-Length':String(body.size)},body:JSON.stringify({name:body.name.trim(),parents:[folder],appProperties:{agencyId:agency,clientId:body.clientId}})})
    const uploadUrl=response.headers.get('Location')||''
    if(!response.ok||!isGoogleUploadUrl(uploadUrl))return reply({error:'Não foi possível iniciar o envio no Google Drive.'},502)
    // The session URL is a short-lived upload capability, never an OAuth access token. Do not persist or log it.
    return reply({uploadUrl,expiresInSeconds:3600})
   }
   const page=typeof body.pageToken==='string'&&body.pageToken.length<1000?body.pageToken:''
   const params=new URLSearchParams({pageSize:'100',fields:'nextPageToken,files(id,name,mimeType,webViewLink,modifiedTime,size)',q:`'${folder}' in parents and trashed=false`,orderBy:'modifiedTime desc',supportsAllDrives:'true',includeItemsFromAllDrives:'true',...(page?{pageToken:page}:{})})
   const result=await fetch(`https://www.googleapis.com/drive/v3/files?${params}`,{headers:googleHeaders})
   if(!result.ok)return reply({error:'Não foi possível consultar a pasta do cliente.'},502)
   const data=await result.json();return reply({files:data.files||[],nextPageToken:data.nextPageToken||null,folderId:folder})
  }
  let target=''
  if(body.action==='drive-list')target='https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,webViewLink,modifiedTime)&q=trashed%3Dfalse'
  else if(body.action==='calendar-list') {const start=new Date().toISOString(),end=new Date(Date.now()+30*86400000).toISOString();target=`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&maxResults=100&orderBy=startTime&timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}`}
  else return reply({error:'Operação inválida.'},400)
  const response=await fetch(target,{headers:{Authorization:`Bearer ${token.access_token}`}})
  if(!response.ok)return reply({error:'Google não disponibilizou esses dados. Confira a autorização e as APIs habilitadas.'},502)
  const data=await response.json();return reply(body.action==='drive-list'?{files:data.files||[]}:{events:data.items||[]})
 }catch{return req.method==='GET'?back('failed'):reply({error:'Integração indisponível. Confira a configuração e tente novamente.'},400)}
})
