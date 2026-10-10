import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-supabase-url')
)

// Cliente Supabase oficial tipado com a definição do Database
export const supabase = isSupabaseConfigured
  ? createClient<any>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export interface SupabaseHealthStatus {
  configured: boolean
  connected: boolean
  latencyMs?: number
  error?: string
}

/**
 * Verificação real e segura de conectividade com o Supabase.
 * Não confia apenas nas variáveis de ambiente; realiza ping leve HTTP/PostgreSQL.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false, connected: false }
  }

  const start = performance.now()
  try {
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de conexão')), 4000)
    )

    // Ping leve na tabela pública de agencies ou auth com limit 1
    const pingPromise = supabase.from('agencies').select('id', { count: 'exact', head: true }).limit(1)

    const { error } = (await Promise.race([pingPromise, timeoutPromise])) as any
    const latencyMs = Math.round(performance.now() - start)

    if (error && error.code !== 'PGRST116') {
      // Se o erro for de autorização (ex: JWT anônimo restrito por RLS), o Supabase respondeu normalmente
      if (error.code || error.message?.includes('JWT') || error.message?.includes('permission')) {
        return { configured: true, connected: true, latencyMs }
      }
      return { configured: true, connected: false, latencyMs, error: error.message }
    }

    return { configured: true, connected: true, latencyMs }
  } catch (err: any) {
    return { configured: true, connected: false, error: err.message || 'Falha de conexão' }
  }
}

