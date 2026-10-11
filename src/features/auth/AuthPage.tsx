import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from './AuthProvider'
import { safeReturnPath } from './access'

export function AuthPage({ mode = 'login' }: { mode?: 'login' | 'forgot' | 'reset' }) {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  if (mode === 'login' && (auth.user || auth.isDemo)) return <Navigate to={safeReturnPath(location.state?.from)} replace />
  const title = mode === 'forgot' ? 'Recuperar senha' : mode === 'reset' ? 'Definir nova senha' : 'Entrar na sua agência'
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage('')
    if (!supabase) { setError('Configure o Supabase para acessar o modo agência.'); return }
    if (mode === 'reset' && (password !== confirmation || password.length < 8)) { setError('Informe senhas iguais com pelo menos 8 caracteres.'); return }
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        navigate(safeReturnPath(location.state?.from), { replace: true })
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
        if (error) throw error
        setMessage('Se houver uma conta para este e-mail, você receberá as instruções de recuperação.')
      } else {
        if (!auth.session) throw new Error('Abra o link de recuperação enviado ao seu e-mail.')
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setPassword(''); setConfirmation(''); setMessage('Senha atualizada. Você pode acessar sua agência.')
      }
    } catch { setError(mode === 'login' ? 'Não foi possível entrar. Confira e-mail e senha ou tente novamente.' : 'Não foi possível concluir. Confira o link de recuperação e tente novamente.') }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-[#101014] text-[#F8F9FC] flex items-center justify-center p-4"><section className="w-full max-w-md rounded-xl border border-[#30303B] bg-[#1C1C24] p-6 space-y-5"><Link to="/" className="font-bold">Dois.Zero</Link><h1 className="text-2xl font-semibold">{title}</h1>{!isSupabaseConfigured && <p role="alert">Supabase não configurado. O acesso administrativo permanece protegido.</p>}<form onSubmit={submit} className="space-y-4">{mode !== 'reset' && <div><label htmlFor="auth-email">E-mail</label><Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>}{mode !== 'forgot' && <div><label htmlFor="auth-password">Senha</label><Input id="auth-password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'reset' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} /></div>}{mode === 'reset' && <div><label htmlFor="auth-confirm">Confirmar senha</label><Input id="auth-confirm" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>}{error && <p role="alert" className="text-[#FB7185]">{error}</p>}{message && <p role="status">{message}</p>}<Button type="submit" variant="primary" loading={busy} disabled={!supabase || (mode === 'reset' && !auth.session)}>{mode === 'login' ? 'Entrar' : mode === 'forgot' ? 'Enviar instruções' : 'Atualizar senha'}</Button></form>{mode === 'login' ? <Link to="/forgot-password" className="block text-[#B8FF65]">Esqueci minha senha</Link> : <Link to="/login" className="block text-[#B8FF65]">Voltar ao login</Link>}</section></main>
}
