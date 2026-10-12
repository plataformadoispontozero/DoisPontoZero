// Service-only credential access. Caller must verify agency membership and business permission first.
import {folderIdFromUrl,isFolderDescendant} from '../google-workspace/drive.ts';
import {providerConfiguration} from './providerConfig.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
const env=(key:string)=>Deno.env.get(key)||'';
async function key(){const raw=Uint8Array.from(atob(env('GOOGLE_WORKSPACE_TOKEN_KEY')||env('INTEGRATION_CONFIG_KEY')),c=>c.charCodeAt(0));if(raw.length!==32)throw Error('Configuração Google inválida.');return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);}
async function decrypt(value:string){const [iv,data]=JSON.parse(value).map((s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)));return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(),data)));}
async function encrypt(value:unknown){const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),new TextEncoder().encode(JSON.stringify(value)));return JSON.stringify([btoa(String.fromCharCode(...iv)),btoa(String.fromCharCode(...new Uint8Array(ciphertext)))]);}
export async function googleAccessToken(admin:SupabaseClient,agencyId:string,_requestUserId:string):Promise<string>{
 const central=await admin.rpc('google_workspace_connection',{p_action:'read',p_agency:agencyId});
 const userId=central.data?.user;if(central.error||!userId)throw Error('A agência ainda não tem uma conta Google central autorizada.');
 const stored=await admin.rpc('google_workspace_secret',{p_action:'read',p_agency:agencyId,p_user:userId});
 if(stored.error||!stored.data?.ciphertext)throw Error('Conta Google não conectada para o responsável pelos materiais.');
 let token=await decrypt(stored.data.ciphertext);
 const granted=String(token.scope||'').split(' ');if(!granted.includes('https://www.googleapis.com/auth/drive.readonly')||!granted.includes('https://www.googleapis.com/auth/drive.file'))throw Error('O administrador precisa reconectar o Google para autorizar a leitura dos arquivos existentes.');
 if(token.expires_at<Date.now()+60000){
  const cfg=await providerConfiguration(admin,agencyId,'google');if(!cfg)throw Error('Configuração Google ausente.');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token.refresh_token,client_id:cfg.clientId,client_secret:cfg.clientSecret})});
  if(!response.ok)throw Error('Autorização Google expirada. Reconecte a conta.');
  const fresh=await response.json();token={...token,...fresh,refresh_token:token.refresh_token,expires_at:Date.now()+fresh.expires_in*1000};
  const saved=await admin.rpc('google_workspace_secret',{p_action:'save',p_agency:agencyId,p_user:userId,p_ciphertext:await encrypt(token)});if(saved.error)throw Error('Não foi possível renovar a conexão Google.');
 }
 if(typeof token.access_token!=='string'||!token.access_token)throw Error('Autorização Google inválida.');
 return token.access_token;
}

export async function googleClientFolderAccess(admin:SupabaseClient,agencyId:string,folderId:string,requestUserId:string):Promise<string>{
 const token=await googleAccessToken(admin,agencyId,requestUserId);
 const cfg=await providerConfiguration(admin,agencyId,'google'),root=folderIdFromUrl(cfg?.rootFolderUrl);
 if(!root)throw Error('Pasta raiz da agência não configurada.');
 const allowed=await isFolderDescendant(folderId,root,async(id)=>{const response=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=parents,trashed&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw Error('Pasta indisponível.');const metadata=await response.json();return metadata.trashed?[]:(metadata.parents||[]);});
 if(!allowed)throw Error('Pasta do cliente fora da pasta raiz da agência.');
 return token;
}
