import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { localDemoAllowed, type AgencyAccess } from './access'

export type AuthStatus = 'INITIALIZING' | 'UNAUTHENTICATED' | 'AUTHENTICATED' | 'NO_ACTIVE_MEMBERSHIP' | 'AUTH_ERROR' | 'BACKEND_UNAVAILABLE'

interface AuthState {
  session: Session | null
  user: User | null
  avatarUrl: string | null
  name: string
  memberships: AgencyAccess[]
  activeAgency: AgencyAccess | null
  permissions: Set<string>
  loading: boolean
  error: string | null
  backendUnavailable: boolean
  isDemo: boolean
}
interface AuthContextValue extends AuthState {
  status: AuthStatus
  selectAgency: (id: string) => void
  signOut: () => Promise<void>
  reloadAccess: () => void
}
const empty: AuthState = { session: null, user: null, name: '', avatarUrl:null, memberships: [], activeAgency: null, permissions: new Set(), loading: false, error: null, backendUnavailable: false, isDemo: false }
const AuthContext = createContext<AuthContextValue | null>(null)
const storageKey = (userId: string) => `doiszero_agency_${userId}`
const demo = localDemoAllowed(import.meta.env.VITE_ENABLE_LOCAL_DEMO, window.location.hostname, isSupabaseConfigured)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initialized, setInitialized] = useState(!supabase)
  const [access, setAccess] = useState<AuthState>(empty)
  const [selected, setSelected] = useState('')
  const [revision, setRevision] = useState(0)
  const generation = useRef(0)
  const sessionUser = useRef<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let disposed = false
    let receivedEvent = false
    // No database calls inside the auth callback: context hydration runs in another effect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (disposed) return
      receivedEvent = true
      generation.current += 1
      const changedUser = sessionUser.current !== (next?.user.id ?? null)
      sessionUser.current = next?.user.id ?? null
      if (changedUser || !next) { setAccess(empty); setSelected('') }
      setSession(next)
      setInitialized(true)
      setRevision(n => n + 1)
    })
    void supabase.auth.getSession().then(({ data, error }) => {
      if (disposed || receivedEvent) return
      if (error) setAccess({ ...empty, error: 'Não foi possível recuperar a sessão.' })
      sessionUser.current = error ? null : data.session?.user.id ?? null
      setSession(error ? null : data.session)
      setInitialized(true)
    }).catch(() => {
      if (disposed || receivedEvent) return
      setAccess({ ...empty, error: 'Serviço de autenticação indisponível.' })
      setInitialized(true)
    })
    return () => { disposed = true; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session) return
    const refresh = () => { if (document.visibilityState === 'visible') setRevision(n => n + 1) }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [session])

  useEffect(() => {
    if (!supabase || !session) return
    const client = supabase
    const ticket = ++generation.current
    let cancelled = false
    const current = () => !cancelled && generation.current === ticket
    setAccess(previous => previous.user ? previous : { ...empty, loading: true })
    async function hydrate() {
      try {
        const { data: { user }, error: userError } = await client.auth.getUser()
        if (userError?.name === 'AuthRetryableFetchError') throw new Error('Serviço de autenticação indisponível. Tente novamente.')
        if (userError || !user || user.id !== session!.user.id) throw new Error('Sessão inválida. Entre novamente.')
        const [{ data: members, error: memberError }, { data: profile, error: profileError }] = await Promise.all([
          client.from('agency_members').select('agency_id, role_id, agencies(id, name, status), roles(id, name)').eq('user_id', user.id).eq('status', 'active'),
          client.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
        ])
        if (memberError) throw memberError
        if (profileError) throw profileError
        const memberships: AgencyAccess[] = (members ?? []).flatMap((member: any) => {
          const agency = Array.isArray(member.agencies) ? member.agencies[0] : member.agencies
          const role = Array.isArray(member.roles) ? member.roles[0] : member.roles
          return agency?.status === 'active' && role ? [{ agencyId: member.agency_id, agencyName: agency.name, roleId: member.role_id, roleName: role.name }] : []
        })
        let saved = selected
        if (!saved) { try { saved = localStorage.getItem(storageKey(user.id)) || '' } catch { /* preference unavailable */ } }
        const activeAgency = memberships.find(m => m.agencyId === saved) ?? memberships[0] ?? null
        const permissions = new Set<string>()
        if (activeAgency && activeAgency.roleName !== 'OWNER') {
          const { data, error } = await client.from('role_permissions').select('allowed, permissions(permission_key)').eq('role_id', activeAgency.roleId).eq('allowed', true)
          if (error) throw error
          for (const row of data ?? []) {
            const permission = Array.isArray(row.permissions) ? row.permissions[0] : row.permissions
            if (permission?.permission_key) permissions.add(permission.permission_key)
          }
        }
        if (current()) setAccess({ ...empty, session, user, name: profile?.full_name || user.email || 'Usuário', avatarUrl:profile?.avatar_url||null, memberships, activeAgency, permissions })
      } catch (error) {
        if (current()) setAccess({ ...empty, backendUnavailable: error instanceof Error && /indisponível|fetch/i.test(error.message), error: error instanceof Error ? error.message : 'Não foi possível verificar o acesso à agência.' })
      }
    }
    void hydrate()
    return () => { cancelled = true }
  }, [session, selected, revision])

  function selectAgency(id: string) {
    if (!access.memberships.some(m => m.agencyId === id)) return
    generation.current += 1
    setAccess({ ...empty, loading: true })
    setSelected(id)
    if (session) { try { localStorage.setItem(storageKey(session.user.id), id) } catch { /* preference unavailable */ } }
    setRevision(n => n + 1)
  }
  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    generation.current += 1
    setSession(null); setSelected(''); setAccess(empty)
  }
  const loading = !initialized || (!!session && !access.user && !access.error) || access.loading
  const status: AuthStatus = !supabase || access.backendUnavailable ? 'BACKEND_UNAVAILABLE' : loading ? 'INITIALIZING' : access.error ? 'AUTH_ERROR' : !session ? 'UNAUTHENTICATED' : !access.activeAgency ? 'NO_ACTIVE_MEMBERSHIP' : 'AUTHENTICATED'
  const value: AuthContextValue = demo ? {
    ...empty, status: 'UNAUTHENTICATED', isDemo: true, name: 'Demonstração local',
    activeAgency: { agencyId: 'demo-agency', agencyName: 'Matriz Criativa', roleId: 'demo-role', roleName: 'DEMO' },
    selectAgency: () => {}, signOut: async () => {}, reloadAccess: () => {},
  } : { ...access, session, status, loading,
    selectAgency, signOut, reloadAccess: () => setRevision(n => n + 1) }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider ausente')
  return context
}
export function useAgencyId() { return useAuth().activeAgency?.agencyId ?? '' }
export function usePermission(key: string) {
  const auth = useAuth()
  return auth.isDemo || (!!auth.activeAgency && (auth.activeAgency.roleName === 'OWNER' || auth.permissions.has(key)))
}
