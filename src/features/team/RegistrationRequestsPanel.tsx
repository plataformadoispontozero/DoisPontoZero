import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth, useAgencyId, usePermission } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { memberRoleOptions } from './memberRoleOptions'
import { professions } from './teamProfessions'
interface RequestRow {id:string;email:string;full_name:string;profession:string;status:string;created_at:string}
export function RegistrationRequestsPanel({roles}:{roles:{id:string;name:string;description?:string|null}[]}){
 const auth=useAuth(),agencyId=useAgencyId(),permission=usePermission('members.registration.review')
 const canReview=permission&&['OWNER','ADMIN','MANAGER'].includes(auth.activeAgency?.roleName||'')
 const cache=useQueryClient(),[selected,setSelected]=useState<Record<string,string>>({}),[confirmed,setConfirmed]=useState<Record<string,boolean>>({}),[busy,setBusy]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('')
 const options=memberRoleOptions(roles.filter(role=>role.name!=='ADMIN'||auth.activeAgency?.roleName==='OWNER'))
 const requests=useQuery({queryKey:['team-registration-requests',agencyId],enabled:!!supabase&&!!agencyId&&canReview,refetchInterval:15000,queryFn:async()=>{
  const {data,error}=await supabase!.from('agency_registration_requests').select('id,email,full_name,profession,status,created_at').eq('agency_id',agencyId).eq('status','pending').order('created_at',{ascending:false})
  if(error)throw error
  return (data||[]) as RequestRow[]
 }})
 async function review(row:RequestRow,action:'approve'|'reject'){
  if(!supabase)return
  setError('');setMessage('')
  if(action==='approve'&&(!confirmed[row.id]||!options.some(r=>r.value===selected[row.id]))){setError('Confira a identidade e escolha o papel de acesso antes de aprovar.');return}
  setBusy(row.id)
  try {
   const {data,error:failure}=await supabase.functions.invoke('team-registration',{body:{action,agencyId,requestId:row.id,roleId:selected[row.id],identityConfirmed:confirmed[row.id]===true}})
   if(failure){let text='Não foi possível revisar o cadastro.';try{text=(await failure.context?.json())?.error||text}catch{};throw Error(text)}
   if(data?.error)throw Error(data.error)
   if(!data?.reviewed)throw Error('O servidor não confirmou a revisão.')
   await Promise.all([cache.invalidateQueries({queryKey:['team-registration-requests']}),cache.invalidateQueries({queryKey:['agencyMembers']}),cache.invalidateQueries({queryKey:['notifications']})])
   setMessage(action==='approve'?'Cadastro aprovado. O profissional já pode entrar com a senha criada.':'Cadastro recusado. Nenhum acesso foi liberado.')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível revisar o cadastro.')}
  finally{setBusy('')}
 }
 if(!canReview)return null
 return <section className="rounded-xl border border-orange-400/30 p-5 space-y-4" aria-labelledby="registration-requests-title">
 <div><h2 id="registration-requests-title" className="text-lg font-semibold">Cadastros aguardando aprovação</h2><p className="text-sm text-[#B8B8C0]">Confirme com o profissional o nome e o e-mail. Este fluxo depende da sua revisão de identidade, pois não envia confirmação por e-mail.</p></div>
 {error&&<p role="alert" className="text-red-300">{error}</p>}{message&&<p role="status">{message}</p>}
 {requests.isLoading?<p role="status">Carregando solicitações…</p>:requests.isError?<div role="alert"><p>Não foi possível carregar os cadastros.</p><Button onClick={()=>void requests.refetch()}>Tentar novamente</Button></div>:!requests.data?.length?<p className="text-sm text-[#B8B8C0]">Nenhum cadastro pendente.</p>:requests.data.map(row=><article key={row.id} className="rounded-xl border border-[#30303B] p-4 space-y-3">
 <h3 className="font-semibold">{row.full_name}</h3><p className="text-sm break-all">{row.email}</p><p className="text-xs text-[#B8B8C0]">{professions.find(p=>p.value===row.profession)?.label||row.profession} · {new Date(row.created_at).toLocaleString('pt-BR')}</p>
 <div><label htmlFor={'role-'+row.id}>Papel de acesso a liberar</label><Select id={'role-'+row.id} value={selected[row.id]||''} onChange={e=>setSelected(p=>({...p,[row.id]:e.target.value}))} options={[{value:'',label:'Selecione um papel'},...options]}/></div>
 <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed[row.id]||false} onChange={e=>setConfirmed(p=>({...p,[row.id]:e.target.checked}))}/>Conferi a identidade do profissional e confirmei que este e-mail pertence a ele.</label>
 <div className="flex flex-wrap gap-2"><Button onClick={()=>void review(row,'approve')} variant="primary" disabled={!!busy||!confirmed[row.id]||!selected[row.id]} loading={busy===row.id}>Aprovar e ativar</Button><Button onClick={()=>void review(row,'reject')} disabled={!!busy} variant="outline">Recusar cadastro</Button></div>
 </article>)}
 </section>
}
