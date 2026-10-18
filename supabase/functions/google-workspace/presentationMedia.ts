export interface PresentationMediaContext {agencyId:string;fileId:string;folderId:string|null}
interface Dependencies {authorize:(request:Request,input:{assetId:string;publicToken?:string})=>Promise<PresentationMediaContext|null>;accessToken:(agency:string)=>Promise<string>;fetch?:typeof fetch}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const imageTypes=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif'])
const maximum=20*1024*1024
export function safeGoogleThumbnail(value:unknown){try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname==='drive.google.com'||u.hostname.endsWith('.googleusercontent.com'))?u.href:null}catch{return null}}
export async function presentationMedia(request:Request,body:Record<string,unknown>,headers:Record<string,string>,deps:Dependencies){
 const reply=(status:number)=>new Response(JSON.stringify({error:'Material indisponível ou acesso não autorizado.'}),{status,headers})
 if(typeof body.assetId!=='string'||!uuid.test(body.assetId)||Object.keys(body).some(k=>!['action','assetId','publicToken'].includes(k))||('publicToken'in body&&(typeof body.publicToken!=='string'||body.publicToken.length<20||body.publicToken.length>512)))return reply(400)
 try{
  const context=await deps.authorize(request,{assetId:body.assetId,publicToken:body.publicToken as string|undefined});if(!context)return reply(403)
  if(!/^[A-Za-z0-9_-]{10,200}$/.test(context.fileId))return reply(404)
  const access=await deps.accessToken(context.agencyId),send=deps.fetch||fetch
  const metadata=await send(`https://www.googleapis.com/drive/v3/files/${context.fileId}?fields=id,mimeType,parents,trashed,size,thumbnailLink&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${access}`},signal:AbortSignal.timeout(15000)})
  if(!metadata.ok)return reply(404)
  const file=await metadata.json();if(file.id!==context.fileId||file.trashed||(context.folderId&&!file.parents?.includes(context.folderId)))return reply(404)
  const original=imageTypes.has(file.mimeType)&&Number(file.size||0)<=maximum
  let url=original?`https://www.googleapis.com/drive/v3/files/${context.fileId}?alt=media&supportsAllDrives=true`:safeGoogleThumbnail(file.thumbnailLink)
  if(!url)return reply(404)
  let response:Response|undefined
  for(let attempt=0;attempt<4;attempt++){
   response=await send(url,{headers:{Authorization:`Bearer ${access}`},redirect:'manual',signal:AbortSignal.timeout(15000)})
   if(response.status<300||response.status>=400)break
   const next=safeGoogleThumbnail(response.headers.get('location'));await response.body?.cancel();if(original||!next)return reply(502);url=next
  }
  const mime=response?.headers.get('content-type')?.split(';')[0].trim()||''
  if(!response?.ok||!imageTypes.has(mime)||Number(response.headers.get('content-length')||0)>maximum){await response?.body?.cancel();return reply(502)}
  const reader=response.body?.getReader();if(!reader)return reply(502)
  const chunks:Uint8Array[]=[];let size=0
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>maximum){await reader.cancel();return reply(413)}chunks.push(part.value)}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
  return new Response(bytes,{headers:{...headers,'Content-Type':'application/octet-stream','X-Presentation-Media-Type':mime,'Access-Control-Expose-Headers':'X-Presentation-Media-Type','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
 }catch{return reply(503)}
}
