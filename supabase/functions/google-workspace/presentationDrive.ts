// @ts-ignore Deno Edge Functions require explicit TypeScript module extensions.
import {googleFetch} from './googleFetch.ts';
export async function verifiedPresentationFiles(folderId:string,fileIds:unknown,accessToken:string){
 if(!Array.isArray(fileIds)||!fileIds.length||fileIds.length>20||fileIds.some(id=>typeof id!=='string'||!/^[A-Za-z0-9_-]{10,200}$/.test(id)))throw Error('Selecione de 1 a 20 arquivos válidos.')
 const files=[];
 for(const id of new Set<string>(fileIds)){
  const response=await googleFetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,parents,trashed,modifiedTime,size,thumbnailLink&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${accessToken}`}});
  if(!response.ok)throw Error('Arquivo indisponível no Drive.');const file=await response.json();
  if(file.id!==id||typeof file.name!=='string'||typeof file.mimeType!=='string'||file.trashed||['application/vnd.google-apps.folder','application/vnd.google-apps.shortcut'].includes(file.mimeType)||!file.parents?.includes(folderId))throw Error('O material não pertence à pasta selecionada.')
  let thumbnail:string|null=null;try{const url=new URL(file.thumbnailLink);if(url.protocol==='https:'&&(url.hostname==='drive.google.com'||url.hostname.endsWith('.googleusercontent.com')))thumbnail=url.href}catch{/* Google may not provide a thumbnail. */}
  files.push({thumbnail_reference:thumbnail,google_file_id:file.id,name:file.name,mime_type:file.mimeType,web_view_link:`https://drive.google.com/file/d/${file.id}/view`,parent_folder_id:folderId,modified_time:file.modifiedTime||null,size_bytes:file.size?Number(file.size):null,last_synced_at:new Date().toISOString(),availability_status:'available'});
 }
 return files;
}
