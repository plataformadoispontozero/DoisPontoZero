import {useQuery} from '@tanstack/react-query'
import {useAgencyId,useAuth,usePermission} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'
import type {ProductionTiming} from './productionTiming'
export function useProductionTiming(ids:string[]){const agency=useAgencyId(),auth=useAuth(),allowed=usePermission('tasks.view');const sorted=[...ids].sort();return useQuery({queryKey:['production-timing',agency,auth.user?.id,sorted],enabled:!!agency&&allowed&&sorted.length>0,retry:false,refetchInterval:60000,queryFn:async()=>{if(!supabase)throw new Error('Servidor indisponível');const result:ProductionTiming[]=[];for(let i=0;i<sorted.length;i+=500){const r=await supabase.rpc('get_production_timing',{p_agency_id:agency,p_task_ids:sorted.slice(i,i+500)});if(r.error)throw r.error;result.push(...(r.data||[]))}return result}})}
