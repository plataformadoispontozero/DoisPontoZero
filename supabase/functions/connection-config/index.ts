import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import {corsHeaders} from 'npm:@supabase/supabase-js@2.117.3/cors';
import {configurationAvailable,providerConfiguration,providerSecret,encryptCredential} from '../_shared/providerConfig.ts';
const env=(key:string)=>Deno.env.get(key)||'';
const origin='https://doispontozero.renatodesigner.com.br';
Deno.serve(async(req:Request)=>{
 const headers={...corsHeaders,'Access-Control-Allow-Origin':origin,'Cache-Control':'no-store','Content-Type':'application/json','Vary':'Origin'};
 const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{headers,status});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Origem não permitida.'},403);
 if(req.method!=='POST')return reply({error:'Método inválido.'},405);
 try{
  const auth=req.headers.get('authorization')||'';if(!auth.startsWith('Bearer '))return reply({error:'Sessão necessária.'},401);
  const caller=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error}=await caller.auth.getUser();if(error||!user)return reply({error:'Sessão inválida.'},401);
  const raw=await req.text();if(raw.length>8192)return reply({error:'Solicitação inválida.'},400);
  const body=JSON.parse(raw),agency=body.agencyId,provider=body.provider;
  if(typeof agency!=='string'||!/^[0-9a-f-]{36}$/i.test(agency)||!['google','meta'].includes(provider))return reply({error:'Configuração inválida.'},400);
  const permission=await caller.rpc('has_agency_permission',{p_agency_id:agency,p_permission_key:'settings.edit'});
  const member=await caller.from('agency_members').select('id,roles(name)').eq('agency_id',agency).eq('user_id',user.id).eq('status','active').maybeSingle();
  const role=Array.isArray(member.data?.roles)?member.data?.roles[0]?.name:(member.data?.roles as unknown as {name:string})?.name;
  if(permission.error||permission.data!==true||member.error||!['OWNER','ADMIN'].includes(role))return reply({error:'Somente administrador pode configurar credenciais da agência.'},403);
  const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
  const previous=await providerConfiguration(admin,agency,provider);
  if(body.action==='status')return reply({configured:!!previous,secureStorageAvailable:configurationAvailable(),clientId:previous?.clientId||'',version:previous?.version||'v26.0',apiKey:previous?.apiKey||'',projectNumber:previous?.projectNumber||'',redirectUri:`${env('SUPABASE_URL')}/functions/v1/${provider==='google'?'google-workspace':'meta-workspace'}`});
  if(body.action!=='save')return reply({error:'Operação inválida.'},400);
  if(!configurationAvailable())return reply({error:'O armazenamento criptografado ainda precisa ser ativado pelo administrador técnico.'},409);
  const id=String(body.clientId||'').trim(),secret=typeof body.clientSecret==='string'?body.clientSecret.trim():'';
  if(provider==='google'?!/^[A-Za-z0-9._-]{10,250}\.apps\.googleusercontent\.com$/.test(id):!/^\d{5,40}$/.test(id))return reply({error:'ID do aplicativo inválido.'},400);
  if(secret.length>2000||(!secret&&!previous?.clientSecret))return reply({error:'Informe o segredo do aplicativo.'},400);
  const version=String(body.version||'v26.0');if(provider==='meta'&&!/^v\d{2}\.0$/.test(version))return reply({error:'Versão da API inválida.'},400);
  if(previous&&previous.clientId!==id&&!secret)return reply({error:'Informe o segredo do novo aplicativo.'},400);
  const apiKey=String(body.apiKey??previous?.apiKey??'').trim(),projectNumber=String(body.projectNumber??previous?.projectNumber??'').trim();
  if(provider==='google'&&((apiKey&&!/^[A-Za-z0-9_-]{20,150}$/.test(apiKey))||(projectNumber&&!/^\d{5,30}$/.test(projectNumber))))return reply({error:'Chave pública do Picker ou número do projeto inválido.'},400);
  await providerSecret(admin,'save',provider,agency,undefined,undefined,await encryptCredential({clientId:id,clientSecret:secret||previous!.clientSecret,redirectUri:`${env('SUPABASE_URL')}/functions/v1/${provider==='google'?'google-workspace':'meta-workspace'}`,version,apiKey,projectNumber}));
  return reply({configured:true,secureStorageAvailable:true,clientId:id,version});
 }catch{return reply({error:'Não foi possível salvar a configuração. Verifique a conexão e tente novamente.'},400);}
});
