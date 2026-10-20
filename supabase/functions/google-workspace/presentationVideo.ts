import type {PresentationMediaContext} from './presentationMedia.ts'
interface Dependencies {authorize:(request:Request,input:{assetId:string;publicToken?:string})=>Promise<PresentationMediaContext|null>;accessToken:(agency:string)=>Promise<string>;fetch?:typeof fetch}
/** A short-lived encrypted ticket is reauthorized on every range request. Google credentials never reach the browser. */
export async function presentationVideo(request:Request,input:{assetId:string;publicToken?:string},headers:Record<string,string>,deps:Dependencies){
 const fail=(status:number)=>new Response(null,{status,headers})
 try{
  const context=await deps.authorize(request,input);if(!context)return fail(403)
  if(!/^[A-Za-z0-9_-]{10,200}$/.test(context.fileId))return fail(404)
  const access=await deps.accessToken(context.agencyId),send=deps.fetch||fetch
  const metadata=await send(`https://www.googleapis.com/drive/v3/files/${context.fileId}?fields=id,mimeType,parents,trashed&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${access}`},signal:AbortSignal.timeout(15000)})
  if(!metadata.ok)return fail(404)
  const file=await metadata.json()
  if(file.id!==context.fileId||file.trashed||!['video/mp4','video/webm','video/quicktime'].includes(file.mimeType)||(context.folderId&&!file.parents?.includes(context.folderId)))return fail(404)
  const range=request.headers.get('range');if(range&&!/^bytes=\d*-\d*$/.test(range))return fail(416)
  const result=await send(`https://www.googleapis.com/drive/v3/files/${context.fileId}?alt=media&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${access}`,...(range?{Range:range}:{})},redirect:'error',signal:AbortSignal.timeout(30000)})
  if(![200,206,416].includes(result.status))return fail(502)
  const responseHeaders=new Headers({...headers,'Content-Type':file.mimeType,'Cache-Control':'private, no-store','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Access-Control-Expose-Headers':'Content-Range, Accept-Ranges, Content-Length'})
  for(const name of ['content-range','content-length']){const value=result.headers.get(name);if(value)responseHeaders.set(name,value)}
  return new Response(result.body,{status:result.status,headers:responseHeaders})
 }catch{return fail(503)}
}
