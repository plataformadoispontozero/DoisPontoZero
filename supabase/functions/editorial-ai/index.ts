import {createClient} from 'npm:@supabase/supabase-js@2.117.3'
import {configurationAvailable,encryptCredential,decryptCredential} from '../_shared/providerConfig.ts'
import {createEditorialAiHandler} from './handler.ts'
import {callGemini,calendarPrompt} from './gemini.ts'
import {type AiConfiguration} from './contract.ts'
const env=(name:string)=>Deno.env.get(name)||''
// Every database request is bounded, including auth. Credentials remain inside this function.
const boundedFetch:typeof fetch=(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})
const options={auth:{persistSession:false,autoRefreshToken:false},global:{fetch:boundedFetch}}
const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),options)
const caller=(authorization:string)=>createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{...options,global:{...options.global,headers:{Authorization:authorization}}})
async function secret(action:string,agency:string,user?:string,ciphertext?:string){const result=await admin.rpc('editorial_ai_secret',{p_action:action,p_agency:agency,p_user:user,p_ciphertext:ciphertext});if(result.error)throw Error('storage');return result.data}
Deno.serve(createEditorialAiHandler({
 secureStorageAvailable:configurationAvailable,
 async authenticate(authorization,agency){
  const client=caller(authorization),auth=await client.auth.getUser();if(auth.error||!auth.data.user)return null
  const user=auth.data.user
  const [member,settings,strategy]=await Promise.all([
   client.from('agency_members').select('roles(name)').eq('agency_id',agency).eq('user_id',user.id).eq('status','active').maybeSingle(),
   client.rpc('has_agency_permission',{p_agency_id:agency,p_permission_key:'settings.edit'}),
   client.rpc('has_agency_permission',{p_agency_id:agency,p_permission_key:'strategy.edit'})])
  if(member.error||!member.data)return{userId:user.id,canManage:false,canGenerate:false}
  const roles=member.data.roles as unknown as {name:string}|{name:string}[]|null
  const names=(Array.isArray(roles)?roles:roles?[roles]:[]).map(r=>r.name.toUpperCase())
  return{userId:user.id,canManage:!settings.error&&settings.data===true&&names.some(n=>n==='OWNER'||n==='ADMIN'),canGenerate:!strategy.error&&strategy.data===true}
 },
 async configuration(agency){const data=await secret('read',agency);return data?.ciphertext?await decryptCredential(data.ciphertext) as AiConfiguration:null},
 async save(agency,user,config){await secret('save',agency,user,await encryptCredential(config))},
 async reserve(agency,user){return(await secret('reserve',agency,user))?.allowed===true},
 async client(authorization,agency,id){
  const client=caller(authorization)
  const result=await client.from('clients').select('id,name,profile').eq('agency_id',agency).eq('id',id).maybeSingle()
  if(result.error)throw Error('client');if(!result.data)return null
  const history=await client.from('monthly_editorial_campaigns').select('month,items').eq('agency_id',agency).eq('client_id',id).order('month',{ascending:false}).limit(6)
  if(history.error)throw Error('history')
  // Send only editorial context: no phone, email, account tokens, links or full customer record.
  const raw=result.data.profile&&typeof result.data.profile==='object'?result.data.profile as Record<string,unknown>:{}
  const profile:Record<string,unknown>={}
  for(const key of ['niche','audience','target_audience','positioning','tone','objective','monthly_objective','differential','approvedFacts','forbiddenTerms','visualGuidance']){
   const value=raw[key];if(typeof value==='string')profile[key]=value.slice(0,3000);else if(Array.isArray(value))profile[key]=value.filter(v=>typeof v==='string').slice(0,40).map(v=>v.slice(0,500))
  }
  return{name:String(result.data.name).slice(0,200),profile,history:(history.data||[]).map(h=>({month:h.month,themes:Array.isArray(h.items)?h.items.slice(0,12).map((i:Record<string,unknown>)=>String(i.title||i.theme||'').slice(0,120)):[]}))}
 },
 generate:(config,input,client)=>callGemini(config,calendarPrompt(input,client)),
 test:config=>callGemini(config,'Respond only OK.',true),
 log:code=>console.error(JSON.stringify({event:'editorial_ai_failure',code})),
}))
