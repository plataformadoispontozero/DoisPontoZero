import {useEffect,useState} from 'react';
import {FunctionsHttpError} from '@supabase/supabase-js';
import {useAgencyId,usePermission} from '@/features/auth/AuthProvider';
import {supabase} from '@/lib/supabase/client';
import {ProviderCredentialsForm} from '@/features/integrations/ProviderCredentialsForm';
import {nativeApp} from '@/features/app-install/appRuntime';
interface MetaState {configured:boolean;connected:boolean;expired?:boolean}
interface AdAccount {id:string;name:string;currency:string;account_status:number}
export default function MetaWorkspacePage(){const agency=useAgencyId();return <MetaPanel key={agency}/>;}
function MetaPanel(){
 const agencyId=useAgencyId(),allowed=usePermission('settings.edit');
 const [state,setState]=useState<MetaState|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[accounts,setAccounts]=useState<AdAccount[]>([]),[retry,setRetry]=useState(0);
 async function request(action:string){if(!supabase)throw Error('Conexão indisponível.');const r=await supabase.functions.invoke('meta-workspace',{body:{agencyId,action}});if(r.error instanceof FunctionsHttpError){const d=await r.error.context.json().catch(()=>null);throw Error(d?.error||'Não foi possível consultar o Meta.');}if(r.error||r.data?.error)throw Error(r.data?.error||'Não foi possível comunicar com o Meta.');return r.data;}
 useEffect(()=>{let active=true;if(allowed&&agencyId)request('status').then(data=>{if(active)setState(data);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[agencyId,allowed,retry]);
 async function action(name:string){setBusy(true);setError('');try{const data=await request(name);if(name==='start'){if(nativeApp())throw Error('Autorize o Meta pelo navegador na página oficial de configurações.');const target=new URL(data.url);if(target.origin!=='https://www.facebook.com')throw Error('Endereço de autorização inválido.');window.location.assign(target.href);}else if(name==='accounts')setAccounts(data.accounts);else{setState(data);setAccounts([]);}}catch(e){setError(e instanceof Error?e.message:'Não foi possível conectar.');}finally{setBusy(false);}}
 return <section className="space-y-5"><div><h2 className="text-xl font-semibold">Meta · Contas de anúncios</h2><p className="mt-2 text-[var(--color-text-secondary)]">Conecte sua conta de trabalho para consultar dados reais dos clientes. Esta integração solicita somente leitura de anúncios (ads_read).</p></div>
  {allowed&&<ProviderCredentialsForm provider="meta" onSaved={()=>setRetry(v=>v+1)}/>}
  <div className="rounded-xl border border-white/15 p-5 space-y-3"><h3 className="font-semibold">Antes de autorizar</h3><ol className="list-decimal pl-5 space-y-2 text-sm"><li>No Meta for Developers, habilite Facebook Login e Marketing API no aplicativo.</li><li>Cadastre o retorno OAuth <code className="break-all">https://pvkhlobsiszrjtblpruu.supabase.co/functions/v1/meta-workspace</code>.</li><li>Em modo de desenvolvimento, adicione as contas da equipe como administradores, desenvolvedores ou testadores do aplicativo. O acesso a contas externas pode exigir verificação e análise de permissões pelo Meta.</li><li>Salve App ID e App Secret acima, autorize a conta e confira as contas de anúncios retornadas.</li></ol><a className="text-orange-300 underline" href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer">Abrir aplicativos no Meta</a></div>
  {!allowed&&<p role="alert">É necessária permissão de editar configurações.</p>}
  {error&&<p role="alert" className="text-orange-300">{error}<button className="block underline mt-2" onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button></p>}
  <p role="status">{state?.connected?'Conta Meta autorizada':state?.expired?'Autorização expirada. Conecte novamente.':state?.configured?'Aplicativo configurado. Falta autorizar a conta.':'Nenhuma conexão Meta ativa.'}</p>
  <div className="flex flex-wrap gap-3">{state?.connected?<><button disabled={busy} className="rounded-lg bg-[#c84408] px-4 py-3" onClick={()=>void action('accounts')}>Consultar contas de anúncios</button><button disabled={busy} className="rounded-lg border border-white/20 px-4 py-3" onClick={()=>void action('disconnect')}>Desconectar Meta</button></>:<button disabled={busy||!allowed||!state?.configured} className="rounded-lg bg-[#c84408] px-4 py-3 disabled:opacity-50" onClick={()=>void action('start')}>Autorizar Meta</button>}</div>
  {accounts.length>0&&<ul className="divide-y divide-white/10">{accounts.map(account=><li className="py-3" key={account.id}><p className="font-semibold">{account.name}</p><p className="text-sm text-[var(--color-text-secondary)]">{account.id} · {account.currency}</p></li>)}</ul>}
  <p className="text-sm text-[var(--color-text-secondary)]">As métricas aparecem em Tráfego Pago quando a conta de anúncios estiver vinculada ao cliente. Não criamos campanhas nem alteramos anúncios nesta autorização.</p>
 </section>;
}
