import {useEffect,useRef,useState} from 'react'
import {useAgencyId} from '@/features/auth/AuthProvider'
import {googleDriveRequest} from '@/features/integrations/driveProduction'
interface Material{id:string;name:string;mimeType:string}
interface Listing{files:Material[];folder:{id:string;name:string};rootId:string;nextPageToken:string|null}
export function ClientPresentationDrivePicker({clientId,presentationId,sectionId,onLinked,onCancel}:{clientId:string;presentationId:string;sectionId:string;onLinked:()=>void;onCancel:()=>void}){
 const agencyId=useAgencyId(),[listing,setListing]=useState<Listing|null>(null),[path,setPath]=useState<{id:string;name:string}[]>([]),[selected,setSelected]=useState<string[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const identity=useRef('');identity.current=`${agencyId}:${clientId}:${presentationId}:${sectionId}`;const sequence=useRef(0);
 async function load(folderId?:string,append=false,nextPath?:{id:string;name:string}[]){
  const current=identity.current,request=++sequence.current;setBusy(true);setError('');
  try{const data:Listing=await googleDriveRequest('client-drive-list',{agencyId,clientId},{...(folderId?{folderId}:{}),...(append&&listing?.nextPageToken?{pageToken:listing.nextPageToken}:{})});if(identity.current!==current||sequence.current!==request)return;
   setListing(old=>({...data,files:append&&old?[...old.files,...data.files.filter(f=>!old.files.some(p=>p.id===f.id))]:data.files}));if(!append){setSelected([]);setPath(nextPath||[data.folder]);}
  }catch(e){if(identity.current===current&&sequence.current===request)setError(e instanceof Error?e.message:'Não foi possível acessar a pasta.');}
  finally{if(identity.current===current&&sequence.current===request)setBusy(false);}
 }
 useEffect(()=>{setListing(null);setPath([]);setSelected([]);void load();return()=>{sequence.current++};},[agencyId,clientId,presentationId,sectionId]); // eslint-disable-line react-hooks/exhaustive-deps
 async function link(){const current=identity.current;setBusy(true);setError('');try{await googleDriveRequest('presentation-drive-link',{agencyId,clientId},{presentationId,sectionId,folderId:listing?.folder.id,fileIds:selected});if(identity.current===current)onLinked();}catch(e){if(identity.current===current)setError(e instanceof Error?e.message:'Falha ao vincular os materiais.');}finally{if(identity.current===current)setBusy(false);}}
 return <section className="space-y-4" aria-label="Selecionar materiais do Drive do cliente"><p className="text-sm text-[var(--color-text-secondary)]">Navegue pela pasta vinculada a este cliente. Os arquivos continuam no Google Drive.</p>
 <nav aria-label="Pastas do cliente" className="flex flex-wrap gap-2">{path.map((folder,index)=><button key={folder.id} disabled={busy} className="text-orange-300 underline" onClick={()=>void load(folder.id,false,path.slice(0,index+1))}>{folder.name}</button>)}</nav>
 {busy&&<p role="status">Carregando materiais…</p>}{error&&<div role="alert"><p className="text-orange-300">{error}</p><button disabled={busy} className="underline" onClick={()=>void load(listing?.folder.id,false,path.length?path:undefined)}>Tentar novamente</button></div>}
 {!busy&&!error&&listing&&!listing.files.length&&<p>Esta pasta está vazia.</p>}
 <ul className="max-h-72 overflow-auto divide-y divide-white/10">{listing?.files.map(file=><li key={file.id} className="py-3">{file.mimeType==='application/vnd.google-apps.folder'?<button disabled={busy} className="text-orange-300" onClick={()=>void load(file.id,false,[...path,{id:file.id,name:file.name}])}>📁 {file.name}</button>:file.mimeType==='application/vnd.google-apps.shortcut'?<span className="text-gray-400">{file.name} · atalho indisponível</span>:<label className="flex gap-3 items-center"><input type="checkbox" disabled={busy||(!selected.includes(file.id)&&selected.length>=20)} checked={selected.includes(file.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,file.id]:old.filter(id=>id!==file.id))}/><span className="break-all">{file.name}</span></label>}</li>)}</ul>
 {listing?.nextPageToken&&<button disabled={busy} className="underline" onClick={()=>void load(listing.folder.id,true)}>Carregar mais materiais</button>}
 <div className="flex gap-3 justify-end"><button onClick={onCancel} disabled={busy}>Cancelar</button><button className="rounded-lg bg-orange-600 px-4 py-2 disabled:opacity-50" disabled={busy||!selected.length} onClick={()=>void link()}>Vincular {selected.length?`(${selected.length})`:''} à seção</button></div></section>
}
