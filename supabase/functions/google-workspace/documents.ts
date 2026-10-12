// @ts-ignore Deno Edge Functions require explicit TypeScript module extensions.
import {isFolderDescendant} from './drive.ts';
export class DriveDocumentUnavailableError extends Error {}
export const MAX_DRIVE_DOCUMENT_BYTES=512*1024;
export const DRIVE_DOCUMENT_LIMITS={folders:100,requests:100,documents:200};
const FOLDER='application/vnd.google-apps.folder',SHORTCUT='application/vnd.google-apps.shortcut',GOOGLE_DOC='application/vnd.google-apps.document';
const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const documentMimeTypes=new Set([GOOGLE_DOC,'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','application/vnd.google-apps.spreadsheet','application/vnd.google-apps.presentation']);
export interface DriveDocumentMetadata {id:string;name:string;mimeType:string;path:string;version:string;modifiedTime?:string;size?:string;webViewLink?:string;canReadText:boolean}
interface GoogleFile {id:string;name:string;mimeType:string;version?:string;modifiedTime?:string;size?:string;webViewLink?:string;parents?:string[];trashed?:boolean;capabilities?:{canDownload?:boolean}}
export interface DriveDocumentScan {documents:DriveDocumentMetadata[];scan:{foldersScanned:number;requests:number;complete:boolean;limitReason?:string}}
export function isBriefingDocument(file:Pick<GoogleFile,'name'|'mimeType'>,path:string):boolean{
 if(file.mimeType===SHORTCUT||file.mimeType===FOLDER)return false;
 const document=documentMimeTypes.has(file.mimeType)||/\.(txt|pdf|docx?)$/i.test(file.name);
 return document&&(/brief|estrateg|posicionamento|diagnostico|planejamento|direcao editorial/.test(normalized(file.name))||/briefings?\s*(?:&|e|[-_])?\s*docs|02\s*[-_ .]*briefings?/.test(normalized(path)));
}
export function canReadDriveDocument(file:Pick<GoogleFile,'name'|'mimeType'>):boolean{return file.mimeType===GOOGLE_DOC||file.mimeType==='text/plain'||(file.mimeType==='application/octet-stream'&&/\.txt$/i.test(file.name));}
function metadata(file:GoogleFile,path:string):DriveDocumentMetadata{return {id:file.id,name:file.name,mimeType:file.mimeType,path,version:String(file.version||''),...(file.modifiedTime?{modifiedTime:file.modifiedTime}:{}),...(file.size?{size:file.size}:{}),...(file.webViewLink?{webViewLink:file.webViewLink}:{}),canReadText:canReadDriveDocument(file)};}
export async function discoverClientDriveDocuments(folderId:string,accessToken:string,fetcher:typeof fetch=fetch):Promise<DriveDocumentScan>{
 const documents:DriveDocumentMetadata[]=[],visited=new Set<string>(),queue=[{id:folderId,path:''}];let requests=0,foldersScanned=0,limitReason='';
 outer:while(queue.length){
  if(foldersScanned>=DRIVE_DOCUMENT_LIMITS.folders){limitReason='folder_limit';break;}
  const current=queue.shift()!;if(visited.has(current.id))continue;visited.add(current.id);foldersScanned++;
  let pageToken='';const pages=new Set<string>();
  do{
   if(requests>=DRIVE_DOCUMENT_LIMITS.requests){limitReason='request_limit';break outer;}
   const params=new URLSearchParams({q:`'${current.id}' in parents and trashed=false`,pageSize:'100',fields:'nextPageToken,files(id,name,mimeType,parents,version,modifiedTime,size,webViewLink,trashed)',orderBy:'name',supportsAllDrives:'true',includeItemsFromAllDrives:'true',...(pageToken?{pageToken}:{} )});requests++;
   const response=await fetcher(`https://www.googleapis.com/drive/v3/files?${params}`,{headers:{Authorization:`Bearer ${accessToken}`}});if(!response.ok)throw Error('Não foi possível consultar os documentos da pasta do cliente.');
   const data=await response.json();if(!Array.isArray(data.files))throw Error('Resposta de documentos inválida.');
   for(const file of data.files as GoogleFile[]){
    if(file.trashed||!file.parents?.includes(current.id)||!/^[A-Za-z0-9_-]{10,200}$/.test(file.id)||file.mimeType===SHORTCUT)continue;
    const path=current.path?`${current.path}/${file.name}`:file.name;
    if(file.mimeType===FOLDER){if(queue.length+visited.size>=DRIVE_DOCUMENT_LIMITS.folders){limitReason ||= 'folder_limit';continue;}queue.push({id:file.id,path});continue;}
    if(!isBriefingDocument(file,current.path))continue;
    if(documents.length>=DRIVE_DOCUMENT_LIMITS.documents){limitReason='document_limit';break outer;}
    documents.push(metadata(file,path));
   }
   pageToken=typeof data.nextPageToken==='string'?data.nextPageToken:'';
   if(pageToken){if(pages.has(pageToken)){limitReason='repeated_page_token';break outer;}pages.add(pageToken);}
  }while(pageToken);
 }
 return {documents,scan:{foldersScanned,requests,complete:!limitReason,...(limitReason?{limitReason}:{})}};
}
export async function readLimitedUtf8(response:Response,maxBytes=MAX_DRIVE_DOCUMENT_BYTES):Promise<string>{
 if(Number(response.headers.get('Content-Length')||0)>maxBytes){await response.body?.cancel();throw Error('Documento acima de 512 KB. Abra no Drive para revisar.');}
 if(!response.body)throw Error('Documento sem conteúdo.');const reader=response.body.getReader(),parts:Uint8Array[]=[];let length=0;
 try{while(true){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.byteLength;if(length>maxBytes){await reader.cancel();throw Error('Documento acima de 512 KB. Abra no Drive para revisar.');}parts.push(chunk.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
 try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');}catch{throw Error('O documento TXT precisa estar em UTF-8 válido.');}
}
export async function readClientDriveDocument(folderId:string,documentId:string,accessToken:string,fetcher:typeof fetch=fetch):Promise<{document:DriveDocumentMetadata;text:string|null;manualReviewRequired:boolean;reason?:string}>{
 if(!/^[A-Za-z0-9_-]{10,200}$/.test(documentId))throw Error('Documento inválido.');
 const headers={Authorization:`Bearer ${accessToken}`};
 const lookup=async(id:string)=>{const response=await fetcher(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,parents,trashed,version,modifiedTime,size,webViewLink,capabilities(canDownload)&supportsAllDrives=true`,{headers});if(response.status===404||response.status===410)throw new DriveDocumentUnavailableError('Documento removido ou indisponível.');if(!response.ok)throw Error('Documento não está disponível para a conta central.');return await response.json() as GoogleFile;};
 const file=await lookup(documentId);
 if(file.trashed||file.mimeType===SHORTCUT||file.mimeType===FOLDER)throw new DriveDocumentUnavailableError('Documento inválido ou removido.');
 const withinClient=await isFolderDescendant(documentId,folderId,async(id)=>{const item=id===documentId?file:await lookup(id);return item.trashed?[]:(item.parents||[]);});
 if(!withinClient)throw new DriveDocumentUnavailableError('Este documento não pertence à pasta do cliente.');
 const document=metadata(file,file.name);
 if(!canReadDriveDocument(file))return {document,text:null,manualReviewRequired:true,reason:'Formato não possui leitura de texto nesta versão. Abra o documento original e revise os dados antes de salvar.'};
 if(file.capabilities?.canDownload===false)throw Error('O Google não permite baixar ou exportar este documento.');
 if(file.size&&Number(file.size)>MAX_DRIVE_DOCUMENT_BYTES)throw Error('Documento acima de 512 KB. Abra no Drive para revisar.');
 const target=file.mimeType===GOOGLE_DOC?`https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=text%2Fplain`:`https://www.googleapis.com/drive/v3/files/${documentId}?alt=media&supportsAllDrives=true`;
 const response=await fetcher(target,{headers});if(!response.ok)throw Error('Não foi possível ler o texto do documento no Google Drive.');
 if(!file.version)throw Error('O Google não disponibilizou a versão do documento. Atualize antes de revisar.');
 const text=await readLimitedUtf8(response);
 const current=await lookup(documentId);if(current.trashed||String(current.version||'')!==String(file.version||''))throw Error('O documento mudou durante a leitura. Atualize e tente novamente.');
 return {document,text,manualReviewRequired:false};
}
