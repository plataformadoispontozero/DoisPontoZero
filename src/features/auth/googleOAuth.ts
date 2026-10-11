import { supabase } from '@/lib/supabase/client'
import { safeReturnPath } from './access'

export function googleCallbackUrl(origin: string, next: unknown) {
  const url = new URL('/login', origin)
  url.searchParams.set('next', safeReturnPath(next))
  return url.toString()
}

export async function startGoogleOAuth(origin: string, next: unknown) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const apiUrl = import.meta.env.VITE_SUPABASE_URL
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const response = await fetch(`${apiUrl}/auth/v1/settings`, {
    headers: { apikey: apiKey }, signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error('Não foi possível verificar o acesso com Google. Tente novamente.')
  const settings = await response.json()
  if (!settings.external?.google) throw new Error('O acesso com Google ainda não foi ativado pela agência. Use e-mail e senha por enquanto.')
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: googleCallbackUrl(origin, next), queryParams: { prompt: 'select_account' } },
  })
  if (error) throw new Error('Não foi possível iniciar o acesso com Google. Tente novamente.')
}
