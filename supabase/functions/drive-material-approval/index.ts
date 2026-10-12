import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {googleClientFolderAccess} from '../_shared/googleWorkspace.ts';
import {folderIdFromUrl,DRIVE_MEDIA_TYPES} from '../google-workspace/drive.ts';
const origin='https://doispontozero.renatodesigner.com.br';
const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const hash=async(value:string)=>encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
Deno.serve(async(req:Request)=>{
 const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{headers,status});
 if(req.method==='OPTIONS')return new Response(null,{headers,status:204});
 if(req.method!=='POST')return reply({error:'Método inválido.'},405);
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Origem inválida.'},403);
 try{
  const raw=await req.text();if(raw.length>16000)return reply({error:'Solicitação inválida.'},400);
  const body=JSON.parse(raw),url=Deno.env.get('SUPABASE_URL')!;
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  async function approval(action:string,params:Record<string,unknown>){const {data,error}=await admin.rpc('drive_material_approval_service',{p_action:action,...params});if(error)throw Error('Link indisponível ou expirado.');return data;}
  if(body.action==='publish'){
   const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('authorization')||''}},auth:{persistSession:false}});
   const auth=await caller.auth.getUser();if(auth.error||!auth.data.user)return reply({error:'Sessão necessária.'},401);
   for(const permission of ['clients.view','tasks.edit']){const can=await caller.rpc('has_agency_permission',{p_agency_id:body.agencyId,p_permission_key:permission});if(can.error||can.data!==true)return reply({error:'Permissão de produção necessária.'},403);}
   const client=await caller.from('clients').select('id,profile').eq('id',body.clientId).eq('agency_id',body.agencyId).maybeSingle();
   const folder=folderIdFromUrl(client.data?.profile?.drive_url);if(client.error||!folder)return reply({error:'Cliente ou pasta indisponível.'},404);
   if(!Array.isArray(body.fileIds)||body.fileIds.length<1||body.fileIds.length>100||body.fileIds.some((id:unknown)=>typeof id!=='string'||!/^[A-Za-z0-9_-]{10,200}$/.test(id)))return reply({error:'Selecione os arquivos para revisão.'},400);
   const token=await googleClientFolderAccess(admin,body.agencyId,folder,auth.data.user.id),files=[];
   for(const id of [...new Set(body.fileIds)] as string[]){const response=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,parents,trashed,version&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw Error('Arquivo indisponível.');const file=await response.json();if(file.trashed||!file.parents?.includes(folder)||!DRIVE_MEDIA_TYPES.has(file.mimeType))throw Error('Material não pertence à pasta do cliente.');files.push({id:file.id,name:file.name,mimeType:file.mimeType,version:file.version});}
   const publicToken=encode(crypto.getRandomValues(new Uint8Array(32)));
   const saved=await approval('create',{p_hash:await hash(publicToken),p_agency:body.agencyId,p_client:body.clientId,p_owner:auth.data.user.id,p_folder:folder,p_files:files});
   return reply({id:saved.id,expiresAt:saved.expires_at,link:`${origin}/material-review#${publicToken}`});
  }
  if(typeof body.token!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(body.token))return reply({error:'Link inválido.'},404);
  const tokenHash=await hash(body.token);
  const item=await approval('read',{p_hash:tokenHash});
  const centralAccess=await googleClientFolderAccess(admin,item.agency_id,item.folder_id,item.owner_id);
  if(body.action==='respond'){
   if(body.status==='approved'){const access=centralAccess;for(const f of item.files){const r=await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?fields=parents,trashed,version&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${access}`}});if(!r.ok)throw Error('Material indisponível.');const m=await r.json();if(m.trashed||!m.parents?.includes(item.folder_id)||m.version!==f.version)return reply({error:'Os materiais mudaram. Solicite um novo link antes de aprovar.'},409);}}
   const data=await approval('respond',{p_hash:tokenHash,p_status:body.status,p_feedback:typeof body.feedback==='string'?body.feedback.trim():''});return reply({status:data.status});
  }
  if(body.action==='read')return reply({files:item.files,status:item.status,feedback:item.feedback,expiresAt:item.expires_at});
  if(body.action!=='file')return reply({error:'Operação inválida.'},400);
  const selected=item.files.find((f:{id:string})=>f.id===body.fileId);if(!selected)return reply({error:'Arquivo não selecionado.'},404);
  const token=centralAccess;
  const metadata=await fetch(`https://www.googleapis.com/drive/v3/files/${selected.id}?fields=parents,trashed,version&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${token}`}});if(!metadata.ok)throw Error('Material indisponível.');const current=await metadata.json();if(current.trashed||!current.parents?.includes(item.folder_id)||current.version!==selected.version)return reply({error:'O material foi alterado. Solicite um novo link à agência.'},409);
  const file=await fetch(`https://www.googleapis.com/drive/v3/files/${selected.id}?alt=media&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${token}`}});if(!file.ok)throw Error('Material indisponível.');
  return new Response(file.body,{headers:{...headers,'Content-Type':selected.mimeType,'Content-Disposition':'inline','X-Content-Type-Options':'nosniff'}});
 }catch{return reply({error:'Não foi possível acessar esta revisão. Verifique o link ou solicite um novo à agência.'},400);}
});
