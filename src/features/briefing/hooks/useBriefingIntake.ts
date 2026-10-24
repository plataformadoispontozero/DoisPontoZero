import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {useAgencyId,useAuth} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'
export interface BriefingLead {id:string;name:string;company:string;email:string;phone:string;services:string[];objective:string;budget:string;created_at:string}
export function useBriefingLeads(enabled:boolean){
 const agency=useAgencyId(),user=useAuth().user?.id
 return useQuery<BriefingLead[]>({queryKey:['briefing-intake-leads',agency,user],enabled:enabled&&!!agency&&!!supabase,retry:false,queryFn:async()=>{
  const {data,error}=await supabase!.rpc('get_briefing_intake_leads',{p_agency:agency})
  if(error)throw error
  if(!Array.isArray(data))throw Error('Não foi possível consultar as solicitações.')
  return data as BriefingLead[]
 }})
}
export function useCreateBriefingIntake(){
 const agency=useAgencyId(),cache=useQueryClient()
 return useMutation({mutationFn:async(input:{requestId:string;leadId?:string;name:string;contactName:string;email:string;phone:string;templateId:string;title:string;description:string})=>{
  if(!supabase||!agency)throw Error('Conexão indisponível. Nenhum cadastro confirmado.')
  const {data,error}=await supabase.rpc('create_briefing_intake',{p_agency:agency,p_request:input.requestId,p_lead:input.leadId||null,p_identity:{name:input.name,contactName:input.contactName,email:input.email,phone:input.phone},p_template:input.templateId,p_title:input.title,p_description:input.description})
  if(error)throw Error(error.code==='PGRST202'?'O cadastro de entrada aguarda ativação no servidor.':error.message)
  if(!data||typeof data.briefing_id!=='string')throw Error('O cadastro não foi confirmado pelo servidor.')
  return data as {briefing_id:string;client_id:string}
 },onSuccess:()=>{for(const key of ['clients','briefings','briefing-intake-leads','site-leads'])void cache.invalidateQueries({queryKey:[key]})}})
}
