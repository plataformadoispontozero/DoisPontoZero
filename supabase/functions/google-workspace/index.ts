import {presentationVideo} from './presentationVideo.ts'
import {authorizePresentationMedia} from './presentationMediaContext.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
import { providerConfiguration, type ProviderConfiguration } from '../_shared/providerConfig.ts'
import { folderIdFromUrl, validateDriveUpload, isGoogleUploadUrl, isFolderDescendant } from './drive.ts'
import {discoverClientDriveDocuments,readClientDriveDocument,DriveDocumentUnavailableError} from './documents.ts'
import {presentationMedia} from './presentationMedia.ts'
import {verifiedPresentationFiles} from './presentationDrive.ts'
import {chatDriveFile,chatDriveDownload} from './chatDrive.ts'
import {handleTaskDrive} from './taskDrive.ts'
import { corsHeaders } from 'npm:@supabase/supabase-js@2.117.3/cors'
const env=(key:string)=>Deno.env.get(key)||''
const origin=env('GOOGLE_WORKSPACE_APP_ORIGIN')||'https://doispontozero.renatodesigner.com.br'
const redirect=env('GOOGLE_WORKSPACE_REDIRECT_URI')
const scopes=['openid','email','https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive.readonly','https://www.googleapis.com/auth/calendar.events.readonly']
const configured=()=>!!(env('GOOGLE_WORKSPACE_TOKEN_KEY')||env('INTEGRATION_CONFIG_KEY'))
const base64=(a:Uint8Array)=>btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const nonce=()=>base64(crypto.getRandomValues(new Uint8Array(32)))
const hash=async(s:string)=>base64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
async function key(){const raw=Uint8Array.from(atob(env('GOOGLE_WORKSPACE_TOKEN_KEY')||env('INTEGRATION_CONFIG_KEY')),c=>c.charCodeAt(0));if(raw.length!==32)throw Error('Configuração inválida.');return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt'])}
async function seal(value:unknown){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),new TextEncoder().encode(JSON.stringify(value)));return JSON.stringify([btoa(String.fromCharCode(...iv)),btoa(String.fromCharCode(...new Uint8Array(data)))])}
async function open(value:string){const [iv,data]=JSON.parse(value).map((s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)));return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(),data)))}
Deno.serve(async(req:Request)=>{
 const requestOrigin=req.headers.get('origin')||''
 const allowedOrigins=new Set([origin,'https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev','tauri://localhost','https://tauri.localhost','http://tauri.localhost'])
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowedOrigins.has(requestOrigin)?requestOrigin:origin,'Access-Control-Allow-Headers':corsHeaders['Access-Control-Allow-Headers']+', range','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Vary':'Origin'}
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers})
 const back=(status:string)=>new Response(null,{status:303,headers:{Location:`${origin}/settings/integrations/google?google=${status}`,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers})
 if(requestOrigin&&!allowedOrigins.has(requestOrigin))return reply({error:'Origem não permitida.'},403)
 const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}})
 async function connection(action:string,agency:string,user?:string){const r=await admin.rpc('google_workspace_connection',{p_action:action,p_agency:agency,p_user:user});if(r.error)throw Error('Conexão central indisponível.');return r.data}
 async function secret(action:string,agency?:string,user?:string,h?:string,ciphertext?:string){const {data,error}=await admin.rpc('google_workspace_secret',{p_action:action,p_agency:agency,p_user:user,p_hash:h,p_ciphertext:ciphertext});if(error)throw Error('Armazenamento indisponível.');return data}
 let requestConfig:ProviderConfiguration|null=null
 async function tokens(params:Record<string,string>){const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,client_id:requestConfig?.clientId||env('GOOGLE_WORKSPACE_CLIENT_ID'),client_secret:requestConfig?.clientSecret||env('GOOGLE_WORKSPACE_CLIENT_SECRET')})});if(!r.ok)throw Error('Autorização Google não concluída.');return r.json()}
 try {
  const mediaDeps={
    authorize:(request:Request,input:{assetId:string;publicToken?:string})=>authorizePresentationMedia(request,input,{admin,member:authorization=>createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}})}),
    accessToken:async (agency:string)=>{
     requestConfig=await providerConfiguration(admin,agency,'google');if(!configured()||!requestConfig)throw Error('unavailable')
     const central=await connection('read',agency);if(!central.user)throw Error('unavailable')
     const stored=await secret('read',agency,central.user);if(!stored.ciphertext)throw Error('unavailable')
     let token=await open(stored.ciphertext)
     if(token.expires_at<Date.now()+60000){const fresh=await tokens({grant_type:'refresh_token',refresh_token:token.refresh_token});token={...token,...fresh,refresh_token:token.refresh_token,expires_at:Date.now()+fresh.expires_in*1000};await secret('save',agency,central.user,undefined,await seal(token))}
     return token.access_token
    }
   }
  if(req.method==='GET'&&new URL(req.url).searchParams.has('media')){
   const raw=new URL(req.url).searchParams.get('media')||'';if(raw.length>12000||!/^[A-Za-z0-9_-]+$/.test(raw))return reply({error:'Link inválido.'},400)
   const ticket=await open(new TextDecoder().decode(Uint8Array.from(atob(raw.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))))
   if(!ticket.expires||ticket.expires<Date.now())return reply({error:'Link expirado.'},403)
   const authorizedRequest=new Request(req,{headers:{...Object.fromEntries(req.headers),authorization:ticket.authorization||''}})
   return presentationVideo(authorizedRequest,{assetId:ticket.assetId,publicToken:ticket.publicToken},headers,mediaDeps)
  }
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
   const connected=await admin.rpc('google_workspace_connect',{p_agency:stored.agency,p_user:stored.user,p_ciphertext:await seal({...token,expires_at:Date.now()+token.expires_in*1000,account:{id:account.sub,email:account.email}})})
   if(connected.error){await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:token.access_token})});return back('access_denied')}
   return back('connected')
  }
  if(req.method==='POST'){
   if(Number(req.headers.get('content-length')||0)>65536)return reply({error:'Solicitação inválida.'},400)
   const reader=req.clone().body?.getReader();let previewRaw='',previewSize=0;const decoder=new TextDecoder()
   if(reader)while(true){const part=await reader.read();if(part.done)break;previewSize+=part.value.byteLength;if(previewSize>65536){void reader.cancel().catch(()=>{});return reply({error:'Solicitação inválida.'},400)}previewRaw+=decoder.decode(part.value,{stream:true})}
   previewRaw+=decoder.decode();let previewBody:any=null;try{previewBody=JSON.parse(previewRaw)}catch{/* Existing authenticated request validation handles invalid JSON. */}
   if(previewBody?.action==='presentation-media')return presentationMedia(req,previewBody,headers,mediaDeps)
   if(previewBody?.action==='presentation-video-ticket'){
    if(typeof previewBody.assetId!=='string'||!/^[0-9a-f-]{36}$/i.test(previewBody.assetId)||('publicToken'in previewBody&&(typeof previewBody.publicToken!=='string'||previewBody.publicToken.length>512)))return reply({error:'Material inválido.'},400)
    const input={assetId:previewBody.assetId,...(previewBody.publicToken?{publicToken:previewBody.publicToken}:{})}
    if(!await mediaDeps.authorize(req,input))return reply({error:'Acesso não autorizado.'},403)
    const ticket=base64(new TextEncoder().encode(await seal({...input,authorization:input.publicToken?'':req.headers.get('authorization'),expires:Date.now()+15*60000})))
    return reply({url:`${env('SUPABASE_URL')}/functions/v1/google-workspace?media=${ticket}`})
   }
  }
  if(req.method!=='POST')return reply({error:'Método inválido.'},405)
  const authorization=req.headers.get('authorization')||''
  if(!authorization.startsWith('Bearer '))return reply({error:'Sessão necessária.'},401)
  const caller=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error}=await caller.auth.getUser();if(error||!user)return reply({error:'Sessão inválida.'},401)
  const raw=await req.text();if(raw.length>65536)return reply({error:'Solicitação inválida.'},400)
  const body=JSON.parse(raw),agency=body.agencyId
  if(raw.length>4096&&body.action!=='chat-drive-send')return reply({error:'Solicitação inválida.'},400)
  if(typeof agency!=='string'||!/^[0-9a-f-]{36}$/i.test(agency))return reply({error:'Agência inválida.'},400)
  if(['presentation-sharing-read','presentation-sharing-create'].includes(body.action)){
   const permission=await caller.rpc('has_agency_permission',{p_agency_id:agency,p_permission_key:'presentations.manage_public_links'});
   if(permission.error||permission.data!==true)return reply({error:'Permissão para gerenciar links necessária.'},403)
   if(typeof body.presentationId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.presentationId))return reply({error:'Apresentação inválida.'},400)
   const existing=await admin.rpc('presentation_sharing_secret',{p_agency:agency,p_presentation:body.presentationId});if(existing.error)throw Error('Não foi possível recuperar o link.')
   if(existing.data){const saved=await open(existing.data);return reply({token:saved.token})}
   if(body.action==='presentation-sharing-read')return reply({token:null})
   if(!configured())return reply({error:'Configuração de criptografia indisponível.'},503)
   const created=await caller.rpc('create_presentation_public_link',{p_agency:agency,p_presentation:body.presentationId});if(created.error||typeof created.data!=='string')throw Error('Não foi possível gerar o link.')
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(created.data)))).map(n=>n.toString(16).padStart(2,'0')).join('');
   const stored=await admin.rpc('presentation_sharing_secret',{p_agency:agency,p_presentation:body.presentationId,p_hash:digest,p_ciphertext:await seal({token:created.data})});if(stored.error)throw Error('Não foi possível guardar o link.')
   return reply({token:created.data})
  }
  const chatAction=['chat-drive-send','chat-drive-read'].includes(body.action)
  let chatContext:Record<string,unknown>|null=null
  if(chatAction){const result=await caller.rpc('chat_drive_context',{p_agency:agency,p_channel:body.action==='chat-drive-send'?(body.channelId||null):null,p_conversation:body.action==='chat-drive-send'?(body.conversationId||null):null,p_attachment:body.action==='chat-drive-read'?body.attachmentId:null});if(result.error||!result.data)return reply({error:'Acesso ao chat e material necessário.'},403);chatContext=result.data;if(body.action==='chat-drive-read'){body.clientId=chatContext!.client_id;body.folderId=chatContext!.drive_folder_id}}
  const taskAction=typeof body.action==='string'&&body.action.startsWith('task-drive-')
  let taskContext:Record<string,unknown>|null=null
  if(taskAction){const result=await caller.rpc('task_drive_context',{p_agency:agency,p_task:body.taskId,p_write:!['task-drive-list','task-drive-preview'].includes(body.action)});if(result.error||!result.data)return reply({error:'Acesso à demanda atribuída e ao cliente necessário.'},403);taskContext=result.data}
  const documentAction=['client-drive-documents','client-drive-document-read'].includes(body.action)
  const productionAction=chatAction||taskAction||['client-drive-documents','client-drive-document-read','client-drive-list','presentation-drive-link','client-drive-upload-start','client-drive-create-folder','client-picker-session'].includes(body.action)
  const can=async(permission:string)=>{const r=await caller.rpc('has_agency_permission',{p_agency_id:agency,p_permission_key:permission});return !r.error&&r.data===true}
  const adminAccess=await caller.rpc('google_workspace_permission',{p_agency:agency});const centralAdmin=!adminAccess.error&&adminAccess.data===true
  if(body.action==='client-picker-session'&&!centralAdmin)return reply({error:'Somente administrador pode autorizar a pasta no Google central da agência.'},403)
  if(chatAction){if(!await can('clients.view'))return reply({error:'Permissão de visualizar clientes necessária.'},403)}else if(productionAction&&!taskAction){
   if(!await can('clients.view')||(documentAction?!await can('briefings.view'):(body.action==='presentation-drive-link'?!await can('presentations.edit'):(body.action!=='client-drive-list'&&!await can('tasks.edit')))))return reply({error:'Permissão para acessar este cliente e produzir materiais necessária.'},403)
  }else if(taskAction){ /* Business permissions were checked by task_drive_context. */ }else if(body.action==='status'){
   if(!centralAdmin&&!await can('clients.view'))return reply({error:'Permissão necessária.'},403)
  }else if(!centralAdmin)return reply({error:'Somente administrador pode configurar a conexão central da agência.'},403)
  requestConfig=await providerConfiguration(admin,agency,'google')
  if(!configured()||!requestConfig)return productionAction?reply({error:'Configure e autorize a integração Google antes de acessar os materiais.'},409):reply({configured:false,connected:false})
  if(body.action==='start'){
   const state=nonce(),verifier=nonce();await secret('state',agency,user.id,await hash(state),await seal({verifier}))
   const params=new URLSearchParams({client_id:requestConfig.clientId,redirect_uri:requestConfig?.redirectUri||redirect,response_type:'code',scope:scopes.join(' '),access_type:'offline',prompt:'consent',state,code_challenge:await hash(verifier),code_challenge_method:'S256',include_granted_scopes:'true'})
   return reply({url:`https://accounts.google.com/o/oauth2/v2/auth?${params}`})
  }
  const central=await connection('read',agency)
  const connector=central.user
  if(!connector)return productionAction?reply({error:'A agência ainda não tem uma conta Google central conectada. Solicite a conexão ao administrador.'},409):reply({configured:true,connected:false,central:true})
  const stored=await secret('read',agency,connector)
  if(!stored.ciphertext)return productionAction?reply({error:'A conta Google central da agência ainda não está autorizada. Solicite a conexão ao administrador.'},409):reply({configured:true,connected:false})
  let token=await open(stored.ciphertext)
  const requiresReauthorization=!scopes.filter(s=>s.startsWith('https:')).every(s=>String(token.scope||'').split(' ').includes(s))
  if(body.action==='status'){
   if(requiresReauthorization)return reply({configured:true,connected:false,central:true,requiresReauthorization:true})
   try{if(token.expires_at<Date.now()+60000){const fresh=await tokens({grant_type:'refresh_token',refresh_token:token.refresh_token});token={...token,...fresh,refresh_token:token.refresh_token,expires_at:Date.now()+fresh.expires_in*1000};await secret('save',agency,connector,undefined,await seal(token))}
    const health=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${token.access_token}`}});if(!health.ok)return reply({configured:true,connected:false,central:true,requiresReauthorization:true});
    const root=folderIdFromUrl(requestConfig.rootFolderUrl);let rootFolderReady=false
    if(root){const rootResponse=await fetch(`https://www.googleapis.com/drive/v3/files/${root}?fields=mimeType,trashed,isAppAuthorized,capabilities(canAddChildren)&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${token.access_token}`}});if(rootResponse.ok){const m=await rootResponse.json();rootFolderReady=m.mimeType==='application/vnd.google-apps.folder'&&!m.trashed&&m.isAppAuthorized===true&&m.capabilities?.canAddChildren===true}}
    return reply({configured:true,connected:true,central:true,requiresReauthorization:false,rootFolderConfigured:!!root,rootFolderReady,email:token.account.email,scopes:String(token.scope||'').split(' ')})
   }catch{return reply({configured:true,connected:false,central:true,requiresReauthorization:true})}
  }
  if(requiresReauthorization&&body.action!=='disconnect')return reply({error:'O administrador precisa reconectar o Google para permitir a leitura dos arquivos existentes.'},409)
  if(body.action==='disconnect'){
   const revoke=await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:token.refresh_token})})
   if(!revoke.ok)return reply({error:'Não foi possível revogar no Google. Tente novamente.'},502)
   await connection('delete',agency,user.id);await secret('delete',agency,connector);return reply({configured:true,connected:false})
  }
  if(token.expires_at<Date.now()+60000){const fresh=await tokens({grant_type:'refresh_token',refresh_token:token.refresh_token});token={...token,...fresh,refresh_token:token.refresh_token,expires_at:Date.now()+fresh.expires_in*1000};await secret('save',agency,connector,undefined,await seal(token))}
  if(body.action==='root-picker-session'){
   const folder=folderIdFromUrl(requestConfig.rootFolderUrl);if(!folder)return reply({error:'Cadastre uma pasta raiz nas configurações Google da agência.'},409)
   if(!requestConfig.apiKey||!requestConfig.projectNumber)return reply({error:'Configure a API Key pública do Google Picker e o número do projeto.'},409)
   return reply({accessToken:token.access_token,apiKey:requestConfig.apiKey,appId:requestConfig.projectNumber,folderId:folder})
  }
  if(taskAction&&taskContext)return handleTaskDrive({body,context:taskContext as never,admin,accessToken:token.access_token,configuration:requestConfig,centralAdmin,userId:user.id,headers})
  if(productionAction){
   if(typeof body.clientId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.clientId))return reply({error:'Cliente inválido.'},400)
   // The authenticated client applies tenant RLS; never accept an arbitrary folder ID from the browser.
   const client=await caller.from('clients').select('id,profile').eq('agency_id',agency).eq('id',body.clientId).maybeSingle()
   if(client.error||!client.data)return reply({error:'Cliente não encontrado nesta agência.'},404)
   if(body.action==='client-drive-create-folder'){
    if(!await can('clients.edit'))return reply({error:'Permissão de editar cliente necessária.'},403)
    if(client.data.profile?.drive_url)return reply({error:'Este cliente já possui uma pasta vinculada. Revise o cadastro antes de criar outra.'},409)
    const root=folderIdFromUrl(requestConfig.rootFolderUrl)
    if(!root)return reply({error:'Configure e autorize a pasta raiz da agência antes de criar pastas de clientes.'},409)
    if(root){const checkRoot=await fetch(`https://www.googleapis.com/drive/v3/files/${root}?fields=id,mimeType,trashed,isAppAuthorized,capabilities(canAddChildren)`,{headers:{Authorization:`Bearer ${token.access_token}`}});if(!checkRoot.ok)return reply({error:'A pasta raiz configurada não está disponível para a conta central.'},403);const m=await checkRoot.json();if(m.trashed||m.mimeType!=='application/vnd.google-apps.folder'||!m.isAppAuthorized||!m.capabilities?.canAddChildren)return reply({error:'Autorize a pasta raiz pelo Google Picker antes de criar pastas de clientes.'},403)}
    const created=await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink',{method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({name:`Dois.Zero · Cliente ${client.data.id}`,mimeType:'application/vnd.google-apps.folder',...(root?{parents:[root]}:{}),appProperties:{agencyId:agency,clientId:body.clientId}})})
    if(!created.ok)return reply({error:'Não foi possível criar a pasta no Google Drive.'},502)
    const folderData=await created.json(),driveUrl=`https://drive.google.com/drive/folders/${folderData.id}`
    const saved=await caller.from('clients').update({profile:{...client.data.profile,drive_url:driveUrl}}).eq('agency_id',agency).eq('id',body.clientId).select('id').maybeSingle()
    if(saved.error||!saved.data){await fetch(`https://www.googleapis.com/drive/v3/files/${folderData.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token.access_token}`}});return reply({error:'Não foi possível vincular a pasta ao cliente.'},409)}
    return reply({folderId:folderData.id,driveUrl})
   }
   const clientFolder=folderIdFromUrl(client.data.profile?.drive_url)
   if(!clientFolder)return reply({error:'Cadastre o link da pasta do Drive no perfil deste cliente.'},409)
   let folder=clientFolder
   const root=folderIdFromUrl(requestConfig.rootFolderUrl)
   if(!root)return reply({error:'O administrador precisa configurar a pasta raiz da agência antes de acessar os materiais dos clientes.'},409)
   const withinRoot=await isFolderDescendant(folder,root,async(id)=>{const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=parents,trashed&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${token.access_token}`}});if(!r.ok)throw Error('Pasta não disponível.');const m=await r.json();return m.trashed?[]:(m.parents||[])})
   if(!withinRoot)return reply({error:'A pasta cadastrada para este cliente não está dentro da pasta raiz da agência. Solicite a revisão do cadastro ao administrador.'},403)
   if(body.folderId!==undefined){
    if(typeof body.folderId!=='string'||!/^[A-Za-z0-9_-]{10,200}$/.test(body.folderId))return reply({error:'Pasta inválida.'},400)
    if(body.folderId!==clientFolder&&!await isFolderDescendant(body.folderId,clientFolder!,async(id)=>{const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=parents,mimeType,trashed&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${token.access_token}`}});if(!r.ok)return [];const m=await r.json();return m.trashed||m.mimeType==='application/vnd.google-apps.shortcut'?[]:(m.parents||[])}))return reply({error:'Esta pasta não pertence ao cliente.'},403)
    folder=body.folderId
   }
   if(body.action==='client-picker-session'){
    if(!requestConfig.apiKey||!requestConfig.projectNumber)return reply({error:'Configure a chave pública do Google Picker e o número do projeto em Integrações → Google.'},409)
    // Google Picker requires this user's drive.file access token. Browser keeps it only in memory for this picker session.
    return reply({accessToken:token.access_token,apiKey:requestConfig.apiKey,appId:requestConfig.projectNumber,folderId:folder})
   }
   const googleHeaders={Authorization:`Bearer ${token.access_token}`}
   const check=await fetch(`https://www.googleapis.com/drive/v3/files/${folder}?fields=id,name,parents,mimeType,trashed,isAppAuthorized,capabilities(canAddChildren)&supportsAllDrives=true`,{headers:googleHeaders})
   if(!check.ok)return reply({error:'Esta pasta não está autorizada para o aplicativo Google ou para sua conta. O link da pasta sozinho não concede acesso. Use Autorizar pasta existente para selecionar a pasta cadastrada, ou vincule uma pasta criada pelo aplicativo.'},403)
   const metadata=await check.json()
   if(metadata.mimeType!=='application/vnd.google-apps.folder'||metadata.trashed)return reply({error:'A pasta do cliente não está disponível.'},409)
   if(chatAction){
    const fileId=body.action==='chat-drive-read'?chatContext!.google_file_id:body.fileId
    let file;try{file=await chatDriveFile(folder!,fileId,token.access_token)}catch(error){return reply({error:error instanceof Error?error.message:'Material indisponível.'},403)}
    if(body.action==='chat-drive-send'){
     if(typeof body.message!=='string'||!body.message.trim()||body.message.length>10000)return reply({error:'Informe uma mensagem de até 10000 caracteres.'},400)
     const result=await admin.rpc('chat_drive_send',{p_agency:agency,p_actor:user.id,p_client:body.clientId,p_channel:body.channelId||null,p_conversation:body.conversationId||null,p_body:body.message,p_file:file})
     if(result.error)return reply({error:'Não foi possível vincular o material. O acesso pode ter mudado.'},403)
     return reply({messageId:result.data})
    }
    let download;try{download=chatDriveDownload(file)}catch(error){return reply({error:error instanceof Error?error.message:'Formato indisponível.'},400)}
    const media=await fetch(download.url,{headers:googleHeaders,redirect:'error'})
    if(!media.ok)return reply({error:'Não foi possível baixar o material do Drive.'},502)
    return new Response(media.body,{headers:{...headers,'Content-Type':download.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(file.name+(download.mime==='application/pdf'&&!file.name.endsWith('.pdf')?'.pdf':''))}`,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}})
   }
   if(body.action==='presentation-drive-link'){
    const presentation=await caller.from('presentations').select('id').eq('id',body.presentationId).eq('agency_id',agency).eq('client_id',body.clientId).maybeSingle()
    const section=await caller.from('presentation_sections').select('id').eq('id',body.sectionId).eq('presentation_id',body.presentationId).eq('agency_id',agency).maybeSingle()
    if(presentation.error||!presentation.data||section.error||!section.data)return reply({error:'Apresentação ou seção não pertence a este cliente.'},403)
    let files;try{files=await verifiedPresentationFiles(folder!,body.fileIds,token.access_token)}catch(error){return reply({error:error instanceof Error?error.message:'Materiais inválidos.'},400)}
    const last=await caller.from('presentation_assets').select('position').eq('agency_id',agency).eq('presentation_id',body.presentationId).eq('section_id',body.sectionId).order('position',{ascending:false}).limit(1).maybeSingle()
    if(last.error)return reply({error:'Não foi possível consultar a ordem dos materiais.'},503)
    let nextPosition=(last.data?.position??-1)+1
    const linked=[]
    for(const file of files){
     const prior=await caller.from('drive_file_references').select('id').eq('agency_id',agency).eq('google_file_id',file.google_file_id).limit(1).maybeSingle()
     if(prior.error)return reply({error:'Não foi possível consultar os materiais.'},503)
     const saved=prior.data?await caller.from('drive_file_references').update(file).eq('agency_id',agency).eq('id',prior.data.id).select('id').single():await caller.from('drive_file_references').insert({agency_id:agency,...file}).select('id').single()
     if(saved.error||!saved.data)return reply({error:'Não foi possível indexar os materiais.'},503)
     const existing=await caller.from('presentation_assets').select('id').eq('agency_id',agency).eq('presentation_id',body.presentationId).eq('section_id',body.sectionId).eq('file_reference_id',saved.data.id).limit(1).maybeSingle()
     if(existing.error)return reply({error:'Não foi possível consultar a seção.'},503)
     if(existing.data){linked.push(existing.data);continue}
     const asset=await caller.from('presentation_assets').insert({agency_id:agency,presentation_id:body.presentationId,section_id:body.sectionId,file_reference_id:saved.data.id,title:file.name,position:nextPosition++}).select('*,file_reference:drive_file_references(*)').single()
     if(asset.error)return reply({error:'Não foi possível vincular os materiais. Atualize e tente novamente.'},503)
     linked.push(asset.data)
    }
    return reply({assets:linked})
   }
   if(body.action==='client-drive-documents'){
    const result=await discoverClientDriveDocuments(folder,token.access_token)
    if(result.documents.length){
     const rows=result.documents.map(d=>({agency_id:agency,client_id:body.clientId,google_file_id:d.id,name:d.name,mime_type:d.mimeType,path:d.path,version:d.version,modified_time:d.modifiedTime||null,size:d.size||null,web_view_link:d.webViewLink||null,can_read_text:d.canReadText,available:true,synced_at:new Date().toISOString()}))
     // Service writes only source metadata. Reviewed context/version/by/at fields are never included or overwritten.
     const indexed=await admin.from('client_drive_documents').upsert(rows,{onConflict:'agency_id,client_id,google_file_id'})
     if(indexed.error)return reply({error:'Não foi possível sincronizar o índice de documentos. Os dados revisados foram preservados.'},503)
    }
    if(result.scan.complete){let query=admin.from('client_drive_documents').update({available:false}).eq('agency_id',agency).eq('client_id',body.clientId);if(result.documents.length)query=query.not('google_file_id','in',`(${result.documents.map(d=>d.id).join(',')})`);const missing=await query;if(missing.error)return reply({error:'Não foi possível atualizar a disponibilidade dos documentos. As revisões foram preservadas.'},503)}
    return reply(result)
   }
   if(body.action==='client-drive-document-read'){
    if(typeof body.documentId!=='string')return reply({error:'Documento inválido.'},400)
    try{const result=await readClientDriveDocument(folder,body.documentId,token.access_token),d=result.document;
     const prior=await admin.from('client_drive_documents').select('path').eq('agency_id',agency).eq('client_id',body.clientId).eq('google_file_id',d.id).maybeSingle();if(prior.error)return reply({error:'Não foi possível consultar o índice de documentos.'},503);
     if(prior.data?.path)d.path=prior.data.path;
     const indexed=await admin.from('client_drive_documents').upsert({agency_id:agency,client_id:body.clientId,google_file_id:d.id,name:d.name,mime_type:d.mimeType,path:d.path,version:d.version,modified_time:d.modifiedTime||null,size:d.size||null,web_view_link:d.webViewLink||null,can_read_text:d.canReadText,available:true,synced_at:new Date().toISOString()},{onConflict:'agency_id,client_id,google_file_id'});if(indexed.error)return reply({error:'Não foi possível atualizar a versão do documento. Atualize antes de revisar.'},503);return reply(result);
    }catch(error){if(error instanceof DriveDocumentUnavailableError){const missing=await admin.from('client_drive_documents').update({available:false}).eq('agency_id',agency).eq('client_id',body.clientId).eq('google_file_id',body.documentId);if(missing.error)return reply({error:'Não foi possível atualizar a disponibilidade do documento.'},503);return reply({error:error.message},404)}throw error}
   }
   if(body.action==='client-drive-upload-start'){
    const invalid=validateDriveUpload(body);if(invalid)return reply({error:invalid},400)
    if(!metadata.isAppAuthorized)return reply({error:'O administrador precisa autorizar esta pasta pelo Google Picker antes do envio. A conexão permite ler arquivos existentes, mas grava somente em pastas autorizadas para o aplicativo.'},403)
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
   const data=await result.json();return reply({files:data.files||[],nextPageToken:data.nextPageToken||null,folderId:folder,rootId:clientFolder,folder:{id:metadata.id,name:metadata.name,parentId:metadata.parents?.[0]||null,canUpload:metadata.isAppAuthorized===true&&metadata.capabilities?.canAddChildren===true,isAppAuthorized:metadata.isAppAuthorized===true}})
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
