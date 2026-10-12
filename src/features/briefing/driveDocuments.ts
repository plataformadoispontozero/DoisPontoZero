import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAgencyId, usePermission } from '@/features/auth/AuthProvider';
export interface DriveBriefContext {
 objective?:string; audience?:string; tone?:string; positioning?:string; restrictions?:string; topics?:string[];
}
export interface DriveBriefDocument {
 id:string; agency_id:string; client_id:string; google_file_id:string; name:string; mime_type:string; path:string;
 version:string; reviewed_version:string|null; reviewed_context:DriveBriefContext; reviewed_at:string|null;
 synced_at:string; available:boolean; can_read_text:boolean; web_view_link:string|null;
}
export const DRIVE_CONTEXT_FIELDS = [
 ['objective','Objetivo'],['audience','Público-alvo'],['positioning','Posicionamento e diferenciais'],
 ['tone','Tom de voz'],['restrictions','Restrições e cuidados'],
] as const;
export function currentDriveReview(document:DriveBriefDocument){
 return document.available && document.reviewed_at!==null && document.reviewed_version===document.version;
}
export function useDriveBriefDocuments(clientId?:string){
 const agency=useAgencyId(),briefsAllowed=usePermission('briefings.view'),clientsAllowed=usePermission('clients.view'),allowed=briefsAllowed&&clientsAllowed;
 return useQuery({queryKey:['drive-brief-documents',agency,clientId||'all',allowed],enabled:!!supabase&&!!agency&&allowed,
 queryFn:async()=>{let query=supabase!.from('client_drive_documents').select('*').eq('agency_id',agency).order('synced_at',{ascending:false});if(clientId)query=query.eq('client_id',clientId);
 const all:DriveBriefDocument[]=[];for(let page=0;page<20;page++){const r=await query.range(page*100,page*100+99);if(r.error)throw r.error;all.push(...r.data as DriveBriefDocument[]);if(r.data.length<100)return all;}
 throw Error('A lista excede o limite de consulta. Selecione um cliente para carregar seus documentos.');},staleTime:60000});
}
