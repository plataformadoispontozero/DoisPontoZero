import {useState,useEffect} from 'react'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase/client'
import {useAuth} from '@/features/auth/AuthProvider'
import {Button} from '@/components/ui/Button'
import {Card,CardContent} from '@/components/ui/Card'
import {toast} from '@/components/ui/Toast'
import {initialRoles,initialPermissions} from './hooks/useAgencySettings'
import {accessSectors,readPermission,roleLabel,sectorLevel,type AccessLevel,type AccessPermission} from './sectorAccess'

export const PermissionStudioPage=()=>{
 const auth=useAuth(),agencyId=auth.activeAgency?.agencyId??'',client=useQueryClient()
 const [draft,setDraft]=useState<Record<string,boolean>|null>(null),[saving,setSaving]=useState(false),[selected,setSelected]=useState('')
 const query=useQuery({queryKey:['permission-matrix',agencyId,auth.user?.id],enabled:!!agencyId,refetchOnWindowFocus:false,queryFn:async()=>{
  if(auth.isDemo||!supabase)return {roles:initialRoles,permissions:initialPermissions,grants:[] as any[]}
  const [roleResult,permissionResult]=await Promise.all([supabase.from('roles').select('id, name').eq('agency_id',agencyId).order('name'),supabase.from('permissions').select('id, permission_key, module, description').neq('module','proposals').order('permission_key')])
  if(roleResult.error)throw roleResult.error
  if(permissionResult.error)throw permissionResult.error
  const roles=roleResult.data??[],ids=roles.map((role:any)=>role.id)
  const result=ids.length?await supabase.from('role_permissions').select('role_id, permission_id, allowed').in('role_id',ids):{data:[],error:null}
  if(result.error)throw result.error
  return {roles,permissions:permissionResult.data??[],grants:result.data??[]}
 }})
 const {roles=[],permissions=[],grants=[]}=query.data??{}
 const base=Object.fromEntries(grants.map((grant:any)=>[`${grant.role_id}_${grant.permission_id}`,grant.allowed])),matrix=draft??base
 const canEdit=!auth.isDemo&&!!auth.activeAgency&&(auth.activeAgency.roleName==='OWNER'||auth.permissions.has('permissions.manage'))&&!!query.data&&!query.isError
 useEffect(()=>{setDraft(null);setSelected('')},[agencyId,auth.user?.id])
 const role=roles.find((r:any)=>r.id===selected)||roles.find((r:any)=>r.name==='MEMBER')||roles.find((r:any)=>r.name!=='OWNER')||roles[0]
 const sectors=accessSectors(permissions)
 const changes=roles.filter((r:any)=>r.name!=='OWNER').flatMap((r:any)=>permissions.filter((p:any)=>!!matrix[`${r.id}_${p.id}`]!==!!base[`${r.id}_${p.id}`]).map((p:any)=>({role_id:r.id,permission_id:p.id,allowed:!!matrix[`${r.id}_${p.id}`]})))
 const disabled=saving||query.isFetching||!canEdit||role?.name==='OWNER'
 async function save(event:React.FormEvent){
  event.preventDefault()
  if(!canEdit||saving||query.isFetching||!changes.length||!supabase)return
  setSaving(true)
  try{
   const {error}=await supabase.rpc('set_agency_role_permissions',{p_agency_id:agencyId,p_changes:changes})
   if(error)throw error
   await client.invalidateQueries({queryKey:['permission-matrix',agencyId,auth.user?.id]})
   setDraft(null);auth.reloadAccess();toast.success('Acessos salvos.')
  }catch{toast.error('Não foi possível salvar os acessos. Tente novamente.')}finally{setSaving(false)}
 }
 function change(items:AccessPermission[],level:AccessLevel){
  if(disabled||!role||level==='custom')return
  setDraft({...matrix,...Object.fromEntries(items.map(p=>[`${role.id}_${p.id}`,level==='work'||(level==='read'&&readPermission(p))]))})
 }
 return <form onSubmit={save} className="space-y-5">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-lg font-bold">Acessos por setor</h3><p className="mt-1 text-sm text-zinc-400">Escolha um perfil e defina o acesso de todos que usam esse perfil.</p></div><Button type="submit" disabled={!canEdit||saving||query.isFetching||!changes.length} loading={saving}>Salvar acessos</Button></div>
  {query.isLoading&&<p role="status">Carregando acessos…</p>}
  {query.isError&&<p role="alert">Não foi possível carregar os acessos. Tente atualizar a página.</p>}
  {role&&<><label className="block max-w-sm space-y-2 text-sm"><span>Perfil de acesso</span><select aria-label="Perfil de acesso" value={role.id} disabled={saving} onChange={e=>setSelected(e.target.value)} className="w-full rounded-lg border border-white/15 bg-[#191920] p-3 text-white">{roles.map((r:any)=><option key={r.id} value={r.id}>{roleLabel(r.name)}</option>)}</select></label>
  {role.name==='OWNER'?<p className="rounded-xl border border-orange-500/30 p-4 text-sm">Proprietários têm acesso total. Para adicionar um proprietário ou transferir a gestão, use a Gestão de Equipe.</p>:<p className="text-xs leading-relaxed text-zinc-400">Visualizar permite consultar e exportar. Trabalhar também permite criar, editar e gerenciar, incluindo exclusões disponíveis no setor. A liberação não remove as restrições por agência, cliente ou função.</p>}
  <Card><CardContent className="divide-y divide-white/10">{sectors.map(sector=>{
   const level=role.name==='OWNER'?'work':sectorLevel(sector.permissions,role.id,matrix)
   const supportsRead=sector.readOnlySupported&&sector.permissions.some(readPermission)
   return <div key={sector.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><div><h4 className="text-sm font-medium">{sector.label}</h4>{level==='custom'&&<p className="mt-1 text-xs text-zinc-400">Acesso anterior preservado. Escolha um nível para padronizar.</p>}{!supportsRead&&role.name!=='OWNER'&&<p className="mt-1 text-xs text-zinc-400">Este setor não oferece modo somente leitura.</p>}</div><select aria-label={`Acesso a ${sector.label}`} value={level} disabled={disabled} onChange={e=>change(sector.permissions,e.target.value as AccessLevel)} className="w-full rounded-lg border border-white/15 bg-[#191920] p-3 text-sm text-white disabled:opacity-60 sm:w-56"><option value="none">Sem acesso</option>{supportsRead&&<option value="read">Visualizar</option>}<option value="work">Trabalhar</option>{level==='custom'&&<option value="custom" disabled>Personalizado (atual)</option>}</select></div>
  })}</CardContent></Card></>}
  {auth.isDemo&&<p className="text-sm text-zinc-400">Prévia: alterações não são salvas.</p>}
 </form>
}
