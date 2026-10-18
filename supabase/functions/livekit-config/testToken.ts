import type {SupabaseClient} from 'npm:@supabase/supabase-js@2.117.3'
import {RoomServiceClient,TokenVerifier} from 'npm:livekit-server-sdk@2.19.1'
import type {LivekitConfiguration} from '../_shared/livekitConfig.ts'
export class SafeTokenTestError extends Error {}
export async function testAuthenticatedToken(client:SupabaseClient,admin:SupabaseClient,configuration:LivekitConfiguration,agency:string,user:string,authorization:string){
 const label='TESTE FICTÍCIO — Verificação token LiveKit — '+crypto.randomUUID()
 let room:string|null=null;let serviceRoom:string|null=null;let passed=false;let cleanup=true
 const service=new RoomServiceClient(configuration.url.replace(/^wss:/,'https:'),configuration.apiKey,configuration.apiSecret)
 try{
  const created=await client.rpc('chat_create_channel',{p_agency:agency,p_name:label.slice(0,80),p_description:'Teste técnico temporário autorizado; removido ao terminar.',p_visibility:'private',p_type:'custom',p_members:[]});if(created.error||typeof created.data!=='string')throw new SafeTokenTestError('Não foi possível criar a sala privada de teste. Confira suas permissões de Chat.')
  room=created.data;serviceRoom=`office_${agency}_${room}`
  const enabled=await client.rpc('office_configure_room',{p_agency:agency,p_room:room,p_enabled:true});if(enabled.error)throw new SafeTokenTestError('Não foi possível habilitar a sala de teste.')
  const endpoint=(Deno.env.get('SUPABASE_URL')||'')+'/functions/v1/office-room-token'
  const invoke=async()=>await fetch(endpoint,{method:'POST',headers:{Authorization:authorization,apikey:Deno.env.get('SUPABASE_ANON_KEY')||'','content-type':'application/json'},body:JSON.stringify({roomId:room})})
  const response=await invoke();if(response.status!==200)throw new SafeTokenTestError('A emissão autenticada do token falhou.')
  const issued=await response.json();const claims=await new TokenVerifier(configuration.apiKey,configuration.apiSecret).verify(issued.token)
  const decoded=JSON.parse(atob(issued.token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))
  if(claims.sub!==user||claims.video?.room!==serviceRoom||claims.video?.roomJoin!==true||claims.video?.roomAdmin!==false||decoded.exp-decoded.nbf!==120)throw new SafeTokenTestError('As permissões ou a validade do token não conferem.')
  const validation=await fetch(new URL('/rtc/validate?protocol=15&sdk=js&version=2.0.0',configuration.url.replace(/^wss:/,'https:')),{headers:{Authorization:'Bearer '+issued.token}})
  if(!validation.ok)throw new SafeTokenTestError('O LiveKit não aceitou o token emitido.')
  const disabled=await client.rpc('office_configure_room',{p_agency:agency,p_room:room,p_enabled:false});if(disabled.error)throw new SafeTokenTestError('Não foi possível encerrar a sala de teste.')
  if((await invoke()).status!==403)throw new SafeTokenTestError('A sala desabilitada não foi bloqueada.')
  passed=true
 }finally{
  if(serviceRoom){try{const rooms=await service.listRooms([serviceRoom]);for(const r of rooms)if(r.name===serviceRoom)await service.deleteRoom(r.name)}catch{cleanup=false}}
  if(room){const removed=await admin.from('chat_channels').delete().eq('id',room).eq('agency_id',agency).eq('created_by',user).eq('name',label.slice(0,80)).select('id');if(removed.error||removed.data?.length!==1)cleanup=false}
  if(!cleanup)throw new SafeTokenTestError('Não foi possível confirmar a limpeza da sala de teste. Solicite uma revisão técnica.')
 }
 if(!passed)throw new SafeTokenTestError('O teste não foi concluído.')
 const receipt={provider_verified:true,authenticated_endpoint_status:200,signature_verified:true,identity_and_namespace_verified:true,expires_in:120,provider_token_validation_status:200,disabled_room_status:403,temporary_records_cleaned:true,no_media_started:true}
 const audit=await admin.from('audit_logs').insert({agency_id:agency,actor_user_id:user,action:'office.livekit.token_verified',entity_type:'office_configuration',entity_id:agency,metadata:receipt});if(audit.error)throw new SafeTokenTestError('Teste passou, mas não foi possível registrar a evidência.')
 return {verified:true,tokenVerified:true,message:'Emissão autenticada, assinatura e aceitação do token pelo LiveKit verificadas. Sala de teste removida.'}
}
