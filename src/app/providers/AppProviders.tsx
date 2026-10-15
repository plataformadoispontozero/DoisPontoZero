import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrandingProvider } from '@/app/providers/BrandingProvider'
import { ToastProvider } from '@/components/ui/Toast'
import {officeEnabled} from '@/features/office/officeFeature'
import {OfficePresenceProvider} from '@/features/office/OfficePresenceProvider'
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider'
const OfficeVoiceProvider=lazy(()=>import('@/features/office/OfficeVoiceProvider').then(module=>({default:module.OfficeVoiceProvider})))
function VoiceScope({children}:{children:ReactNode}){
 const auth=useAuth()
 if(!officeEnabled||!auth.session)return children
 return <Suspense fallback={<p role="status" className="p-6 text-sm">Carregando salas de voz…</p>}><OfficeVoiceProvider>{children}</OfficeVoiceProvider></Suspense>
}

function ScopedProviders({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const scope = `${auth.user?.id ?? 'anonymous'}:${auth.activeAgency?.agencyId ?? 'none'}`
  return <QueryScope key={scope}>{children}</QueryScope>
}
function QueryScope({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: true, retry: 1 } } }))
  useEffect(() => () => { void client.cancelQueries(); client.clear() }, [client])
  return <QueryClientProvider client={client}><OfficePresenceProvider><VoiceScope><BrandingProvider><ToastProvider>{children}</ToastProvider></BrandingProvider></VoiceScope></OfficePresenceProvider></QueryClientProvider>
}
export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider><ScopedProviders>{children}</ScopedProviders></AuthProvider>
}
