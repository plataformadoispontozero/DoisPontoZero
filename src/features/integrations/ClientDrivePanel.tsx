import { useEffect, useRef, useState } from 'react';
import {useQueryClient} from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useAgencyId, usePermission } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { validateDriveUpload, isGoogleUploadUrl, DRIVE_MEDIA_TYPES } from '../../../supabase/functions/google-workspace/drive';
import {authorizeClientFolder} from './googlePicker';
export interface DriveMaterial { id: string; name: string; mimeType: string; webViewLink?: string; modifiedTime?: string; size?: string }
export function ClientDrivePanel({clientId}: {clientId: string}) {
  const queryClient=useQueryClient();
  const agencyId = useAgencyId(), canUpload = usePermission('tasks.edit'), canEditClient = usePermission('clients.edit');
  const [files, setFiles] = useState<DriveMaterial[]>([]), [error,setError] = useState(''), [busy,setBusy] = useState(false), [progress,setProgress] = useState<number|null>(null), [loaded,setLoaded] = useState(false), [nextPage,setNextPage] = useState<string|null>(null), [selected,setSelected]=useState<string[]>([]), [reviewLink,setReviewLink]=useState('');
  const identity = useRef(''); identity.current = `${agencyId}:${clientId}`;
  const upload = useRef<XMLHttpRequest|null>(null);
  async function request(action: string, extra: Record<string,unknown> = {}) {
    if(!supabase || !agencyId) throw Error('Conexão indisponível.');
    const {data,error} = await supabase.functions.invoke('google-workspace',{body:{agencyId,clientId,action,...extra}});
    if(error instanceof FunctionsHttpError){const detail=await error.context.json().catch(()=>null);throw Error(detail?.error || 'Não foi possível acessar o Google Drive.');}
    if(error || data?.error) throw Error(data?.error || 'Não foi possível acessar o Google Drive.');
    return data;
  }
  useEffect(()=>()=>{upload.current?.abort();},[agencyId,clientId]);
  async function load(append=false) {
    const current=identity.current;setBusy(true);setError('');
    try {const data=await request('client-drive-list',append&&nextPage?{pageToken:nextPage}:{});if(identity.current!==current)return;setFiles(previous=>append?[...previous,...data.files.filter((f:DriveMaterial)=>!previous.some(p=>p.id===f.id))]:data.files);setNextPage(data.nextPageToken);setLoaded(true);}
    catch(e){if(identity.current===current)setError(e instanceof Error?e.message:'Falha ao consultar materiais.');}
    finally{if(identity.current===current)setBusy(false);}
  }
  async function authorize(){
    const current=identity.current;setBusy(true);setError('');
    try{const session=await request('client-picker-session');if(identity.current!==current)return;await authorizeClientFolder(session);if(identity.current===current)await load();}
    catch(e){if(identity.current===current)setError(e instanceof Error?e.message:'Não foi possível autorizar a pasta.');}
    finally{if(identity.current===current)setBusy(false);}
  }
  async function send(file:File) {
    const invalid=validateDriveUpload({name:file.name,mimeType:file.type,size:file.size});if(invalid){setError(invalid);return;}
    const current=identity.current;setBusy(true);setError('');setProgress(0);
    try {
      const data=await request('client-drive-upload-start',{name:file.name,mimeType:file.type,size:file.size});
      if(identity.current!==current)return;
      if(!isGoogleUploadUrl(data.uploadUrl))throw Error('Endereço de envio inválido.');
      await new Promise<void>((resolve,reject)=>{
        const xhr=new XMLHttpRequest();upload.current=xhr;xhr.open('PUT',data.uploadUrl);xhr.setRequestHeader('Content-Type',file.type);xhr.timeout=15*60*1000;
        xhr.upload.onprogress=e=>{if(e.lengthComputable&&identity.current===current)setProgress(Math.round(e.loaded/e.total*100));};
        xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(Error('O Google não concluiu o envio. Atualize a pasta antes de tentar novamente.'));
        xhr.onerror=()=>reject(Error('A conexão foi interrompida. Atualize a pasta antes de repetir o envio.'));
        xhr.ontimeout=()=>reject(Error('O envio demorou demais. Atualize a pasta antes de tentar novamente.'));
        xhr.onabort=()=>reject(Error('Envio cancelado.'));xhr.send(file);
      });
      if(identity.current===current)await load();
    }catch(e){if(identity.current===current)setError(e instanceof Error?e.message:'Não foi possível enviar o arquivo.');}
    finally{if(identity.current===current){setBusy(false);setProgress(null);}upload.current=null;}
  }
  async function createFolder(){setBusy(true);setError('');try{await request('client-drive-create-folder');await Promise.all([queryClient.invalidateQueries({queryKey:['clients',agencyId]}),queryClient.invalidateQueries({queryKey:['client',agencyId,clientId]})]);await load();}catch(e){setError(e instanceof Error?e.message:'Não foi possível criar a pasta.');}finally{setBusy(false);}}
  async function publish(){setBusy(true);setError('');try{const r=await supabase!.functions.invoke('drive-material-approval',{body:{action:'publish',agencyId,clientId,fileIds:selected}});if(r.error||r.data?.error)throw Error('Não foi possível criar o link de revisão.');setReviewLink(r.data.link);}catch(e){setError(e instanceof Error?e.message:'Falha ao publicar.');}finally{setBusy(false);}}
  return <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 space-y-4" aria-label="Materiais no Drive do cliente">
    <div><h3 className="font-semibold text-lg">Materiais do cliente · Google Drive</h3><p className="text-sm text-[var(--color-text-secondary)] mt-1">Consulte a pasta vinculada no cadastro e envie imagens ou vídeos sem sair da produção. Os arquivos permanecem privados no Google Drive.</p></div>
    <div className="flex flex-wrap gap-3 items-center"><button disabled={busy} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-50" onClick={()=>void load()}>Atualizar materiais</button>
      {canUpload&&<button disabled={busy} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-50" onClick={()=>void authorize()}>Autorizar pasta existente</button>}
      {canUpload&&<label className={`rounded-lg bg-[#c84408] px-4 py-2 cursor-pointer ${busy?'opacity-50':''}`}>Enviar imagem ou vídeo<input aria-label="Enviar material para a pasta do cliente" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" disabled={busy} onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void send(f);}}/></label>}
      {canEditClient&&<button disabled={busy} className="rounded-lg border border-white/20 px-4 py-2" onClick={()=>void createFolder()}>Criar pasta para este cliente</button>}
      <Link className="text-sm underline" to="/settings/integrations/google">Configurar conexão</Link></div>
    {progress!==null&&<div role="status"><p>Enviando: {progress}%</p><progress className="w-full accent-orange-600" value={progress} max={100}/><button className="text-sm underline" onClick={()=>upload.current?.abort()}>Cancelar envio</button></div>}
    {error&&<p role="alert" className="text-orange-300">{error}</p>}
    {!loaded&&!error&&<p className="text-sm text-[var(--color-text-secondary)]">Atualize para carregar os arquivos reais da pasta. Uma pasta existente precisa estar autorizada para o aplicativo (drive.file).</p>}
    {loaded&&!files.length&&!error&&<p>Nenhum arquivo disponível nesta pasta para a conta conectada.</p>}
    {files.length>0&&<ul className="divide-y divide-white/10">{files.map(file=><li className="py-3 flex items-center justify-between gap-3" key={file.id}><div className="min-w-0">{canUpload&&DRIVE_MEDIA_TYPES.has(file.mimeType)&&<input aria-label={`Selecionar ${file.name} para revisão`} type="checkbox" checked={selected.includes(file.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,file.id]:old.filter(id=>id!==file.id))}/>}<p className="truncate font-medium">{file.name}</p><p className="text-xs text-[var(--color-text-secondary)]">{file.mimeType.startsWith('video/')?'Vídeo':file.mimeType.startsWith('image/')?'Imagem':'Arquivo'}{file.modifiedTime?` · ${new Date(file.modifiedTime).toLocaleDateString('pt-BR')}`:''}</p></div>{file.webViewLink&&/^https:\/\/(drive|docs)\.google\.com\//.test(file.webViewLink)&&<a className="text-sm underline shrink-0" href={file.webViewLink} target="_blank" rel="noreferrer">Abrir no Drive</a>}</li>)}</ul>}
    {canUpload&&selected.length>0&&<button disabled={busy} className="rounded-lg bg-[#c84408] px-4 py-3" onClick={()=>void publish()}>Gerar link de aprovação ({selected.length})</button>}
    {reviewLink&&<div><p>Link válido por 14 dias. Envie ao cliente:</p><input aria-label="Link de aprovação" readOnly value={reviewLink} className="w-full rounded-lg bg-black/20 p-3" onFocus={e=>e.target.select()}/></div>}
    {nextPage&&<button disabled={busy} className="underline" onClick={()=>void load(true)}>Carregar mais arquivos</button>}
    <p className="text-xs text-[var(--color-text-secondary)]">Imagens JPEG, PNG, WebP e GIF; vídeos MP4, MOV e WebM, até 500 MB. A consulta não torna o material público nem envia automaticamente para aprovação.</p>
  </section>;
}
