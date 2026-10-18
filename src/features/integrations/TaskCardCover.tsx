import {useEffect,useRef,useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useAgencyId} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'
import {googleDriveRequest} from './driveProduction'
export interface TaskCoverImage {attachment_id:string;file_name:string}
export interface TaskCover {task_id:string;attachment_id:string;file_name:string;selected:boolean;gallery?:TaskCoverImage[]}
export function useTaskCardCovers(taskIds:string[]){
 const agency=useAgencyId(),ids=[...new Set(taskIds)].sort(),key=ids.join(',')
 return useQuery<TaskCover[]>({queryKey:['task-card-covers',agency,key],enabled:!!supabase&&!!agency&&ids.length>0,staleTime:60000,queryFn:async()=>{const covers:TaskCover[]=[];for(let i=0;i<ids.length;i+=500){const r=await supabase!.rpc('get_task_card_covers',{p_tasks:ids.slice(i,i+500)});if(r.error)throw r.error;covers.push(...(r.data||[]))}return covers}})
}
export function TaskCardCover({cover,onOpen,carousel=false}:{cover:TaskCover;onOpen?:()=>void;carousel?:boolean}){
 const agencyId=useAgencyId(),images=cover.gallery?.length?cover.gallery:[{attachment_id:cover.attachment_id,file_name:cover.file_name}], [index,setIndex]=useState(0),[url,setUrl]=useState(''),[error,setError]=useState(false),gesture=useRef<{x:number;y:number;id:number}|null>(null)
 const current=images[Math.min(index,images.length-1)]||images[0]
 useEffect(()=>{let active=true,objectUrl='';setUrl('');setError(false);void googleDriveRequest('task-drive-preview',{agencyId,taskId:cover.task_id},{attachmentId:current.attachment_id}).then(blob=>{if(!active||!(blob instanceof Blob))return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>{if(active)setError(true)});return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[agencyId,cover.task_id,current.attachment_id])
 const move=(delta:number)=>setIndex(i=>(Math.min(i,images.length-1)+delta+images.length)%images.length)
 const image=url&&!error?<img draggable={false} src={url} alt={`${images.length>1?'Lâmina':'Capa'} ${current.file_name}`} onError={()=>setError(true)} loading="lazy" className="max-h-64 w-full rounded-lg bg-black/20 object-contain"/>:<span role={error?'status':'progressbar'} className="flex h-20 items-center justify-center text-xs text-zinc-400">{error?'Prévia indisponível':'Carregando imagem…'}</span>
 const gallery=<div className="mb-3" onPointerDown={e=>{e.stopPropagation();if(e.isPrimary&&e.button===0){gesture.current={x:e.clientX,y:e.clientY,id:e.pointerId}}}} onPointerCancel={e=>{gesture.current=null;e.stopPropagation()}} onPointerUp={e=>{e.stopPropagation();const start=gesture.current;gesture.current=null;if(!start||start.id!==e.pointerId)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)*1.4)move(x<0?1:-1)}} onClick={e=>e.stopPropagation()} onDragStart={e=>e.preventDefault()} style={{touchAction:'pan-y'}}>{onOpen?<button type="button" className="block w-full" aria-label={`Abrir demanda com capa ${current.file_name}`} onClick={onOpen}>{image}</button>:image}{carousel&&images.length>1&&<div className="mt-2 flex items-center justify-center gap-3"><button type="button" aria-label="Lâmina anterior" className="rounded border border-white/20 px-3 py-1" onClick={()=>move(-1)}>‹</button><span role="status" className="text-xs text-zinc-400">{index+1} / {images.length}</span><button type="button" aria-label="Próxima lâmina" className="rounded border border-white/20 px-3 py-1" onClick={()=>move(1)}>›</button></div>}</div>
 return gallery
}
