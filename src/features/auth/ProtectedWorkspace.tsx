import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { routePermission } from './access'
import { AppLayout } from '@/app/layouts/AppLayout'
import { Button } from '@/components/ui/Button'

export function ProtectedWorkspace() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.loading) return <main className="p-8 text-[#F8F9FC]" role="status">Verificando sessão e acesso à agência…</main>
  if (!auth.isDemo && !auth.session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (!auth.isDemo && (!auth.activeAgency || auth.error)) return <main className="p-8 text-[#F8F9FC] space-y-4"><h1>Acesso à agência indisponível</h1><p role="alert">{auth.error || 'Seu usuário não possui vínculo ativo com uma agência. Solicite acesso ao responsável.'}</p><Button onClick={auth.reloadAccess}>Verificar novamente</Button><Button onClick={() => void auth.signOut().catch(() => {})}>Sair</Button></main>
  const permission = routePermission(location.pathname)
  if (!auth.isDemo && permission && auth.activeAgency?.roleName !== 'OWNER' && !auth.permissions.has(permission)) return <main className="p-8 text-[#F8F9FC]"><h1>Acesso negado</h1><p>Seu papel nesta agência não permite acessar este módulo.</p></main>
  return <AppLayout />
}
