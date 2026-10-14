import {useState} from 'react'
import {useInfiniteQuery} from '@tanstack/react-query'
import {Link} from 'react-router-dom'
import {useAgencyId,useAuth,usePermission} from '@/features/auth/AuthProvider'
import {isManagementRole} from '@/features/auth/access'
import {supabase} from '@/lib/supabase/client'
import {PageHeader} from '@/components/ui/PageHeader'
import {TaskDetailPanel} from './components/TaskDetailPanel'
import {useMoveTaskGroup} from '@/features/tasks/hooks/useTasks'
import {ClientKanbanBoard,clientStage} from './components/ClientKanbanBoard'
import {groupTasksByClient} from '@/features/tasks/taskGroups'
import type {Task,BoardColumn} from '@/types/projects'
const stages=[['open','A fazer'],['in_progress','Em produção'],['review','Em revisão'],['done','Concluído']] as const
interface ManagementTask extends Task {available_columns?:BoardColumn[]}
interface Page {tasks:ManagementTask[];has_more:boolean;next_offset:number}
function ManagementKanbanWorkspace(){
 const auth=useAuth(),agency=useAgencyId(),canCreate=usePermission('projects.create'),canReadProjects=usePermission('projects.view'),canReadTasks=usePermission('tasks.view'),canMove=usePermission('tasks.move')
 const allowed=isManagementRole(auth.activeAgency?.roleName)&&canReadProjects&&canReadTasks
 const [search,setSearch]=useState(''),[client,setClient]=useState(''),[stage,setStage]=useState(''),[includeDone,setIncludeDone]=useState(true),[selected,setSelected]=useState<ManagementTask|null>(null),[moveError,setMoveError]=useState('')
 const move=useMoveTaskGroup()
 const query=useInfiniteQuery({queryKey:['management-kanban',agency,auth.user?.id],enabled:!!agency&&allowed,retry:(attempt,error)=>(error as {code?:string})?.code!=='42501'&&attempt<1,initialPageParam:0,getNextPageParam:(last:Page)=>last.has_more?last.next_offset:undefined,queryFn:async({pageParam})=>{if(!supabase)throw new Error('Servidor indisponível');const r=await supabase.rpc('get_management_kanban',{p_agency_id:agency,p_offset:pageParam,p_limit:100});if(r.error)throw r.error;return r.data as Page}})
 const loaded=query.isError?[]:[...new Map((query.data?.pages.flatMap(p=>p.tasks)||[]).map(t=>[t.id,t])).values()]
 const groups=groupTasksByClient(loaded),needle=search.trim().toLocaleLowerCase('pt-BR')
 const visible=groups.filter(g=>(!client||g.id===client)&&(!stage||clientStage(g.tasks)===stage)&&(includeDone||g.tasks.some(t=>t.status!=='done'))&&g.tasks.some(t=>`${t.title} ${t.project?.name||''} ${g.name} ${(t.assignees||[]).map(a=>a.profile?.full_name||'').join(' ')}`.toLocaleLowerCase('pt-BR').includes(needle))).flatMap(g=>g.tasks)
 async function moveTasks(tasks:Task[],status:Task['status']){if(!canMove||move.isPending||!tasks.length)return;setMoveError('');try{await move.mutateAsync({agencyId:agency,taskIds:tasks.map(t=>t.id),status})}catch{setMoveError('Não foi possível movimentar. Nenhuma demanda do grupo foi alterada. Atualize o quadro e confira seu acesso.')}}
 return <div className="space-y-6"><PageHeader title="Kanban Geral" subtitle="Gestão da agência: um card por cliente, com equipes, prazos e etapas de produção." actions={allowed&&canCreate?<Link className="rounded-lg bg-orange-600 px-4 py-2" to="/projects/new">Novo projeto</Link>:undefined}/>{!allowed?<p role="alert">O Kanban geral é exclusivo da gestão com permissão de visualizar projetos e demandas. Consulte suas demandas na área de produção.</p>:<>
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stages.map(([status,label])=><div key={status} className="rounded-xl border border-white/10 bg-white/[.03] p-4"><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-2xl font-semibold">{loaded.filter(t=>t.status===status).length}</p></div>)}</div>
 <div className="grid gap-3 rounded-xl border border-white/10 p-4 md:grid-cols-2 xl:grid-cols-4"><label className="text-sm">Buscar<input aria-label="Buscar cliente, projeto ou demanda" placeholder="Cliente, demanda ou responsável…" value={search} onChange={e=>setSearch(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#19191f] p-3"/></label><label className="text-sm">Cliente<select style={{colorScheme:'dark'}} aria-label="Cliente do Kanban" value={client} onChange={e=>setClient(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#19191f] p-3"><option value="">Todos os clientes carregados</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label className="text-sm">Etapa<select style={{colorScheme:'dark'}} aria-label="Etapa do Kanban" value={stage} onChange={e=>setStage(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#19191f] p-3"><option value="">Todas as etapas</option>{stages.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><div className="flex flex-wrap items-end gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeDone} onChange={e=>setIncludeDone(e.target.checked)}/>Mostrar concluídas</label><button className="rounded-lg border border-white/15 p-2 text-sm" disabled={query.isFetching||move.isPending} onClick={()=>void query.refetch()}>Atualizar quadro</button></div></div>
 <p role="status" className="text-sm text-zinc-400">{visible.length} de {loaded.length} demandas carregadas · {groupTasksByClient(visible).length} clientes{query.hasNextPage?' · há mais demandas para carregar':''}</p>
 {query.isLoading&&<p role="status">Carregando quadro geral…</p>}{query.isError&&<p role="alert">Não foi possível carregar o Kanban geral. <button onClick={()=>void query.refetch()} className="text-orange-300">Tentar novamente</button></p>}{moveError&&<p role="alert" className="rounded-xl border border-red-500/30 p-3 text-red-300">{moveError}</p>}
 <ClientKanbanBoard tasks={visible} canMove={canMove} complete={!query.hasNextPage} busy={move.isPending||query.isFetching} stageFilter={stage} includeDone={includeDone} onMove={moveTasks} onOpen={t=>setSelected(t as ManagementTask)}/>
 {query.hasNextPage&&<p className="text-sm text-orange-300">Carregue todas as demandas antes de movimentar os clientes, para incluir o grupo completo.</p>}
 {query.isSuccess&&!visible.length&&<p className="rounded-xl border border-white/10 p-8 text-zinc-400">Nenhuma demanda neste filtro.</p>}{query.hasNextPage&&<button disabled={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()} className="rounded-lg border border-orange-500/40 px-4 py-3">{query.isFetchingNextPage?'Carregando…':'Carregar mais demandas'}</button>}</>}
 {allowed&&!query.isError&&selected&&<TaskDetailPanel taskId={selected.id} projectId={selected.project_id} agencyId={agency} columns={selected.available_columns||[]} open onClose={()=>setSelected(null)}/>}</div>
}

export function ProjectsPage(){const auth=useAuth();return <ManagementKanbanWorkspace key={`${auth.activeAgency?.agencyId}:${auth.user?.id}`}/> }
