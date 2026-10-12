import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {corsHeaders} from 'npm:@supabase/supabase-js@2.117.3/cors';
import {providerConfiguration,providerSecret,encryptCredential,decryptCredential,configurationAvailable} from '../_shared/providerConfig.ts';
const env=(key:string)=>Deno.env.get(key)||'',origin='https://doispontozero.renatodesigner.com.br';
const nonce=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function proof(token:string,secret:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
Deno.serve(async(req:Request)=>{
 const headers={...corsHeaders,'Access-Control-Allow-Origin':origin,'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{headers,status});
 const back=(status:string)=>new Response(null,{status:303,headers:{Location:`${origin}/settings/integrations/meta?meta=${status}`,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Origem não permitida.'},403);
 const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
 try{
  if(!configurationAvailable())return req.method==='GET'?back('configuration_required'):reply({configured:false,connected:false});
  if(req.method==='GET'){
   const url=new URL(req.url),state=url.searchParams.get('state')||'';if(state.length!==43)return back('invalid_state');
   const stored=await providerSecret(admin,'consume','meta',undefined,undefined,await hash(state));
   const cfg=await providerConfiguration(admin,stored.agency,'meta');if(!cfg)return back('configuration_required');
   if(url.searchParams.has('error'))return back('cancelled');const code=url.searchParams.get('code');if(!code)return back('invalid_code');
   const version=cfg.version||'v26.0';
   const exchange=await fetch(`https://graph.facebook.com/${version}/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:cfg.clientId,client_secret:cfg.clientSecret,redirect_uri:cfg.redirectUri,code})});
   const token=await exchange.json();if(!exchange.ok||!token.access_token)return back('access_denied');
   const info=await fetch(`https://graph.facebook.com/${version}/me/permissions`,{headers:{Authorization:`Bearer ${token.access_token}`}});const granted=await info.json();if(!info.ok||!granted.data?.some((p:{permission:string;status:string})=>p.permission==='ads_read'&&p.status==='granted'))return back('missing_permissions');
   await providerSecret(admin,'save','meta',stored.agency,stored.user,undefined,await encryptCredential({...token,expires_at:Date.now()+Number(token.expires_in||3600)*1000}));
   return back('connected');
  }
  if(req.method!=='POST')return reply({error:'Método inválido.'},405);
  const auth=req.headers.get('authorization')||'';if(!auth.startsWith('Bearer '))return reply({error:'Sessão necessária.'},401);
  const caller=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error}=await caller.auth.getUser();if(error||!user)return reply({error:'Sessão inválida.'},401);
  const raw=await req.text();if(raw.length>4096)return reply({error:'Solicitação inválida.'},400);const body=JSON.parse(raw),agency=body.agencyId;
  if(typeof agency!=='string'||!/^[0-9a-f-]{36}$/i.test(agency))return reply({error:'Agência inválida.'},400);
  const access=await caller.rpc('has_agency_permission',{p_agency_id:agency,p_permission_key:body.action==='insights'?'clients.view':'settings.edit'});if(access.error||access.data!==true)return reply({error:'Permissão necessária.'},403);
  const cfg=await providerConfiguration(admin,agency,'meta');if(!cfg)return reply({configured:false,connected:false});const version=cfg.version||'v26.0';
  if(body.action==='start'){const state=nonce();await providerSecret(admin,'state','meta',agency,user.id,await hash(state),await encryptCredential({}));const params=new URLSearchParams({client_id:cfg.clientId,redirect_uri:cfg.redirectUri,state,scope:'ads_read',response_type:'code'});return reply({url:`https://www.facebook.com/${version}/dialog/oauth?${params}`});}
  const stored=await providerSecret(admin,'read','meta',agency,user.id);if(!stored.ciphertext)return reply({configured:true,connected:false});
  const token=await decryptCredential(stored.ciphertext);if(token.expires_at<Date.now())return reply({configured:true,connected:false,expired:true});
  if(body.action==='status')return reply({configured:true,connected:true});
  const graph=async(path:string,params:Record<string,string>={})=>{const q=new URLSearchParams({...params,appsecret_proof:await proof(token.access_token,cfg.clientSecret)});const r=await fetch(`https://graph.facebook.com/${version}/${path}?${q}`,{headers:{Authorization:`Bearer ${token.access_token}`}});if(!r.ok)throw Error('O Meta não disponibilizou os dados. Reconecte e verifique a permissão ads_read.');return r.json();};
  if(body.action==='disconnect'){const r=await fetch(`https://graph.facebook.com/${version}/me/permissions`,{method:'DELETE',headers:{Authorization:`Bearer ${token.access_token}`}});if(!r.ok)throw Error('Não foi possível revogar no Meta.');await providerSecret(admin,'delete','meta',agency,user.id);return reply({configured:true,connected:false});}
  if(body.action==='accounts'){const data=await graph('me/adaccounts',{fields:'id,name,currency,account_status',limit:'100'});return reply({accounts:data.data||[]});}
  if(body.action==='insights'){
   if(typeof body.clientId!=='string')return reply({error:'Cliente inválido.'},400);
   const client=await caller.from('clients').select('profile').eq('agency_id',agency).eq('id',body.clientId).maybeSingle();
   const account=client.data?.profile?.meta_ad_account_id;if(client.error||!/^act_\d+$/.test(account||''))return reply({error:'Vincule uma conta de anúncios no perfil do cliente.'},409);
   const accounts=await graph('me/adaccounts',{fields:'id',limit:'100'});if(!accounts.data?.some((a:{id:string})=>a.id===account))return reply({error:'A conta autorizada não tem acesso à conta de anúncios deste cliente.'},403);
   const data=await graph(`${account}/insights`,{date_preset:'last_30d',fields:'spend,impressions,reach,clicks,cpc,ctr,actions',level:'account'});return reply({insights:data.data||[],period:'last_30d'});
  }
  return reply({error:'Operação inválida.'},400);
 }catch{return req.method==='GET'?back('failed'):reply({error:'Integração Meta indisponível. Confira a configuração e a autorização.'},400);}
});
