import {useQuery} from '@tanstack/react-query'
import {useAuth} from '@/features/auth/AuthProvider'
import {supabase,isSupabaseConfigured} from '@/lib/supabase/client'
import type {Client} from '@/types/projects'

export interface PaginatedClientOptions {page:number;pageSize:number;search:string;status:'all'|'active'|'inactive'}
export function usePaginatedClients(agencyId:string,options:PaginatedClientOptions){
 const userId=useAuth().user?.id
 const page=Math.max(0,Math.floor(options.page)),pageSize=[12,24,48].includes(options.pageSize)?options.pageSize:24,search=options.search.trim()
 return useQuery<{clients:Client[];total:number}>({
  queryKey:['clients',agencyId,{paginated:true,page,pageSize,search,status:options.status,userId}],enabled:!!agencyId&&!!userId,
  queryFn:async({signal})=>{
   if(!isSupabaseConfigured||!supabase)throw new Error('Não foi possível conectar à lista de clientes.')
   let request=supabase.from('clients').select('id,agency_id,name,slug,logo_url,status,created_at,updated_at',{count:'exact'}).eq('agency_id',agencyId)
   request=options.status==='all'?request.neq('status','archived'):request.eq('status',options.status)
   if(search){
    // Quote the PostgREST operand and escape LIKE wildcards so punctuation stays literal.
    const pattern=JSON.stringify(`%${search.replace(/[\\%_]/g,'\\$&')}%`)
    request=request.or(`name.ilike.${pattern},slug.ilike.${pattern}`)
   }
   const {data,count,error}=await request.order('name',{ascending:true}).order('id',{ascending:true}).range(page*pageSize,(page+1)*pageSize-1).abortSignal(signal)
   if(error)throw new Error(error.message)
   if(count===null)throw new Error('O servidor não confirmou o total de clientes.')
   return {clients:(data||[]) as Client[],total:count}
  },
 })
}
export function useClientListCounts(agencyId:string){const userId=useAuth().user?.id;return useQuery({
 queryKey:['clients',agencyId,'list-counts',userId],enabled:!!agencyId&&!!userId,
 queryFn:async({signal})=>{
  if(!isSupabaseConfigured||!supabase)throw new Error('Contagem de clientes indisponível.')
  const results=await Promise.all(['active','inactive'].map(status=>supabase!.from('clients').select('id',{count:'exact',head:true}).eq('agency_id',agencyId).eq('status',status).abortSignal(signal)))
  for(const result of results)if(result.error||result.count===null)throw new Error('Não foi possível consultar os totais de clientes.')
  const active=results[0].count!,inactive=results[1].count!
  return {active,inactive,total:active+inactive}
 },
})}
