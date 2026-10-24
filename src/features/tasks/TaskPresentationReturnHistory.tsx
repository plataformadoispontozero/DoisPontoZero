import {useEffect,useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useAgencyId,useAuth} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'
import {googleDriveRequest} from '@/features/integrations/driveProduction'
import {Dialog,DialogHeader,DialogTitle,DialogBody} from '@/components/ui/Dialog'

interface PresentationReturnEntry {
 id:string
 asset_id:string
 material_title:string
 note:string
 decision:'changes_requested'|'rejected'
 returned_at:string
 actor_name:string|null
 has_preview:boolean
}
function useTaskPresentationReturns(taskId:string){
 const agencyId=useAgencyId(),userId=useAuth().user?.id
 return useQuery<PresentationReturnEntry[]>({queryKey:['task-presentation-return-history',agencyId,userId,taskId],enabled:!!supabase&&!!agencyId&&!!userId&&!!taskId,queryFn:async()=>{
  if(!supabase)throw new Error('Conexão indisponível.')
  const {data,error}=await supabase.rpc('get_task_presentation_returns',{p_agency:agencyId,p_task:taskId})
  if(error)throw new Error('Não foi possível consultar os retornos do cliente.')
  if(!Array.isArray(data))throw new Error('O servidor não confirmou o histórico de retornos.')
  return data as PresentationReturnEntry[]
 },refetchInterval:30000,staleTime:0})
}
function ReturnMaterialPreview({entry,taskId}:{entry:PresentationReturnEntry;taskId:string}){
 const agencyId=useAgencyId(),userId=useAuth().user?.id,[preview,setPreview]=useState<{blob:Blob;url:string}|null>(null),[expanded,setExpanded]=useState(false),[imageFailed,setImageFailed]=useState(false)
 const query=useQuery({queryKey:['task-return-preview',agencyId,userId,taskId,entry.id],enabled:!!agencyId&&!!userId&&entry.has_preview,queryFn:async()=>{
  const data=await googleDriveRequest('task-review-return-media',{}, {reviewId:entry.id})
  if(!(data instanceof Blob))throw new Error('A imagem não está disponível.')
  return data
 },staleTime:60000,gcTime:0,retry:false,refetchOnWindowFocus:false})
 useEffect(()=>{setImageFailed(false);if(!query.data)return;const url=URL.createObjectURL(query.data);setPreview({blob:query.data,url});return()=>URL.revokeObjectURL(url)},[query.data])
 const url=preview?.blob===query.data?preview?.url:undefined
 if(!entry.has_preview)return null
 return <div className="mt-4">{url&&!imageFailed?<button type="button" onClick={()=>setExpanded(true)} className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 focus-visible:outline-orange-500" aria-label={`Ampliar material ${entry.material_title}`}><img src={url} alt={entry.material_title} loading="lazy" onError={()=>setImageFailed(true)} className="max-h-64 w-full rounded-lg object-contain"/></button>:<div className="rounded-xl border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)]"><p role="status">{query.isError||imageFailed?'Prévia do material indisponível.':'Carregando imagem do material…'}</p>{(query.isError||imageFailed)&&<button type="button" className="mt-2 underline" onClick={()=>void query.refetch()}>Tentar novamente</button>}</div>}
 <Dialog open={expanded&&!!url&&!imageFailed} onOpenChange={setExpanded} className="max-w-4xl"><DialogHeader onClose={()=>setExpanded(false)}><DialogTitle>{entry.material_title}</DialogTitle></DialogHeader><DialogBody><img src={url} alt={entry.material_title} className="max-h-[75dvh] w-full object-contain"/></DialogBody></Dialog></div>
}
export function TaskPresentationReturnHistory({taskId}:{taskId:string}){
 const query=useTaskPresentationReturns(taskId)
 if(query.isError)return <p role="alert" className="rounded-xl border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-secondary)]">Não foi possível consultar os retornos do cliente. <button type="button" className="underline" onClick={()=>void query.refetch()}>Tentar novamente</button></p>
 if(query.isLoading)return <p role="status" className="text-xs text-[var(--color-text-secondary)]">Consultando retornos do cliente…</p>
 if(!query.data?.length)return null
 return <section aria-label="Ajustes solicitados pelo cliente" className="space-y-3">{query.data.map(entry=><article key={entry.id} className="rounded-xl border border-orange-500/30 bg-[var(--color-surface)] p-4 text-[var(--color-text-primary)]"><p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Ajuste solicitado pelo cliente</p><h3 className="mt-2 text-sm font-semibold">{entry.material_title}</h3><p className="mt-2 text-xs text-[var(--color-text-secondary)]">Encaminhado por {entry.actor_name||'Membro da equipe'} · <time dateTime={entry.returned_at}>{new Date(entry.returned_at).toLocaleString('pt-BR')}</time></p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{entry.note||'Sem observação registrada.'}</p><ReturnMaterialPreview key={entry.id} entry={entry} taskId={taskId}/></article>)}</section>
}
