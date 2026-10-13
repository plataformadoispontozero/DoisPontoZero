import {useAgencyId,useAuth} from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase/client';
export type MaterialDecision = 'approved' | 'changes_requested' | 'rejected';
export interface MaterialReview { id:string; asset_id:string; decision:MaterialDecision; note:string; created_at:string }
export function usePresentationReviews(presentationId?:string) {
 const agency=useAgencyId(),userId=useAuth().user?.id;
 return useQuery({queryKey:['presentation_material_reviews',agency,userId,presentationId],enabled:!!agency&&!!userId&&!!presentationId&&!!supabase,queryFn:async()=>{
  if(!supabase) return [] as MaterialReview[];
  const {data,error}=await supabase.from('presentation_material_reviews').select('id,asset_id,decision,note,created_at').eq('agency_id',agency).eq('presentation_id',presentationId!).order('created_at',{ascending:false});
  if(error) throw error; return (data||[]) as MaterialReview[];
 },refetchInterval:30000});
}
export function latestMaterialReviews(reviews:MaterialReview[]) {
 const result:Record<string,{decision:MaterialDecision;note:string}>={};
 for(const review of reviews) if(!result[review.asset_id]) result[review.asset_id]={decision:review.decision,note:review.note};
 return result;
}
