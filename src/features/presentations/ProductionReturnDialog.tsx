import {useState} from 'react'
import {useAuth,usePermission} from '@/features/auth/AuthProvider'
import {Dialog,DialogHeader,DialogTitle,DialogContent,DialogFooter} from '@/components/ui/Dialog'
import {Button} from '@/components/ui/Button'
import {useProductionDestinations,useProductionAssignees,useReturnToProduction} from './hooks/useProductionReturns'
import type {MaterialReview} from './hooks/usePresentationReviews'
const field='w-full rounded-xl border border-white/15 bg-[#19191f] p-3 text-sm text-white'
export function ProductionReturnDialog({review,clientId,materialName,productionProjectId,onClose,onSent}:{review:MaterialReview;productionProjectId?:string|null;clientId:string;materialName:string;onClose:()=>void;onSent:(taskId:string|null)=>void}){
 const auth=useAuth();
 const [mode,setMode]=useState('auto'),[task,setTask]=useState(''),[project,setProject]=useState(''),[department,setDepartment]=useState('design'),[search,setSearch]=useState(''),[error,setError]=useState(''),[assigneeIds,setAssigneeIds]=useState<string[]>([]);
 const destinations=useProductionDestinations(clientId,true,search),send=useReturnToProduction(),canCreate=usePermission('tasks.create'),canAssign=usePermission('tasks.assign'),canCreateProject=usePermission('projects.create');
 const tasks=destinations.data?.tasks||[],projects=destinations.data?.projects||[];
 const create=mode==='new'||(mode==='auto'&&!destinations.isLoading&&!destinations.isError&&tasks.length===0&&!search);
 const members=useProductionAssignees(create&&canCreate&&canAssign);
 const selectedTask=tasks.find(item=>item.id===task);
 const currentAssignees=selectedTask?.assignees||[];
 const effectiveProject=project||productionProjectId||'';
 const selectedProject=projects.find(item=>item.id===effectiveProject);
 const availableMembers=(members.data||[]).filter(member=>!effectiveProject||selectedProject?.members?.some(assigned=>assigned.user_id===member.userId));
 const selectedMembers=assigneeIds.filter(id=>availableMembers.some(member=>member.userId===id));
 const blocked=create?(!canCreate||!canAssign||members.isPending||members.isError||selectedMembers.length===0):(!selectedTask||currentAssignees.length===0);
 async function submit(){
  setError('');
  if(blocked){setError('Selecione uma demanda com responsável ou escolha ao menos um responsável para a nova demanda.');return;}
  try{const result=await send.mutateAsync({reviewId:review.id,...(create?{projectId:project||undefined,department,assigneeIds:selectedMembers}:{taskId:task})});onSent(result.task_id)}catch(cause){setError(cause&&typeof cause==='object'&&'message'in cause?String(cause.message):'Não foi possível reenviar. Tente novamente.')}
 }
 return <Dialog open onOpenChange={open=>{if(!open&&!send.isPending)onClose()}} className="max-w-xl"><DialogHeader onClose={()=>{if(!send.isPending)onClose()}}><DialogTitle>Reenviar para produção</DialogTitle></DialogHeader><DialogContent><div className="space-y-5">
 <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="font-medium">{materialName}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-300">{review.note||'Revisar o material reprovado com o cliente.'}</p></div>
 <p className="text-sm leading-relaxed text-zinc-300">Enviado por <strong>{auth.name||'sua conta atual'}</strong>. O ajuste será direcionado aos responsáveis da demanda e à conta que está fazendo este envio.</p>
 {destinations.isLoading?<p role="status" className="text-sm text-zinc-400">Buscando demandas deste cliente…</p>:destinations.isError?<div role="alert" className="text-sm text-red-300">Não foi possível consultar os destinos. <button className="underline" onClick={()=>void destinations.refetch()}>Tentar novamente</button></div>:<>
 <label className="grid gap-2 text-sm">Como encaminhar<select className={field} value={create?'new':'existing'} disabled={send.isPending} onChange={e=>{setMode(e.target.value);setError('')}}><option value="existing">Reabrir uma demanda existente</option>{canCreate&&<option value="new">Criar uma demanda de ajuste</option>}</select></label>
 {!create?<>
 <label className="grid gap-2 text-sm">Buscar demanda<input value={search} onChange={e=>{setSearch(e.target.value);setTask('')}} disabled={send.isPending} className={field} placeholder="Título da demanda"/></label>
 <label className="grid gap-2 text-sm">Demanda de produção<select className={field} value={task} onChange={e=>setTask(e.target.value)} disabled={send.isPending}><option value="">Selecione a demanda do material</option>{tasks.map(item=><option key={item.id} value={item.id}>{item.title} · {item.project?.name}</option>)}</select></label>
 {!tasks.length&&<p className="text-sm text-zinc-400">Nenhuma demanda encontrada. Tente outro título ou crie uma demanda de ajuste.</p>}
 {selectedTask&&<section className="space-y-2 rounded-xl border border-white/15 p-4"><h3 className="text-sm font-medium">Responsáveis atuais</h3>{currentAssignees.length?<ul className="space-y-1 text-sm text-zinc-300">{currentAssignees.map(member=><li key={member.user_id}>{member.profile?.full_name||'Membro atribuído'}</li>)}</ul>:<p role="alert" className="text-sm text-amber-200">Esta demanda precisa ter ao menos um responsável. Faça a atribuição no card antes de reenviar o ajuste.</p>}</section>}
 <p className="text-xs leading-relaxed text-zinc-400">Até 200 resultados por busca. Responsáveis e prazo da demanda existente serão mantidos. O retorno do cliente e a referência do material ficam registrados no histórico do card.</p>
 </>:<>
 {!canCreate?<p role="alert" className="text-sm text-amber-200">Seu perfil precisa de permissão para criar uma demanda de ajuste.</p>:<>
 <label className="grid gap-2 text-sm">Setor<select className={field} value={department} disabled={send.isPending} onChange={e=>setDepartment(e.target.value)}><option value="design">Design</option><option value="video">Vídeo & Motion</option><option value="traffic">Tráfego Pago</option></select></label>
 <label className="grid gap-2 text-sm">Projeto<select className={field} value={project} disabled={send.isPending} onChange={e=>{setProject(e.target.value);setAssigneeIds([])}}><option value="">Projeto de ajustes desta apresentação</option>{projects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
 {!canAssign?<p role="alert" className="text-sm text-amber-200">Seu perfil precisa da permissão de atribuir demandas para escolher os responsáveis. Peça o encaminhamento a um gestor.</p>:<fieldset className="space-y-3 rounded-xl border border-white/15 p-4" disabled={send.isPending}><legend className="px-1 text-sm font-medium">Responsáveis · selecione ao menos um</legend>{members.isPending?<p role="status" className="text-sm text-zinc-400">Carregando membros ativos…</p>:members.isError?<p role="alert" className="text-sm text-red-300">Não foi possível consultar os responsáveis. <button type="button" className="underline" onClick={()=>void members.refetch()}>Tentar novamente</button></p>:!availableMembers.length?<p className="text-sm text-amber-200">Nenhum membro ativo disponível neste projeto. Adicione um responsável ao projeto ou escolha outro destino.</p>:<div className="max-h-52 overflow-y-auto">{availableMembers.map(member=><label key={member.userId} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={assigneeIds.includes(member.userId)} onChange={event=>setAssigneeIds(previous=>event.target.checked?[...previous,member.userId]:previous.filter(id=>id!==member.userId))}/>{member.name}</label>)}</div>}</fieldset>}
 <p className="text-xs leading-relaxed text-zinc-400">Será criada uma demanda em produção com os responsáveis selecionados, o retorno do cliente e a referência do material. O projeto de ajustes será criado, se necessário, e reutilizado nos próximos envios. Confira o prazo no card depois do envio.</p>
 {!project&&!canCreateProject&&<p className="text-xs text-amber-200">Se não houver projeto de ajustes vinculado, selecione um projeto existente ou peça sua criação ao responsável.</p>}
 </>}
 </>}
 </>}{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}</div></DialogContent><DialogFooter><Button variant="outline" disabled={send.isPending} onClick={onClose}>Cancelar</Button><Button loading={send.isPending} disabled={send.isPending||destinations.isLoading||destinations.isError||blocked} onClick={()=>void submit()}>{create?'Criar e enviar ajuste':'Confirmar reenvio'}</Button></DialogFooter></Dialog>
}
