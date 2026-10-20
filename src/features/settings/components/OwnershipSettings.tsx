import {useEffect,useState} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {useAuth} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'
import {Button} from '@/components/ui/Button'
import type {AgencyMemberUser} from '@/types/whitelabel'

export function OwnershipSettings({members,unavailable=false}:{members:AgencyMemberUser[];unavailable?:boolean}){
 const auth=useAuth(),client=useQueryClient(),agency=auth.activeAgency?.agencyId
 const [action,setAction]=useState<'add'|'transfer'>('add'),[target,setTarget]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 useEffect(()=>{setTarget('');setConfirmed(false);setError('');setMessage('')},[agency,auth.user?.id])
 if(auth.isDemo||auth.activeAgency?.roleName!=='OWNER')return null
 const eligible=members.filter(m=>m.status==='active'&&m.user_id!==auth.user?.id&&(action==='transfer'||m.role_name!=='OWNER'))
 const selected=eligible.find(m=>m.id===target)
 async function submit(){
  if(!confirmed||!selected||busy||unavailable||!supabase||!agency)return
  setBusy(true);setError('');setMessage('')
  try{
   const {data,error:failure}=await supabase.rpc('manage_agency_ownership',{p_agency:agency,p_member:selected.id,p_action:action})
   if(failure||data!==true)throw Error('Não foi possível alterar a gestão. Confira se o membro ainda está ativo e tente novamente.')
   setTarget('');setConfirmed(false)
   setMessage(action==='add'?'Proprietário adicionado. Você mantém seu acesso.':'Gestão transferida. Seu perfil agora é Administrador.')
   await client.invalidateQueries({queryKey:['agencyMembers',agency]})
   auth.reloadAccess()
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível alterar a gestão.')}finally{setBusy(false)}
 }
 return <section aria-label="Proprietários da agência" className="space-y-4 rounded-xl border border-orange-500/30 p-5">
  <div><h2 className="font-semibold">Proprietários da agência</h2><p className="mt-1 text-sm text-zinc-400">Proprietários têm controle total. Escolha alguém de confiança.</p></div>
  <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm"><span>O que deseja fazer?</span><select aria-label="Operação de propriedade" disabled={busy||unavailable} value={action} onChange={e=>{setAction(e.target.value as 'add'|'transfer');setTarget('');setConfirmed(false);setMessage('');setError('')}} className="block w-full rounded-lg border border-white/15 bg-[#191920] p-3"><option value="add">Adicionar proprietário</option><option value="transfer">Transferir gestão</option></select></label><label className="space-y-2 text-sm"><span>Membro da equipe</span><select aria-label="Novo proprietário" disabled={busy||unavailable} value={target} onChange={e=>{setTarget(e.target.value);setConfirmed(false)}} className="block w-full rounded-lg border border-white/15 bg-[#191920] p-3"><option value="">Selecione um membro ativo</option>{eligible.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label></div>
  {!eligible.length&&!unavailable&&<p className="text-sm text-zinc-400">Nenhum membro elegível. Adicione e ative outro membro na equipe primeiro.</p>}
  {selected&&<label className="flex items-start gap-3 rounded-lg bg-white/5 p-3 text-sm"><input type="checkbox" className="mt-1" checked={confirmed} disabled={busy||unavailable} onChange={e=>setConfirmed(e.target.checked)}/><span>{action==='add'?`Confirmo dar acesso total a ${selected.full_name}, mantendo meu acesso de proprietário.`:`Confirmo transferir a gestão para ${selected.full_name}. Meu perfil passará a Administrador.`}</span></label>}
  {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}{message&&<p role="status" className="text-sm text-emerald-300">{message}</p>}
  <Button type="button" disabled={busy||unavailable||!confirmed||!selected} loading={busy} onClick={()=>void submit()}>{action==='add'?'Adicionar proprietário':'Transferir gestão'}</Button>
 </section>
}
