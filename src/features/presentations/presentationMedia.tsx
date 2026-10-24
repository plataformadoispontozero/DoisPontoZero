import {useEffect,useRef,useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase/client'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isManagedPresentationAsset(asset:{id:string;file_reference?:unknown;file_reference_id?:string|null;web_view_link?:string|null;thumbnail_reference?:string|null}){return uuid.test(asset.id)&&!!(asset.file_reference||asset.file_reference_id||asset.web_view_link?.startsWith('https://drive.google.com/')||asset.thumbnail_reference?.includes('.googleusercontent.com/'))}
export async function loadPresentationAsset(assetId:string,publicToken?:string,preview=true){
 if(!supabase)throw Error('Conexão indisponível.')
 const result=await supabase.functions.invoke('google-workspace',{body:{action:'presentation-media',assetId,preview,...(publicToken?{publicToken}:{})},timeout:45000})
 const mime=result.response?.headers.get('X-Presentation-Media-Type')||result.data?.type
 if(result.error||!(result.data instanceof Blob)||!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(mime))throw Error('Não foi possível carregar a imagem do material.')
 return result.data.type===mime?result.data:new Blob([result.data],{type:mime})
}
export function usePresentationImage(asset:{id:string;file_reference?:unknown;file_reference_id?:string|null;web_view_link?:string|null;thumbnail_reference?:string|null},publicToken?:string,options:{enabled?:boolean;full?:boolean}={}){
 const managed=isManagedPresentationAsset(asset)
 const query=useQuery({queryKey:['presentation-media',publicToken||'member',asset.id,options.full?'original':'preview1200'],enabled:managed&&options.enabled!==false,queryFn:()=>loadPresentationAsset(asset.id,publicToken,!options.full),staleTime:5*60_000,gcTime:5*60_000,retry:1,refetchOnWindowFocus:false})
 const [result,setResult]=useState<{blob:Blob;url:string}|null>(null)
 useEffect(()=>{if(!query.data)return;const url=URL.createObjectURL(query.data);setResult({blob:query.data,url});return()=>URL.revokeObjectURL(url)},[query.data])
 return {managed,url:result?.blob===query.data?result?.url:undefined,error:query.isError,retry:()=>query.refetch()}

}
export function PresentationAssetThumbnail({asset}:{asset:{id:string;title:string;file_reference?:{thumbnail_reference?:string|null};file_reference_id?:string|null}}){
 const [failedUrl,setFailedUrl]=useState<string|undefined>(undefined)
 const host=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false)
 useEffect(()=>{if(!host.current)return;if(typeof IntersectionObserver==='undefined'){setVisible(true);return}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect()}},{rootMargin:'200px'});observer.observe(host.current);return()=>observer.disconnect()},[])
 const image=usePresentationImage(asset,undefined,{enabled:visible}),url=image.managed?image.url:asset.file_reference?.thumbnail_reference
 return <div ref={host}>{url&&url!==failedUrl?<img onError={()=>setFailedUrl(url)} src={url} alt={asset.title} loading="lazy" className="mb-3 h-40 w-full rounded-xl object-contain bg-black/20"/>:<p className="mb-3 flex h-40 items-center justify-center rounded-xl bg-black/20 text-xs text-zinc-400">{image.error||failedUrl===url&&!!url?'Imagem indisponível':visible?'Carregando imagem…':'Prévia do material'}</p>}</div>
}
