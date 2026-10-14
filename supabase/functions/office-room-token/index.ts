import {createClient} from '@supabase/supabase-js'
import {createTokenHandler,type VoiceContext} from './handler.ts'
import {storedLivekitConfiguration} from '../_shared/livekitConfig.ts'
import {issueVoiceToken} from './issuer.ts'
const env=(key:string)=>Deno.env.get(key)||''
const caller=(authorization:string)=>createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}})
Deno.serve(createTokenHandler({
 authenticate:async authorization=>{const {data,error}=await caller(authorization).auth.getUser();return error?null:data.user?.id||null},
 authorize:async(authorization,room,consume)=>{
  const result=await caller(authorization).rpc('office_voice_context',{p_room:room,p_consume:consume})
  if(result.error)return {context:null,error:result.error.code==='42501'?'denied':result.error.message==='OFFICE_RATE_LIMIT'?'rate_limited':'unavailable'}
  return {context:result.data as VoiceContext|null}
 },
 configuration:async context=>{const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});return await storedLivekitConfiguration(admin,context.agency_id)||{url:env('LIVEKIT_URL'),apiKey:env('LIVEKIT_API_KEY'),apiSecret:env('LIVEKIT_API_SECRET')}},
 issue:issueVoiceToken,
 log:code=>console.warn(JSON.stringify({event:'office_token_failure',code})),
}))
