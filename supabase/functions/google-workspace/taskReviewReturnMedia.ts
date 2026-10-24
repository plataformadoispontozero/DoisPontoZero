import {presentationMedia,type PresentationMediaContext} from './presentationMedia.ts'
interface Dependencies {member:(authorization:string)=>any;accessToken:(agency:string)=>Promise<string>}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** History images require the sender/assignee ACL; presentation access is never a substitute. */
export async function taskReviewReturnMedia(request:Request,body:Record<string,unknown>,headers:Record<string,string>,deps:Dependencies){
 const reply=(status:number)=>new Response(JSON.stringify({error:'Prévia indisponível ou acesso não autorizado.'}),{status,headers})
 if(typeof body.reviewId!=='string'||!uuid.test(body.reviewId)||Object.keys(body).some(key=>!['action','reviewId'].includes(key)))return reply(400)
 const authorization=request.headers.get('authorization')||''
 if(!authorization.startsWith('Bearer '))return reply(401)
 const member=deps.member(authorization),identity=await member.auth.getUser()
 if(identity.error||!identity.data.user)return reply(401)
 const result=await member.rpc('get_task_presentation_return_media',{p_review:body.reviewId})
 if(result.error||!result.data||typeof result.data.agencyId!=='string'||!uuid.test(result.data.agencyId)||typeof result.data.googleFileId!=='string')return reply(403)
 const data=result.data
 const context:PresentationMediaContext={agencyId:data.agencyId,fileId:data.googleFileId,folderId:typeof data.folderId==='string'?data.folderId:null,expectedModifiedTime:typeof data.modifiedTime==='string'?data.modifiedTime:null}
 const response=await presentationMedia(request,{assetId:body.reviewId,preview:true},headers,{authorize:async()=>context,accessToken:deps.accessToken})
 if(!response.ok)return response
 const mime=response.headers.get('X-Presentation-Media-Type')||''
 if(!['image/jpeg','image/png','image/webp'].includes(mime)){await response.body?.cancel();return reply(404)}
 const outputHeaders=new Headers(response.headers);outputHeaders.set('X-Preview-Mime',mime);outputHeaders.set('Access-Control-Expose-Headers','X-Preview-Mime, X-Presentation-Media-Type');outputHeaders.set('Cache-Control','private, no-store')
 return new Response(response.body,{status:response.status,headers:outputHeaders})
}
