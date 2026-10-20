import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {useAgencyId} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'
export interface ProductionReturn {review_id:string;asset_id:string;task_id:string|null;created_at:string}
export function useProductionReturns(presentationId?:string){
 const agency=useAgencyId()
 return useQuery({queryKey:['presentation-production-returns',agency,presentationId],enabled:!!agency&&!!presentationId&&!!supabase,refetchInterval:30000,queryFn:async()=>{const result=await supabase!.from('presentation_review_returns').select('review_id,asset_id,task_id,created_at').eq('agency_id',agency).eq('presentation_id',presentationId!);if(result.error)throw result.error;return (result.data||[]) as ProductionReturn[]}})
}
export function useProductionDestinations(clientId:string|undefined,enabled:boolean,search:string){
 const agency=useAgencyId()
 return useQuery({queryKey:['presentation-production-destinations',agency,clientId,search],enabled:enabled&&!!agency&&!!clientId&&!!supabase,queryFn:async()=>{
  const [projects,tasks]=await Promise.all([
   supabase!.from('projects').select('id,name').eq('agency_id',agency).eq('client_id',clientId!).is('archived_at',null).order('name').limit(200),
   supabase!.from('tasks').select('id,title,status,project:projects!inner(id,name,client_id,archived_at)').eq('agency_id',agency).eq('project.client_id',clientId!).is('project.archived_at',null).is('archived_at',null).neq('status','archived').or('title.like.[Design]%,title.like.[Videomaker]%,title.like.[Tráfego Pago]%').ilike('title',`%${search}%`).order('updated_at',{ascending:false}).limit(200)
  ]);if(projects.error)throw projects.error;if(tasks.error)throw tasks.error
  return {projects:projects.data||[],tasks:(tasks.data||[]).map(task=>({...task,project:Array.isArray(task.project)?task.project[0]:task.project}))}
 }})
}
export function useReturnToProduction(){
 const agency=useAgencyId(),cache=useQueryClient()
 return useMutation({mutationFn:async(input:{reviewId:string;taskId?:string;projectId?:string;department?:string})=>{if(!supabase||!agency)throw Error('Sessão necessária.');const result=await supabase.rpc('return_presentation_review_to_production',{p_agency:agency,p_review:input.reviewId,p_task:input.taskId||null,p_project:input.projectId||null,p_department:input.department||'design'});if(result.error)throw result.error;if(!result.data)throw Error('O reenvio não foi confirmado.');return result.data as {task_id:string|null;already_sent:boolean;created?:boolean}},onSuccess:()=>{for(const key of ['presentation-production-returns','presentation_material_reviews','presentation','presentations','tasks','projects','management-kanban','production-timing'])void cache.invalidateQueries({queryKey:[key]})}})
}
