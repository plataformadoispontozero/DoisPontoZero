import { nativeApp } from "@/features/app-install/appRuntime"
import { OfficialBrandLogo } from '@/components/shared/OfficialBrandLogo'
import { ArrowLeft, ArrowUpRight, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
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
  const params = new URLSearchParams(location.search)
  const returnPath = safeReturnPath(location.state?.from ?? params.get('next'))
  const [error, setError] = useState(() => params.has('error') || new URLSearchParams(location.hash.slice(1)).has('error') ? 'O acesso foi cancelado ou não pôde ser concluído. Tente novamente.' : '')
  const [message, setMessage] = useState('')
  if (mode === 'login' && (auth.user || auth.isDemo)) return <Navigate to={returnPath} replace />
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
        navigate(returnPath, { replace: true })
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${nativeApp() ? "https://doispontozero.renatodesigner.com.br" : window.location.origin}/reset-password` })
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
  return <main className="dz-auth-page">
    <div className="dz-auth-layout">
      <aside className="dz-auth-intro">
        <Link to="/" aria-label="Dois.Zero — início"><OfficialBrandLogo src="/agency/official-logo.webp" name="Dois.Zero" /></Link>
        <p className="dz-auth-eyebrow">WORKSPACE DA EQUIPE</p>
        <h2>Boas ideias.<br /><span>Uma equipe conectada.</span></h2>
        <p>Projetos, conteúdo e entregas em um só lugar. Seu espaço para transformar estratégia em trabalho que acontece.</p>
        <Link to="/" className="dz-auth-back"><ArrowLeft size={17} /> Voltar ao site da agência</Link>
      </aside>
      <section className="dz-auth-card" aria-labelledby="auth-title">
        <div className="dz-auth-lock"><LockKeyhole size={24} /></div>
        <p className="dz-auth-eyebrow">ACESSO RESTRITO À EQUIPE</p>
        <h1 id="auth-title">{title}</h1>
        <p className="dz-auth-description">{mode === 'login' ? 'Entre com o e-mail e a senha da sua conta de equipe. Ainda não tem acesso? Envie seu cadastro para aprovação.' : mode === 'forgot' ? 'Informe o e-mail da sua conta para receber as instruções de recuperação.' : 'Escolha uma nova senha para voltar ao seu workspace.'}</p>
        {!isSupabaseConfigured && <p role="alert">Supabase não configurado. O acesso administrativo permanece protegido.</p>}
        <form onSubmit={submit} className="space-y-5">
          {mode !== 'reset' && <div><label htmlFor="auth-email">E-mail</label><Input id="auth-email" type="email" autoComplete="email" placeholder="voce@agencia.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>}
          {mode !== 'forgot' && <div><label htmlFor="auth-password">Senha</label><PasswordInput id="auth-password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'reset' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} /></div>}
          {mode === 'reset' && <div><label htmlFor="auth-confirm">Confirmar senha</label><PasswordInput id="auth-confirm" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>}
          {error && <p role="alert" className="text-[#FB7185]">{error}</p>}
          {message && <p role="status">{message}</p>}
          <Button className="w-full" size="lg" type="submit" variant="primary" loading={busy} disabled={busy || !supabase || (mode === 'reset' && !auth.session)}>{mode === 'login' ? 'Entrar' : mode === 'forgot' ? 'Enviar instruções' : 'Atualizar senha'}<ArrowUpRight size={18} /></Button>
        </form>
        {mode === 'login' ? <Link to="/forgot-password" className="dz-auth-recovery">Esqueci minha senha</Link> : <Link to="/login" className="dz-auth-recovery">Voltar ao login</Link>}
        {mode === 'login' && <Link to="/register" className="dz-auth-recovery">Cadastrar na equipe</Link>}
        <p className="dz-auth-client-note">É cliente? Briefings e aprovações são acessados pelos links enviados pela agência, sem precisar entrar no workspace.</p>
      </section>
    </div>
  </main>
}
