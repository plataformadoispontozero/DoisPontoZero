import {useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {Link} from 'react-router-dom'
import {useAgencyId,useAuth,usePermission} from '@/features/auth/AuthProvider'
import {isManagementRole} from '@/features/auth/access'
import {supabase} from '@/lib/supabase/client'
import {PageHeader} from '@/components/ui/PageHeader'
import {TaskDetailPanel} from './components/TaskDetailPanel'
import {useProjectBoard} from './hooks/useProjects'
import {groupTasksByClient} from '@/features/tasks/taskGroups'
import type {Task} from '@/types/projects'
export function ProjectsPage(){
 const auth=useAuth(),agency=useAgencyId(),canCreate=usePermission('projects.create'),allowed=isManagementRole(auth.activeAgency?.roleName)
 const [search,setSearch]=useState(''),[selected,setSelected]=useState<Task|null>(null)
 const board=useProjectBoard(selected?.project_id)
 const query=useQuery({queryKey:['management-kanban',agency],enabled:!!agency&&allowed,queryFn:async()=>{const r=await supabase!.rpc('get_management_kanban',{p_agency_id:agency});if(r.error)throw r.error;return r.data as {tasks:Task[];has_more:boolean}}})
 const tasks=(query.data?.tasks||[]).filter(t=>`${t.title} ${t.project?.name} ${t.project?.client?.name}`.toLowerCase().includes(search.toLowerCase()))
 return <div className="space-y-6"><PageHeader title="Kanban Geral" subtitle="Visão de gestão: clientes, equipes e entregas em um único quadro." actions={allowed&&canCreate?<Link className="rounded-lg bg-orange-600 px-4 py-2" to="/projects/new">Novo projeto</Link>:undefined}/>{!allowed?<p role="alert">O Kanban geral é exclusivo da gestão. Consulte suas demandas na área de produção.</p>:<>
 <input aria-label="Buscar cliente, projeto ou demanda" placeholder="Buscar cliente, projeto ou demanda…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#19191f] p-3"/>
 {query.isLoading&&<p role="status">Carregando quadro geral…</p>}{query.isError&&<p role="alert">Não foi possível carregar o Kanban geral. <button onClick={()=>void query.refetch()} className="text-orange-300">Tentar novamente</button></p>}
 {groupTasksByClient(tasks).map(group=><section key={group.id} aria-label={`Kanban de ${group.name}`} className="rounded-2xl border border-white/10 p-4"><h2 className="mb-4 text-lg font-semibold">{group.name} <span className="text-sm text-zinc-400">· {group.tasks.length} demandas</span></h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[['open','A fazer'],['in_progress','Em produção'],['review','Em revisão'],['done','Concluído']].map(([status,label])=><div key={status} className="min-w-0 rounded-xl bg-white/5 p-3"><h3 className="mb-3 flex justify-between text-sm font-medium">{label}<span>{group.tasks.filter(t=>t.status===status).length}</span></h3><div className="space-y-2">{group.tasks.filter(t=>t.status===status).map(t=><button key={t.id} onClick={()=>setSelected(t)} className="w-full rounded-lg border border-white/10 bg-[#19191f] p-3 text-left hover:border-orange-500"><p className="text-xs text-zinc-400">{t.project?.name}</p><p className="mt-2 break-words text-sm font-medium">{t.title}</p><p className="mt-3 text-xs text-orange-300">{t.due_date?.slice(0,10).split('-').reverse().join('/')||'Sem prazo'} · Abrir demanda</p></button>)}</div></div>)}</div></section>)}
 {query.isSuccess&&!tasks.length&&<p className="rounded-xl border border-white/10 p-8 text-zinc-400">Nenhuma demanda neste filtro.</p>}{query.data?.has_more&&<p role="status">Exibindo as primeiras 500 demandas por prazo. Consulte também os projetos específicos.</p>}</>}
 {selected&&<TaskDetailPanel taskId={selected.id} projectId={selected.project_id} agencyId={agency} columns={board.data?.columns||[]} open onClose={()=>setSelected(null)}/>}</div>
}
