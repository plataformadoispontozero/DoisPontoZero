import {useEffect,useRef,useState,type FormEvent} from 'react'
import {FunctionsHttpError} from '@supabase/supabase-js'
import {useAgencyId,useAuth,usePermission} from '@/features/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'

type Provider='none'|'gemini'|'ollama'
interface ConnectionStatus {
 provider:Provider;model:string;apiKeyConfigured:boolean;ollamaUrl:string;
 secureStorageAvailable:boolean;generationAvailable:boolean;allowApprovedData?:boolean;
}
const initial:ConnectionStatus={provider:'none',model:'',apiKeyConfigured:false,ollamaUrl:'http://localhost:11434',secureStorageAvailable:false,generationAvailable:false,allowApprovedData:false}
const suggestedGeminiModel='gemini-3.8-flash'
const geminiModelPattern='gemini-[a-z0-9][a-z0-9.\\-]{1,99}'
const validGeminiModel=(value:string)=>/^gemini-[a-z0-9][a-z0-9.-]{1,99}$/.test(value)
const modelGuidance='Informe o identificador do modelo, por exemplo gemini-3.8-flash. Não use o nome do projeto do Google, como Default Gemini Project.'
const field='mt-2 block min-h-11 w-full rounded-lg border border-white/20 bg-[#111115] p-3 text-sm'
const button='min-h-11 rounded-lg border border-white/20 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50'

