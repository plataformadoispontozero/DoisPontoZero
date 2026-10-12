export const TASK_DRIVE_MAX_BYTES=500*1024*1024;
export const TASK_DRIVE_PREVIEW_MAX_BYTES=2*1024*1024;
const TYPES:Record<string,string[]>={
 'image/jpeg':['jpg','jpeg'],'image/png':['png'],'image/webp':['webp'],'image/gif':['gif'],
 'video/mp4':['mp4'],'video/quicktime':['mov'],'video/webm':['webm'],
 'application/pdf':['pdf'],'image/vnd.adobe.photoshop':['psd'],'application/vnd.adobe.photoshop':['psd'],
 'application/postscript':['ai'],'application/illustrator':['ai'],'application/zip':['zip'],'application/x-zip-compressed':['zip'],
 'application/octet-stream':['psd','ai'],
};
export function validTaskDriveUpload(v:{name?:unknown;mimeType?:unknown;size?:unknown;kind?:unknown}):string|null{
 if(typeof v.name!=='string'||!v.name.trim()||v.name.length>200||/[\x00-\x1f/\\]/.test(v.name))return 'Nome de arquivo inválido.';
 if(typeof v.mimeType!=='string'||!TYPES[v.mimeType]||!TYPES[v.mimeType].includes(v.name.trim().split('.').pop()?.toLowerCase()||''))return 'Envie JPEG, PNG, WebP, GIF, MP4, MOV, WebM, PDF, PSD, AI ou ZIP com o tipo correto.';
 if(typeof v.size!=='number'||!Number.isSafeInteger(v.size)||v.size<1||v.size>TASK_DRIVE_MAX_BYTES)return 'Envie arquivos de até 500 MB.';
 if(v.kind==='preview'&&(v.mimeType!=='image/webp'||v.size>TASK_DRIVE_PREVIEW_MAX_BYTES))return 'Preview deve ser WebP de até 2 MB.';
 return null;
}
export interface TaskUploadSession {id:string;agency_id:string;task_id:string;client_id:string;folder_id:string;file_name:string;mime_type:string;file_size:number;uploaded_by:string;kind:string;attachment_id?:string|null;expires_at:string;completed_file_id?:string|null}
export function matchesTaskUploadFile(session:TaskUploadSession,file:{id?:string;name?:string;mimeType?:string;size?:string;parents?:string[];version?:string;trashed?:boolean;appProperties?:Record<string,string>}):boolean{
 return !!file.id&&!!file.version&&!file.trashed&&file.name===session.file_name&&file.mimeType===session.mime_type&&String(file.size)===String(session.file_size)&&!!file.parents?.includes(session.folder_id)&&file.appProperties?.uploadId===session.id&&file.appProperties?.agencyId===session.agency_id&&file.appProperties?.clientId===session.client_id&&file.appProperties?.taskId===session.task_id&&file.appProperties?.uploadedBy===session.uploaded_by&&file.appProperties?.kind===session.kind;
}
