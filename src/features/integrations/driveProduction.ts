import {FunctionsHttpError} from '@supabase/supabase-js';
import {supabase} from '@/lib/supabase/client';
import {isGoogleUploadUrl} from '../../../supabase/functions/google-workspace/drive';
export interface DriveFolder {id:string;name:string;canUpload?:boolean;isAppAuthorized?:boolean;canAddChildren?:boolean}
export function driveError(status:number,message?:string){return ({401:'A conexão com o Google precisa ser renovada.',403:message||'Você não tem permissão para esta demanda ou a pasta ainda não está autorizada para envio.',404:'A pasta ou arquivo não foi encontrado no Google Drive.',429:'O Google Drive está limitando temporariamente os envios. Tente novamente.'} as Record<number,string>)[status]||message||'Não foi possível acessar o Google Drive.';}
export async function googleDriveRequest(action:string,context:Record<string,unknown>,extra:Record<string,unknown>={}){
 if(!supabase)throw Error('Conexão indisponível.');
 const {data,error,response}=await supabase.functions.invoke('google-workspace',{body:{...extra,...context,action}});
 if(error instanceof FunctionsHttpError){const detail=await error.context.json().catch(()=>null);throw Error(driveError(error.context.status,detail?.error));}
 if(error||data?.error)throw Error(data?.error||'Não foi possível acessar o Google Drive.');if(data instanceof Blob){const mime=response?.headers.get('X-Preview-Mime');if(!mime||!['image/webp','image/jpeg','image/png'].includes(mime))throw Error('Formato de prévia inválido.');return new Blob([data],{type:mime});}return data;
}
const months=['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
export function recommendDriveFolder(folders:DriveFolder[],period?:string|null){
 const match=period?.match(/^(\d{4})-(\d{2})/),year=match?.[1],month=Number(match?.[2])-1;
 if(!year||month<0||month>11||!Number.isInteger(month))return {name:'',folder:undefined};
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const label=months[month],prefix=String(month+1).padStart(2,'0');
 const same=folders.filter(f=>{const name=normalize(f.name);return name.includes(normalize(label))&&(!/\b20\d{2}\b/.test(name)||name.includes(year));});
 const folder=same.find(f=>f.name.includes(year))||same[0];
 const numbered=folders.some(f=>/^\d{2}\s*-\s*\p{L}+/u.test(f.name));
 return {name:folder?.name||`${numbered?`${prefix} - `:''}${label} ${year}`,folder};
}
export function uploadMime(file:File){if(file.type)return file.type;return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',mov:'video/quicktime',pdf:'application/pdf',psd:'image/vnd.adobe.photoshop',ai:'application/postscript',zip:'application/zip'} as Record<string,string>)[file.name.split('.').pop()?.toLowerCase()||'']||'application/octet-stream';}
export async function uploadDriveChunks(url:string,file:Blob,mime:string,onProgress:(percent:number)=>void,signal:AbortSignal):Promise<{id:string}> {
 if(!isGoogleUploadUrl(url))throw Error('Endereço de envio inválido.');
 const chunkSize=8*1024*1024;let offset=0,recoveries=0;
 const send=(body:Blob|null,start:number,end:number,probe=false)=>new Promise<{status:number;range:string|null;data:any}>((resolve,reject)=>{
  const xhr=new XMLHttpRequest();const abort=()=>xhr.abort();signal.addEventListener('abort',abort,{once:true});
  const clean=()=>signal.removeEventListener('abort',abort);
  xhr.open('PUT',url);xhr.timeout=120000;xhr.setRequestHeader('Content-Type',mime);xhr.setRequestHeader('Content-Range',probe?`bytes */${file.size}`:`bytes ${start}-${end}/${file.size}`);
  xhr.upload.onprogress=e=>{if(!probe&&e.lengthComputable)onProgress(Math.min(99,Math.round((start+e.loaded)/file.size*100)));};
  xhr.onload=()=>{clean();let data;try{data=JSON.parse(xhr.responseText||'null');}catch{data=null;}resolve({status:xhr.status,range:xhr.getResponseHeader('Range'),data});};
  xhr.onerror=xhr.ontimeout=()=>{clean();reject(Error('A conexão foi interrompida durante o envio.'));};xhr.onabort=()=>{clean();reject(new DOMException('Envio cancelado.','AbortError'));};
  if(signal.aborted){clean();reject(new DOMException('Envio cancelado.','AbortError'));return;}xhr.send(body);
 });
 while(offset<file.size){const end=Math.min(offset+chunkSize,file.size)-1;let response;
  try{response=await send(file.slice(offset,end+1),offset,end);}catch(error){if(signal.aborted||recoveries++>=2)throw error;response=await send(null,0,0,true);}
  if(response.status===200||response.status===201){if(!response.data?.id)throw Error('O Google não retornou a referência do arquivo.');onProgress(100);return response.data;}
  if(response.status!==308)throw Error(driveError(response.status,'O Google não concluiu o envio. Tente novamente.'));
  const range=response.range?.match(/bytes=0-(\d+)/),next=range?Number(range[1])+1:0;
  if(next<0||next>file.size||next> end+1)throw Error('Progresso de envio inválido.');
  if(next<=offset&&recoveries++>=2)throw Error('O envio não avançou. Tente novamente.');offset=next;
 }
 throw Error('O Google não confirmou a conclusão do envio.');
}
export async function createDrivePreview(file:File,signal:AbortSignal):Promise<Blob|null>{
 const mime=uploadMime(file);if(!mime.startsWith('image/')&&!mime.startsWith('video/'))return null;
 if(mime==='image/vnd.adobe.photoshop'||file.size>100*1024*1024&&mime.startsWith('image/'))return null;
 const url=URL.createObjectURL(file);let media:HTMLImageElement|HTMLVideoElement|null=null;
 try{
  media=mime.startsWith('video/')?document.createElement('video'):new Image();
  const element=media;await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>finish(Error('Não foi possível gerar a miniatura.')),15000);const abort=()=>finish(new DOMException('Cancelado','AbortError'));function finish(error?:Error){clearTimeout(timeout);signal.removeEventListener('abort',abort);element.onerror=null;if(element instanceof HTMLVideoElement){element.onloadeddata=null;}else element.onload=null;error?reject(error):resolve();}signal.addEventListener('abort',abort,{once:true});element.onerror=()=>finish(Error('Formato sem prévia no navegador.'));if(element instanceof HTMLVideoElement){element.muted=true;element.preload='auto';element.onloadeddata=()=>finish();}else element.onload=()=>finish();if(signal.aborted){abort();return;}element.src=url;});
  if(signal.aborted)return null;const w=media instanceof HTMLVideoElement?media.videoWidth:media.naturalWidth,h=media instanceof HTMLVideoElement?media.videoHeight:media.naturalHeight;if(!w||!h)return null;
  const ratio=Math.min(1,1600/Math.max(w,h)),canvas=document.createElement('canvas');canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);const ctx=canvas.getContext('2d');if(!ctx)return null;ctx.drawImage(media,0,0,canvas.width,canvas.height);return await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.78));
 }catch(error){if(signal.aborted)throw error;return null;}finally{if(media instanceof HTMLVideoElement){media.pause();media.removeAttribute('src');media.load();}URL.revokeObjectURL(url);}
}
