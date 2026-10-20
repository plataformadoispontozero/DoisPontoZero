import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { routePermission, isManagementRole } from './access'
import { AppLayout } from '@/app/layouts/AppLayout'
import { Button } from '@/components/ui/Button'

export function ProtectedWorkspace() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.loading) return <main className="flex min-h-svh items-center justify-center bg-[#101014] p-6 text-[#F8F9FC]"><div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#19191f] p-8"><img src="/agency/official-logo.webp" alt="Dois.Zero" className="mb-8 w-40"/><h1 className="text-xl font-semibold">Preparando seu espaço de trabalho</h1><p role="status" className="mt-3 text-sm text-zinc-400">Verificando sessão e acesso à agência…</p><div aria-hidden="true" className="mt-8 space-y-3 motion-safe:animate-pulse"><div className="h-4 w-2/3 rounded bg-white/10"/><div className="h-24 rounded-xl bg-white/5"/><div className="grid grid-cols-3 gap-3"><div className="h-16 rounded-lg bg-white/5"/><div className="h-16 rounded-lg bg-white/5"/><div className="h-16 rounded-lg bg-white/5"/></div></div></div></main>
  if (!auth.isDemo && !auth.session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (!auth.isDemo && (!auth.activeAgency || auth.error)) return <main className="p-8 text-[#F8F9FC] space-y-4"><h1>Acesso à agência indisponível</h1><p role="alert">{auth.error || 'Seu usuário não possui vínculo ativo com uma agência. Solicite acesso ao responsável.'}</p><Button onClick={auth.reloadAccess}>Verificar novamente</Button><Button onClick={() => void auth.signOut().catch(() => {})}>Sair</Button></main>
  if (!auth.isDemo && /^\/projects\/?$/.test(location.pathname) && !isManagementRole(auth.activeAgency?.roleName)) return <main className="p-8 text-[#F8F9FC]"><h1>Acesso negado</h1><p>O Kanban geral é exclusivo da gestão. Consulte suas demandas na área de produção.</p></main>
  const permission = routePermission(location.pathname)
  if (!auth.isDemo && permission && auth.activeAgency?.roleName !== 'OWNER' && !auth.permissions.has(permission)) return <main className="p-8 text-[#F8F9FC]"><h1>Acesso negado</h1><p>Seu papel nesta agência não permite acessar este módulo.</p></main>
  return <AppLayout />
}
