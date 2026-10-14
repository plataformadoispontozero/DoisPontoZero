import type {SupabaseClient} from 'npm:@supabase/supabase-js@2.117.3'
import {decryptCredential,encryptCredential,configurationAvailable} from './providerConfig.ts'
export interface LivekitConfiguration{url:string;apiKey:string;apiSecret:string}
export function safeLivekitUrl(raw:string){try{const u=new URL(raw);const custom=(Deno.env.get('LIVEKIT_ALLOWED_HOSTS')||'').split(',').map(x=>x.trim()).filter(Boolean);return u.protocol==='wss:'&&!u.username&&!u.password&&!u.search&&!u.hash&&(u.hostname.endsWith('.livekit.cloud')||custom.includes(u.hostname))}catch{return false}}
export async function storedLivekitConfiguration(admin:SupabaseClient,agency:string):Promise<LivekitConfiguration|null>{
 if(!configurationAvailable())return null
 const r=await admin.rpc('livekit_configuration_secret',{p_action:'read',p_agency:agency});if(r.error)throw Error('Configuração segura indisponível.')
 return r.data?.ciphertext?await decryptCredential(r.data.ciphertext):null
}
export async function saveLivekitConfiguration(admin:SupabaseClient,agency:string,config:LivekitConfiguration){
 if(!configurationAvailable())throw Error('Armazenamento criptografado indisponível.')
 const r=await admin.rpc('livekit_configuration_secret',{p_action:'save',p_agency:agency,p_ciphertext:await encryptCredential(config)});if(r.error)throw Error('Não foi possível salvar a configuração.')
}