function EditorialAiSettingsForm({agencyId}:{agencyId:string}){
 const [status,setStatus]=useState<ConnectionStatus>(initial),[provider,setProvider]=useState<Provider>('none'),[model,setModel]=useState(''),[key,setKey]=useState(''),[ollamaUrl,setOllamaUrl]=useState(initial.ollamaUrl),[approved,setApproved]=useState(false)
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[loadError,setLoadError]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[verified,setVerified]=useState(false),[reload,setReload]=useState(0)
 const epoch=useRef(0),locked=useRef(false)
 async function request(body:Record<string,unknown>){
  if(!supabase)throw Error('Conexão com a plataforma indisponível.')
  const result=await supabase.functions.invoke('editorial-ai',{body:{...body,agencyId}})
  if(result.error instanceof FunctionsHttpError){const data=await result.error.context.json().catch(()=>null);throw Error(typeof data?.error==='string'?data.error:'Não foi possível acessar a conexão de IA.')}
  if(result.error||result.data?.error)throw Error(typeof result.data?.error==='string'?result.data.error:'Não foi possível acessar a conexão de IA.')
  if(!result.data)throw Error('Resposta da configuração indisponível.')
  return result.data
 }
 useEffect(()=>{
  const token=++epoch.current;setLoading(true);setLoadError('');setKey('');setVerified(false);setMessage('');setError('')
  void request({action:'status'}).then(data=>{
   if(epoch.current!==token)return
   const safe={...initial,...data,provider:['none','gemini','ollama'].includes(data.provider)?data.provider:'none'} as ConnectionStatus
   setStatus(safe);setProvider(safe.provider);setModel(safe.model||'');setOllamaUrl(safe.ollamaUrl||initial.ollamaUrl);setApproved(safe.allowApprovedData===true)
  }).catch(()=>{if(epoch.current===token)setLoadError('Não foi possível carregar a configuração de IA. Tente novamente.')}).finally(()=>{if(epoch.current===token)setLoading(false)})
  return()=>{epoch.current++}
 // The parent remounts for each agency or authenticated user; never cache credential fields.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[agencyId,reload])
 function changeProvider(next:Provider){setProvider(next);setKey('');setModel(next===status.provider&&status.model?status.model:next==='gemini'?suggestedGeminiModel:'');setVerified(false);setMessage('');setError('')}
 async function save(event:FormEvent){
  event.preventDefault();if(locked.current||loading||loadError)return
  if(provider==='gemini'&&!validGeminiModel(model.trim())){setError(modelGuidance);setMessage('');return}
  locked.current=true;setBusy(true);setError('');setMessage('');setVerified(false);const token=epoch.current
  try{
   const result=await request({action:'save',provider,model:model.trim(),...(provider==='gemini'&&key.trim()?{apiKey:key.trim()}:{}),ollamaUrl:ollamaUrl.trim(),allowApprovedData:provider==='gemini'&&approved})
   if(epoch.current!==token)return
   setStatus({...status,...result,provider,model:model.trim(),ollamaUrl:ollamaUrl.trim(),apiKeyConfigured:provider==='gemini'?(result.apiKeyConfigured??(!!key.trim()||status.apiKeyConfigured)):status.apiKeyConfigured,allowApprovedData:provider==='gemini'&&approved})
   setMessage(provider==='ollama'?'Configuração local preparada. A ponte segura com o computador ainda precisa ser instalada e validada.':provider==='none'?'Geração por IA desativada.':'Configuração salva com segurança. Teste a conexão antes de gerar um calendário.')
  }catch(cause){if(epoch.current===token)setError(cause instanceof Error?cause.message:'Não foi possível salvar a configuração.')}
  finally{if(epoch.current===token){setKey('');setBusy(false)}locked.current=false}
 }
 async function test(){
  if(locked.current||loading||loadError)return
  locked.current=true;setBusy(true);setError('');setMessage('');setVerified(false);const token=epoch.current
  try{const result=await request({action:'test'});if(epoch.current!==token)return;if(result.verified!==true)throw Error('O serviço não confirmou a conexão.');setVerified(true);setMessage(result.message||'Conexão Gemini validada com uma mensagem de teste, sem dados de clientes.')}
  catch(cause){if(epoch.current===token)setError(cause instanceof Error?cause.message:'Não foi possível testar a conexão.')}
  finally{if(epoch.current===token)setBusy(false);locked.current=false}
 }
 const dirty=provider!==status.provider||model.trim()!==status.model||ollamaUrl.trim()!==status.ollamaUrl||approved!==(status.allowApprovedData===true)||!!key
 return <section className="max-w-4xl space-y-6"><header><h1 className="text-2xl font-semibold">IA editorial</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">Conecte a geração de conteúdo da agência. Todo calendário gerado precisa de revisão, aprovação e liberação para a produção.</p></header>
 {loading?<p role="status">Carregando configuração de IA…</p>:loadError?<div role="alert" className="rounded-xl border border-red-400/30 p-5"><p>{loadError}</p><button className={`${button} mt-3`} onClick={()=>setReload(v=>v+1)}>Tentar novamente</button></div>:<>
 <p role="status" className="rounded-xl border border-white/15 p-4 text-sm">{verified?'Conexão Gemini validada':status.provider==='ollama'?'Ollama preparado · ponte local pendente':status.generationAvailable?'Gemini configurado · revisão obrigatória':'Geração por IA ainda não ativa'}</p>
 <form onSubmit={save} className="space-y-5 rounded-2xl border border-white/15 bg-[#19191f] p-5"><fieldset disabled={busy} className="space-y-5"><legend className="mb-3 text-sm font-semibold">Conexão da agência</legend><label className="block text-sm">Provedor<select className={field} value={provider} onChange={e=>changeProvider(e.target.value as Provider)}><option value="none">Nenhum · manter IA desativada</option><option value="gemini">Google Gemini</option><option value="ollama">Ollama local · preparar conexão</option></select></label>
 {provider!=='none'&&<div><label className="block text-sm">Modelo<input className={field} autoComplete="off" required maxLength={provider==='gemini'?107:120} pattern={provider==='gemini'?geminiModelPattern:undefined} aria-describedby="editorial-ai-model-help" aria-invalid={provider==='gemini'&&model.length>0&&!validGeminiModel(model.trim())?true:undefined} value={model} onChange={e=>{setModel(e.target.value);setVerified(false);setError('')}} onInvalid={e=>{if(provider==='gemini'){e.preventDefault();setError(modelGuidance);e.currentTarget.focus()}}} placeholder={provider==='gemini'?'Ex.: gemini-3.8-flash':'Nome do modelo instalado no Ollama'}/></label><p id="editorial-ai-model-help" className="mt-2 text-xs leading-relaxed text-zinc-400">{provider==='gemini'?'Use o identificador técnico do modelo, por exemplo gemini-3.8-flash. O nome do projeto no Google AI Studio (como Default Gemini Project) não é um modelo. Confira se ele está disponível na sua conta.':'Informe o nome do modelo instalado no computador da agência.'}</p></div>}
 {provider==='gemini'&&<><label className="block text-sm">Chave da API Gemini<input type="password" autoComplete="new-password" spellCheck={false} className={field} required={!status.apiKeyConfigured} maxLength={4096} value={key} onChange={e=>{setKey(e.target.value);setVerified(false)}} placeholder={status.apiKeyConfigured?'Chave cadastrada. Deixe vazio para preservá-la.':'Cadastre a chave criada no Google AI Studio'}/></label><p className="text-xs leading-relaxed text-zinc-400">A chave é criptografada no servidor e não é exibida novamente. Ela não será salva no armazenamento do navegador.</p><div className="rounded-xl border border-amber-400/30 p-4 text-sm leading-relaxed"><p>A cota gratuita depende do modelo e da conta. O Google pode usar o conteúdo do plano gratuito para melhorar seus produtos. Esta configuração não comprova que seu projeto está sem faturamento e não garante gratuidade se houver cobrança habilitada no Google.</p><p className="mt-2"><a className="underline" href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer">Conferir cotas e tratamento dos dados</a> · <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Gerenciar chave no Google AI Studio</a></p></div><label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" required checked={approved} onChange={e=>setApproved(e.target.checked)} className="mt-1 h-4 w-4 shrink-0"/><span>Autorizo enviar ao Google somente as informações do cliente aprovadas para esse uso, e conferi as condições da minha conta.</span></label></>}
 {provider==='ollama'&&<><label className="block text-sm">Endereço local do Ollama<input className={field} required maxLength={2048} autoComplete="off" value={ollamaUrl} onChange={e=>setOllamaUrl(e.target.value)} placeholder="http://localhost:11434"/></label><p className="rounded-xl border border-blue-400/25 p-4 text-sm leading-relaxed">O modelo roda no computador da agência, que precisa permanecer ligado. O localhost do servidor da plataforma não é esse computador. Salvar estes dados apenas prepara a conexão: geração e teste local exigem uma ponte segura, ainda não disponível. Não exponha o Ollama diretamente à internet.</p></>}
 <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy||!status.secureStorageAvailable} className={`${button} bg-orange-600 text-white`}>{busy?'Processando…':'Salvar conexão de IA'}</button><button type="button" disabled={busy||dirty||status.provider!=='gemini'||!status.apiKeyConfigured} onClick={()=>void test()} className={button}>Testar conexão Gemini</button></div></fieldset>
 {!status.secureStorageAvailable&&<p role="alert" className="text-sm text-orange-300">O armazenamento criptografado precisa estar disponível no servidor antes de salvar.</p>}
 <p className="text-xs leading-relaxed text-zinc-400">O teste envia apenas uma mensagem de verificação ao modelo salvo, sem briefing ou dados de clientes. Não altera faturamento e pode consumir a cota da sua conta. Não há troca automática para provedor ou plano pago.</p>
 </form>
 </>}
 {error&&<p role="alert" className="rounded-xl border border-red-400/30 p-4 text-sm">{error}</p>}{message&&<p role="status" className="rounded-xl border border-orange-400/30 p-4 text-sm">{message}</p>}
 </section>
}
export function EditorialAiSettingsPage(){
 const agencyId=useAgencyId(),auth=useAuth(),permission=usePermission('settings.edit')
 if(!permission||!['OWNER','ADMIN'].includes(auth.activeAgency?.roleName||''))return <section><h1 className="text-2xl font-semibold">IA editorial</h1><p role="alert" className="mt-4">Somente OWNER ou ADMIN com permissão de configurações pode gerenciar esta conexão.</p></section>
 if(!agencyId)return <p role="alert">Selecione uma agência para configurar a IA editorial.</p>
 return <EditorialAiSettingsForm key={`${agencyId}:${auth.user?.id||''}`} agencyId={agencyId}/>
}
