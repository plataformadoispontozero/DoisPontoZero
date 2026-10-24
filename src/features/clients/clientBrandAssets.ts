import {supabase} from '@/lib/supabase/client'
import {prepareSiteImage} from '@/features/public-site/prepareSiteImage'
export async function uploadClientLogo(file:File,agencyId:string,clientId:string){
 if(!supabase||!agencyId||!clientId)throw new Error('Sessão necessária para enviar a logo.')
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Use uma imagem PNG, JPG ou WebP de até 5 MB.')
 const blob=await prepareSiteImage(file)
 const key=`${agencyId}/${clientId}/${crypto.randomUUID()}.webp`,result=await supabase.storage.from('client-brand-media').upload(key,blob,{contentType:'image/webp',upsert:false})
 if(result.error)throw new Error('Não foi possível enviar a logo. Confira sua permissão de edição de clientes.')
 return supabase.storage.from('client-brand-media').getPublicUrl(result.data.path).data.publicUrl
}
