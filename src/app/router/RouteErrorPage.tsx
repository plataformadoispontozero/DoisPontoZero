import {useEffect} from 'react'
import {useRouteError} from 'react-router-dom'
import {isModuleLoadError,recoverModuleLoad} from '@/app/runtime/moduleRecovery'
export function RouteErrorPage() {
  const error=useRouteError(),moduleError=isModuleLoadError(error)
  useEffect(()=>{recoverModuleLoad(error)},[error])
  return <main className="flex min-h-screen items-center justify-center bg-[#111113] p-6 text-[#F8F9FC]"><section role="alert" className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#1C1C24] p-8"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-orange-300">Dois.Zero</p><h1 className="text-2xl font-semibold">{moduleError?'Vamos atualizar esta página':'Não foi possível abrir esta página'}</h1><p className="mt-4 text-sm leading-relaxed text-zinc-300">{moduleError?'Uma atualização da plataforma ou uma falha de conexão impediu o carregamento. Confira sua conexão e tente novamente.':'Tente carregar a página novamente. Se o problema continuar, informe à equipe qual página você estava acessando.'}</p><div className="mt-6 flex flex-wrap gap-3"><button className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white" onClick={()=>window.location.reload()}>Recarregar página</button><a className="rounded-xl border border-white/20 px-5 py-3 text-sm" href="/dashboard">Voltar ao painel</a></div></section></main>
}
