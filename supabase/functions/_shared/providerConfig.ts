import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
const env=(key:string)=>Deno.env.get(key)||'';
export type Provider='google'|'meta';
export interface ProviderConfiguration {clientId:string;clientSecret:string;redirectUri:string;version?:string;}
export function configurationAvailable(){return !!env('INTEGRATION_CONFIG_KEY');}
async function key(){const raw=Uint8Array.from(atob(env('INTEGRATION_CONFIG_KEY')),c=>c.charCodeAt(0));if(raw.length!==32)throw Error('Configuração de criptografia indisponível.');return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);}
export async function decryptCredential(value:string){const [iv,data]=JSON.parse(value).map((s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)));return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(),data)));}
export async function encryptCredential(value:unknown){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),new TextEncoder().encode(JSON.stringify(value)));return JSON.stringify([btoa(String.fromCharCode(...iv)),btoa(String.fromCharCode(...new Uint8Array(data)))]);}
export async function providerSecret(admin:SupabaseClient,action:string,provider:Provider,agency?:string,user?:string,hash?:string,ciphertext?:string){const r=await admin.rpc('integration_provider_secret',{p_action:action,p_provider:provider,p_agency:agency,p_user:user,p_hash:hash,p_ciphertext:ciphertext});if(r.error)throw Error('Armazenamento seguro indisponível.');return r.data;}
export async function providerConfiguration(admin:SupabaseClient,agency:string,provider:Provider):Promise<ProviderConfiguration|null>{
 if(configurationAvailable()){const stored=await providerSecret(admin,'read',provider,agency);if(stored.ciphertext)return decryptCredential(stored.ciphertext);}
 const prefix=provider==='google'?'GOOGLE_WORKSPACE':'META_WORKSPACE';
 const clientId=env(`${prefix}_CLIENT_ID`),clientSecret=env(`${prefix}_CLIENT_SECRET`),redirectUri=env(`${prefix}_REDIRECT_URI`);
 return clientId&&clientSecret&&redirectUri?{clientId,clientSecret,redirectUri,version:env('META_GRAPH_VERSION')||'v26.0'}:null;
}
