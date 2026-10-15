import {useEffect,useState} from 'react'
import {supabase} from '@/lib/supabase/client'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isManagedPresentationAsset(asset:{id:string;file_reference?:unknown;file_reference_id?:string|null;web_view_link?:string|null;thumbnail_reference?:string|null}){return uuid.test(asset.id)&&!!(asset.file_reference||asset.file_reference_id||asset.web_view_link?.startsWith('https://drive.google.com/')||asset.thumbnail_reference?.includes('.googleusercontent.com/'))}
export async function loadPresentationAsset(assetId:string,publicToken?:string){
 if(!supabase)throw Error('Conexão indisponível.')
 const result=await supabase.functions.invoke('google-workspace',{body:{action:'presentation-media',assetId,...(publicToken?{publicToken}:{})},timeout:30000})
 const mime=result.response?.headers.get('X-Presentation-Media-Type')||result.data?.type
 if(result.error||!(result.data instanceof Blob)||!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(mime))throw Error('Não foi possível carregar a imagem do material.')
 return result.data.type===mime?result.data:new Blob([result.data],{type:mime})
}
export function usePresentationImage(asset:{id:string;file_reference?:unknown;file_reference_id?:string|null;web_view_link?:string|null;thumbnail_reference?:string|null},publicToken?:string){
 const managed=isManagedPresentationAsset(asset),key=asset.id+':'+(publicToken||''),[result,setResult]=useState<{key:string;url?:string;error?:boolean}>({key:''})
 useEffect(()=>{if(!managed)return;let active=true,url:string|undefined;setResult({key})
 void loadPresentationAsset(asset.id,publicToken).then(blob=>{if(!active)return;url=URL.createObjectURL(blob);setResult({key,url})}).catch(()=>{if(active)setResult({key,error:true})})
 return()=>{active=false;if(url)URL.revokeObjectURL(url)}
 },[managed,asset.id,key,publicToken])
 return {managed,url:result.key===key?result.url:undefined,error:result.key===key&&result.error}
}
export function PresentationAssetThumbnail({asset}:{asset:{id:string;title:string;file_reference?:{thumbnail_reference?:string|null};file_reference_id?:string|null}}){
 const [failedUrl,setFailedUrl]=useState<string|undefined>(undefined)
 const image=usePresentationImage(asset),url=image.managed?image.url:asset.file_reference?.thumbnail_reference
 return url&&url!==failedUrl?<img onError={()=>setFailedUrl(url)} src={url} alt={asset.title} loading="lazy" className="mb-3 h-40 w-full rounded-xl object-contain bg-black/20"/>:<p className="mb-3 flex h-40 items-center justify-center rounded-xl bg-black/20 text-xs text-zinc-400">{image.error||failedUrl===url&&!!url?'Imagem indisponível':'Carregando imagem…'}</p>
}
