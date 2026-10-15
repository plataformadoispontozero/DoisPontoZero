import type {PresentationMediaContext} from './presentationMedia.ts'
interface Dependencies {admin:any;member:(authorization:string)=>any}
export async function authorizePresentationMedia(request:Request,input:{assetId:string;publicToken?:string},deps:Dependencies):Promise<PresentationMediaContext|null>{
 const admin=deps.admin

     let agency:string,presentationId:string,asset:any
     if(input.publicToken){
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.publicToken)))).map(n=>n.toString(16).padStart(2,'0')).join('')
      const link=await admin.from('presentation_public_links').select('agency_id,presentation_id,expires_at,revoked_at').eq('token_hash',digest).is('revoked_at',null).maybeSingle()
      if(link.error||!link.data||(link.data.expires_at&&Date.parse(link.data.expires_at)<=Date.now()))return null
      agency=link.data.agency_id;presentationId=link.data.presentation_id
      const presentation=await admin.from('presentations').select('id').eq('id',presentationId).eq('agency_id',agency).eq('status','published').is('archived_at',null).maybeSingle()
      if(presentation.error||!presentation.data)return null
      const result=await admin.from('presentation_assets').select('file_reference_id').eq('id',input.assetId).eq('presentation_id',presentationId).eq('agency_id',agency).maybeSingle();if(result.error||!result.data)return null;asset=result.data
     }else{
      const authorization=request.headers.get('authorization')||'';if(!authorization.startsWith('Bearer '))return null
      const member=deps.member(authorization)
      const identity=await member.auth.getUser();if(identity.error||!identity.data.user)return null
      const result=await member.from('presentation_assets').select('agency_id,presentation_id,file_reference_id').eq('id',input.assetId).maybeSingle();if(result.error||!result.data)return null;asset=result.data;agency=asset.agency_id;presentationId=asset.presentation_id
      const permission=await member.rpc('has_agency_permission',{p_agency_id:agency,p_permission_key:'presentations.view'});if(permission.error||permission.data!==true)return null
     }
     if(!asset.file_reference_id)return null
     const reference=await admin.from('drive_file_references').select('google_file_id,parent_folder_id,availability_status').eq('id',asset.file_reference_id).eq('agency_id',agency).maybeSingle()
     if(reference.error||!reference.data||reference.data.availability_status!=='available')return null
     return {agencyId:agency,fileId:reference.data.google_file_id,folderId:reference.data.parent_folder_id}
    
}
