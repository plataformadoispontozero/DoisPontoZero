import {useAgencyId,useAuth} from '@/features/auth/AuthProvider'
import {useQuery} from '@tanstack/react-query'
import {supabase} from '../../../lib/supabase/client'
export type MaterialDecision = 'approved' | 'changes_requested' | 'rejected'
export interface MaterialReview {id:string;asset_id:string;decision:MaterialDecision;note:string;created_at:string}
export interface PresentationCurrentReview {
 total:number;approved:number;adjustments:number;pending:number
 reviews:MaterialReview[];history:MaterialReview[]
 completion:{completedAt:string;total:number}|null
 linkGeneratedAt:string|null
}
export function usePresentationReviews(presentationId?:string) {
 const agency=useAgencyId(),userId=useAuth().user?.id
 const query=useQuery<PresentationCurrentReview>({
  queryKey:['presentation_material_reviews',agency,userId,presentationId],
  enabled:!!agency&&!!userId&&!!presentationId&&!!supabase,
  queryFn:async()=>{
   if(!supabase)throw new Error('Conexão indisponível.')
   const {data,error}=await supabase.rpc('get_presentation_current_review',{p_agency:agency,p_presentation:presentationId!})
   if(error)throw new Error(error.message)
   if(!data||!Array.isArray(data.reviews)||!Array.isArray(data.history))throw new Error('O servidor não confirmou o estado atual das avaliações.')
   return data as PresentationCurrentReview
  },refetchInterval:30000,
 })
 return {...query,data:query.data?.reviews,history:query.data?.history,completion:query.data?.completion,linkGeneratedAt:query.data?.linkGeneratedAt,progress:query.data?{total:query.data.total,approved:query.data.approved,adjustments:query.data.adjustments,pending:query.data.pending}:undefined}
}
export function latestMaterialReviews(reviews:MaterialReview[]) {
 const result:Record<string,{decision:MaterialDecision;note:string}>={}
 for(const review of [...reviews].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)))if(!result[review.asset_id])result[review.asset_id]={decision:review.decision,note:review.note}
 return result
}
