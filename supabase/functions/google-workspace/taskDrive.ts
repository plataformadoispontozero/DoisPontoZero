import {googleFetch,isGoogleTimeout} from './googleFetch.ts';
import type {SupabaseClient} from 'npm:@supabase/supabase-js@2.117.3';
import type {ProviderConfiguration} from '../_shared/providerConfig.ts';
import {folderIdFromUrl,isFolderDescendant,isGoogleUploadUrl} from './drive.ts';
import {validTaskDriveUpload,matchesTaskUploadFile,TASK_DRIVE_PREVIEW_MAX_BYTES} from './taskDriveHelpers.ts';
interface Context {taskId:string;agencyId:string;clientId:string;clientName:string;clientDriveUrl:string|null;savedFolderId:string|null;dueDate:string|null;editorialMonth?:string|null;canManage:boolean}
interface Input {body:Record<string,unknown>;context:Context;admin:SupabaseClient;accessToken:string;configuration:ProviderConfiguration;centralAdmin:boolean;userId:string;headers:Record<string,string>}
class DriveError extends Error{constructor(message:string,public status=400){super(message)}}
const FOLDER='application/vnd.google-apps.folder';
const id=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{10,200}$/.test(v);
export async function handleTaskDrive(input:Input):Promise<Response>{
 const {body,context:c,admin,accessToken,configuration,centralAdmin,userId,headers}=input;
 const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
 const auth={Authorization:`Bearer ${accessToken}`};
 async function request(url:string,options:RequestInit={}){const r=await googleFetch(url,{...options,headers:{...auth,...options.headers}});if(!r.ok){if(r.status===401)throw new DriveError('A conexão com o Google precisa ser renovada.',401);if(r.status===404)throw new DriveError('A pasta ou arquivo não foi encontrado no Google Drive.',404);if(r.status===429)throw new DriveError('O Google Drive está limitando temporariamente os envios.',429);if(r.status===403)throw new DriveError('Esta pasta ainda não está autorizada para envio. Solicite autorização à gestão.',403);throw new DriveError('O Google Drive não concluiu a operação. Tente novamente.',502)}return r}
 async function meta(fileId:string){if(!id(fileId))throw new DriveError('Referência Drive inválida.');return (await request(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,parents,trashed,isAppAuthorized,capabilities(canAddChildren),size,version,appProperties,thumbnailLink&supportsAllDrives=true`)).json()}
 const parents=async(fileId:string)=>{const m=await meta(fileId);return m.trashed||m.mimeType==='application/vnd.google-apps.shortcut'?[]:(m.parents||[])};
 function folderView(m:Record<string,unknown>){const capabilities=m.capabilities as {canAddChildren?:boolean}|undefined;return {id:m.id,name:m.name,parentId:(m.parents as string[]|undefined)?.[0]||null,isAppAuthorized:m.isAppAuthorized===true,canAddChildren:capabilities?.canAddChildren===true,canUpload:m.isAppAuthorized===true&&capabilities?.canAddChildren===true}}
 try{
  const clientRoot=folderIdFromUrl(c.clientDriveUrl),agencyRoot=folderIdFromUrl(configuration.rootFolderUrl);
  if(!clientRoot&&body.action==='task-drive-list')return reply({client:{id:c.clientId,name:c.clientName},root:null,folder:null,folders:[],files:[],attachments:[],savedFolderId:c.savedFolderId,period:{dueDate:c.dueDate,editorialMonth:c.editorialMonth||null},canManage:c.canManage,canAuthorize:centralAdmin,missingClientFolder:true});
  if(!clientRoot)throw new DriveError('Nenhuma pasta vinculada ao Google Drive deste cliente. Solicite o vínculo à gestão.',409);
  if(!agencyRoot)throw new DriveError('Configure a pasta raiz da agência antes de acessar os arquivos.',409);
  if(!await isFolderDescendant(clientRoot,agencyRoot,parents))throw new DriveError('A pasta deste cliente não está dentro da raiz autorizada da agência.',403);
  async function folder(fileId:unknown){if(!id(fileId))throw new DriveError('Pasta inválida.');if(fileId!==clientRoot&&!await isFolderDescendant(fileId,clientRoot!,parents))throw new DriveError('Esta pasta não pertence ao cliente da demanda.',403);const m=await meta(fileId);if(m.mimeType!==FOLDER||m.trashed)throw new DriveError('A pasta não foi encontrada no Google Drive.',404);return m}
  let destinationWarning:string|null=null;
  let target;
  try{target=await folder(['task-drive-upload-finish','task-drive-preview','task-drive-remove-reference'].includes(String(body.action))?clientRoot:(body.folderId??c.savedFolderId??clientRoot))}
  catch(error){if(body.action==='task-drive-list'&&body.folderId===undefined&&c.savedFolderId&&error instanceof DriveError&&error.status===404){target=await folder(clientRoot);destinationWarning='O destino utilizado anteriormente não foi encontrado. Escolha outra pasta.'}else throw error}

  if(body.action==='task-drive-picker-session'){
   if(!centralAdmin)throw new DriveError('Somente a gestão autorizada pode conceder acesso à pasta pelo Google Picker.',403);
   if(configuration.projectNumber&&/^\d+-/.test(configuration.clientId)&&configuration.clientId.split('-')[0]!==configuration.projectNumber)throw new DriveError('O número do projeto do Google Picker não corresponde ao cliente OAuth. Confira a integração Google nas configurações.',409);
   if(!configuration.apiKey||!configuration.projectNumber)throw new DriveError('Configure o Google Picker na integração existente.',409);
   return reply({accessToken,apiKey:configuration.apiKey,appId:configuration.projectNumber,folderId:target.id});
  }
  if(body.action==='task-drive-list'){
   const page=typeof body.pageToken==='string'&&body.pageToken.length<=1000?body.pageToken:'';
   const params=new URLSearchParams({q:`'${target.id}' in parents and trashed=false`,pageSize:'100',orderBy:'folder,name',fields:'nextPageToken,files(id,name,mimeType,parents,size,modifiedTime,version,isAppAuthorized,capabilities(canAddChildren))',supportsAllDrives:'true',includeItemsFromAllDrives:'true',...(page?{pageToken:page}:{})});
   const data=await (await request(`https://www.googleapis.com/drive/v3/files?${params}`)).json();
   const gallery=await admin.from('task_attachments').select('*').eq('agency_id',c.agencyId).eq('task_id',c.taskId).eq('storage_provider','google_drive').order('created_at',{ascending:true});if(gallery.error)throw new DriveError('Não foi possível consultar os arquivos da demanda.',503);
   const root=target.id===clientRoot?target:await folder(clientRoot);
   const files=(data.files||[]).filter((m:{parents?:string[];mimeType?:string})=>m.parents?.includes(target.id)&&m.mimeType!=='application/vnd.google-apps.shortcut');
   return reply({client:{id:c.clientId,name:c.clientName},root:{id:root.id,name:root.name},folder:folderView(target),folders:files.filter((m:{mimeType:string})=>m.mimeType===FOLDER).map(folderView),files:files.filter((m:{mimeType:string})=>m.mimeType!==FOLDER),attachments:gallery.data||[],savedFolderId:c.savedFolderId,period:{dueDate:c.dueDate,editorialMonth:c.editorialMonth||null},canManage:c.canManage,canAuthorize:centralAdmin,destinationWarning,nextPageToken:data.nextPageToken||null});
  }
  if(body.action==='task-drive-import-file'){
   if(!c.canManage)throw new DriveError('Sem permissão para vincular arquivos a esta demanda.',403);
   if(!id(body.fileId))throw new DriveError('Arquivo do Drive inválido.');
   const m=await meta(body.fileId);
   if(m.trashed||m.mimeType===FOLDER||!m.parents?.includes(target.id))throw new DriveError('Selecione um arquivo que esteja diretamente na pasta escolhida.',403);
   if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(String(m.mimeType))||!Number.isSafeInteger(Number(m.size))||Number(m.size)<1||Number(m.size)>524288000)throw new DriveError('Selecione uma imagem PNG, JPG, WebP, GIF ou AVIF de até 500 MB.');
   if(!m.version)throw new DriveError('O Google Drive não retornou a versão desta imagem. Atualize a pasta e tente novamente.');
   const driveUrl=`https://drive.google.com/file/d/${m.id}/view`;
   const inserted=await admin.from('task_attachments').insert({agency_id:c.agencyId,task_id:c.taskId,client_id:c.clientId,file_name:m.name,storage_path:`drive:${m.id}`,mime_type:m.mimeType,file_size:Number(m.size),uploaded_by:userId,storage_provider:'google_drive',google_file_id:m.id,google_folder_id:target.id,google_file_version:String(m.version),google_drive_url:driveUrl}).select('*').maybeSingle();
   if(inserted.error&&inserted.error.code!=='23505')throw new DriveError('Não foi possível vincular esta imagem à demanda.',503);
   let attachment=inserted.data;
   if(!attachment){const existing=await admin.from('task_attachments').select('*').eq('task_id',c.taskId).eq('google_file_id',m.id).eq('storage_provider','google_drive').maybeSingle();if(existing.error||!existing.data)throw new DriveError('A imagem já está vinculada, mas não foi possível atualizar a referência.',503);attachment=existing.data;}
   return reply({attachment});
  }
  if(!c.canManage&&body.action!=='task-drive-preview')throw new DriveError('Sem permissão para gerenciar arquivos desta demanda.',403);
  if(body.action==='task-drive-set-folder'){
   const saved=await admin.from('tasks').update({google_drive_folder_id:target.id}).eq('id',c.taskId).eq('agency_id',c.agencyId);if(saved.error)throw new DriveError('Não foi possível salvar o destino.',503);return reply({folder:folderView(target),savedFolderId:target.id});
  }
  if(body.action==='task-drive-create-folder'){
   if(body.confirmed!==true)throw new DriveError('Confirme a criação da pasta antes de continuar.');
   if(typeof body.name!=='string'||!body.name.trim()||body.name.length>200||/[\x00-\x1f/\\]/.test(body.name))throw new DriveError('Nome de pasta inválido.');
   if(!folderView(target).canUpload)throw new DriveError('Esta pasta ainda precisa ser autorizada para criar subpastas.',403);
   const created=await (await request('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,parents,isAppAuthorized,capabilities(canAddChildren)&supportsAllDrives=true',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:body.name.trim(),mimeType:FOLDER,parents:[target.id],appProperties:{agencyId:c.agencyId,clientId:c.clientId}})})).json();
   const saved=await admin.from('tasks').update({google_drive_folder_id:created.id}).eq('id',c.taskId).eq('agency_id',c.agencyId);if(saved.error)throw new DriveError('A pasta foi criada no Drive, mas o destino não foi salvo. Atualize as pastas e selecione-a.',503);return reply({folder:folderView(created),savedFolderId:created.id});
  }
  if(body.action==='task-drive-upload-start'){
   const kind=body.kind||'original';if(kind!=='original'&&kind!=='preview')throw new DriveError('Tipo de envio inválido.');
   const invalid=validTaskDriveUpload({...body,kind});if(invalid)throw new DriveError(invalid);
   if(!folderView(target).canUpload)throw new DriveError('Esta pasta ainda precisa ser autorizada para uploads. Solicite autorização à gestão.',403);
   let attachmentId:string|null=null;
   if(kind==='preview'){
    const a=await admin.from('task_attachments').select('id,google_folder_id').eq('id',body.attachmentId).eq('task_id',c.taskId).eq('agency_id',c.agencyId).eq('client_id',c.clientId).eq('storage_provider','google_drive').maybeSingle();if(a.error||!a.data||a.data.google_folder_id!==target.id)throw new DriveError('Arquivo original não pertence a esta demanda e pasta.',403);attachmentId=a.data.id;
   }
   const uploadId=crypto.randomUUID();
   const response=await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,size,version',{method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':String(body.mimeType),'X-Upload-Content-Length':String(body.size)},body:JSON.stringify({name:String(body.name).trim(),mimeType:String(body.mimeType),parents:[target.id],appProperties:{uploadId,agencyId:c.agencyId,clientId:c.clientId,taskId:c.taskId,uploadedBy:userId,kind}})});
   const uploadUrl=response.headers.get('Location')||'';if(!isGoogleUploadUrl(uploadUrl))throw new DriveError('O Google não disponibilizou uma sessão válida de envio.',502);
   const saved=await admin.rpc('task_drive_upload_session',{p_action:'create',p_id:uploadId,p_user:userId,p_metadata:{agency_id:c.agencyId,task_id:c.taskId,client_id:c.clientId,folder_id:target.id,file_name:String(body.name).trim(),mime_type:body.mimeType,file_size:body.size,uploaded_by:userId,kind,attachment_id:attachmentId}});if(saved.error)throw new DriveError('Não foi possível preparar os metadados do envio.',503);
   return reply({uploadUrl,uploadId,expiresInSeconds:3600});
  }
  if(body.action==='task-drive-upload-finish'){
   if(typeof body.uploadId!=='string'||!id(body.fileId))throw new DriveError('Sessão de envio inválida.');
   const upload=await admin.rpc('task_drive_upload_session',{p_action:'read',p_id:body.uploadId,p_user:userId});
   const u=upload.data;if(upload.error||!u||u.agency_id!==c.agencyId||u.task_id!==c.taskId||u.client_id!==c.clientId||(!u.completed_file_id&&Date.parse(u.expires_at)<Date.now()))throw new DriveError('Sessão de envio expirada ou inválida.',403);
   await folder(u.folder_id);
   const m=await meta(body.fileId);if(!matchesTaskUploadFile(u,m))throw new DriveError('O arquivo enviado não corresponde à sessão, cliente ou demanda.',403);
   const result=await admin.rpc('finish_task_drive_upload',{p_upload:u.id,p_user:userId,p_google_file_id:m.id,p_version:String(m.version),p_drive_url:`https://drive.google.com/file/d/${m.id}/view`});if(result.error)throw new DriveError('O arquivo está no Drive, mas não foi possível concluir os metadados. Tente finalizar novamente.',503);return reply({attachment:result.data});
  }
  if(body.action==='task-drive-preview'||body.action==='task-drive-remove-reference'){
   const a=await admin.from('task_attachments').select('*').eq('id',body.attachmentId).eq('agency_id',c.agencyId).eq('task_id',c.taskId).eq('client_id',c.clientId).eq('storage_provider','google_drive').maybeSingle();if(a.error||!a.data)throw new DriveError('Arquivo não encontrado nesta demanda.',404);
   if(body.action==='task-drive-remove-reference'){const removed=await admin.from('task_attachments').delete().eq('id',a.data.id).eq('task_id',c.taskId).eq('agency_id',c.agencyId);if(removed.error)throw new DriveError('Não foi possível remover a referência.',503);return reply({removed:true,originalPreserved:true})}
   await folder(a.data.google_folder_id);
   const fileId=a.data.preview_google_file_id||a.data.google_file_id,m=await meta(fileId);
   if(m.trashed||!m.parents?.includes(a.data.google_folder_id))throw new DriveError('Preview fora da pasta da demanda.',403);
   let url:string;
   if(a.data.preview_google_file_id){if(m.mimeType!=='image/webp'||String(m.version)!==String(a.data.preview_google_file_version)||Number(m.size)>TASK_DRIVE_PREVIEW_MAX_BYTES||m.appProperties?.taskId!==c.taskId||m.appProperties?.clientId!==c.clientId)throw new DriveError('Preview inválido.',403);url=`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`}
   else{if(typeof m.thumbnailLink!=='string')throw new DriveError('Preview ainda não disponível. Envie um preview WebP.',404);const thumb=new URL(m.thumbnailLink);if(thumb.protocol!=='https:'||!/(^|\.)googleusercontent\.com$/.test(thumb.hostname)||thumb.username||thumb.password)throw new DriveError('Thumbnail inválida.',403);url=m.thumbnailLink}
   const response=await request(url,{redirect:'error'});if(Number(response.headers.get('Content-Length'))>TASK_DRIVE_PREVIEW_MAX_BYTES)throw new DriveError('Preview excede 2 MB.');
   const reader=response.body?.getReader();if(!reader)throw new DriveError('Preview indisponível.',404);const chunks:Uint8Array[]=[];let size=0;
   for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>TASK_DRIVE_PREVIEW_MAX_BYTES){await reader.cancel();throw new DriveError('Preview excede 2 MB.')}chunks.push(part.value)}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
   const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP',png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71,jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
   if(!webp&&!png&&!jpeg)throw new DriveError('Preview não é uma imagem suportada.');const mime=webp?'image/webp':png?'image/png':'image/jpeg';
   return new Response(bytes,{headers:{...headers,'Content-Type':'application/octet-stream','X-Preview-Mime':mime,'X-Content-Type-Options':'nosniff','Access-Control-Expose-Headers':'X-Preview-Mime'}});
  }
  throw new DriveError('Operação de arquivos inválida.');
 }catch(error){if(isGoogleTimeout(error))return reply({error:'O Google demorou para responder. Confira se a operação foi concluída antes de tentar novamente.',code:'GOOGLE_TIMEOUT'},504);return reply({error:error instanceof DriveError?error.message:'Não foi possível acessar os arquivos desta demanda.'},error instanceof DriveError?error.status:503)}
}
