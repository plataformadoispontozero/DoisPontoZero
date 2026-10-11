import { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrandingProvider } from '@/app/providers/BrandingProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider'

function ScopedProviders({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const scope = `${auth.user?.id ?? 'anonymous'}:${auth.activeAgency?.agencyId ?? 'none'}`
  return <QueryScope key={scope}>{children}</QueryScope>
}
function QueryScope({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: true, retry: 1 } } }))
  useEffect(() => () => { void client.cancelQueries(); client.clear() }, [client])
  return <QueryClientProvider client={client}><BrandingProvider><ToastProvider>{children}</ToastProvider></BrandingProvider></QueryClientProvider>
}
export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider><ScopedProviders>{children}</ScopedProviders></AuthProvider>
}
