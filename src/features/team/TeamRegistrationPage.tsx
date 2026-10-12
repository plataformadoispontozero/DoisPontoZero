import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { OfficialBrandLogo } from '@/components/shared/OfficialBrandLogo'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { professions } from './teamProfessions'

export function TeamRegistrationPage(){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[profession,setProfession]=useState(''),[website,setWebsite]=useState('')
 const [busy,setBusy]=useState(false),[submitted,setSubmitted]=useState(false),[error,setError]=useState('')
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('')
  if(password.length<10||password!==confirm){setError('Use pelo menos 10 caracteres e confirme a mesma senha.');return}
  if(!supabase||!professions.some(p=>p.value===profession)){setError('Selecione sua função profissional.');return}
  setBusy(true)
  try {
   const {data,error:failure}=await supabase.functions.invoke('team-registration',{body:{action:'register',name:name.trim(),email:email.trim(),password,profession,honey:website}})
   if(failure){let message='Não foi possível enviar o cadastro. Tente novamente.';try{message=(await failure.context?.json())?.error||message}catch{};throw Error(message)}
   if(!data?.submitted)throw Error(data?.error||'O servidor não confirmou a solicitação.')
   setPassword('');setConfirm('');setSubmitted(true)
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar o cadastro.')}
  finally{setBusy(false)}
 }
 return <main className="dz-auth-page"><div className="dz-auth-layout"><aside className="dz-auth-intro">
  <Link to="/"><OfficialBrandLogo src="/agency/official-logo.webp" name="Dois.Zero"/></Link>
  <p className="dz-auth-eyebrow">FAÇA PARTE DA EQUIPE</p><h2>Seu talento.<br/><span>Nosso próximo capítulo.</span></h2><p>Solicite seu acesso ao workspace da agência. O gestor ou administrador revisará seu cadastro antes de liberar a plataforma.</p>
 </aside><section className="dz-auth-card" aria-labelledby="registration-title"><p className="dz-auth-eyebrow">CADASTRO DA EQUIPE</p><h1 id="registration-title">Solicitar acesso</h1>
 {submitted?<div role="status" className="space-y-4"><h2 className="text-lg font-semibold">Solicitação recebida</h2><p>Se este e-mail estiver disponível, seu cadastro ficará aguardando aprovação do responsável. Combine com o gestor a confirmação dos seus dados. Você poderá entrar com a senha criada depois da aprovação.</p><p>Se você já tem uma conta, use o login ou a recuperação de senha.</p></div>:<form onSubmit={submit} className="space-y-4">
 <div><label htmlFor="register-name">Nome completo</label><Input id="register-name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name"/></div>
 <div><label htmlFor="register-email">E-mail</label><Input id="register-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} autoComplete="email"/></div>
 <div><label htmlFor="register-profession">Sua função profissional</label><Select id="register-profession" value={profession} onChange={e=>setProfession(e.target.value)} options={[{value:'',label:'Selecione sua função'},...professions]} required/><p className="text-xs text-[#B8B8C0] mt-2">Seu nível de acesso será definido pelo responsável na aprovação.</p></div>
 <div><label htmlFor="register-password">Criar senha</label><PasswordInput id="register-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} maxLength={128} autoComplete="new-password"/></div>
 <div><label htmlFor="register-confirm">Confirmar senha</label><PasswordInput id="register-confirm" value={confirm} onChange={e=>setConfirm(e.target.value)} required autoComplete="new-password"/></div>
 <div className="hidden" aria-hidden="true"><label htmlFor="register-website">Website</label><input id="register-website" value={website} onChange={e=>setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"/></div>
 {error&&<p role="alert" className="text-red-300">{error}</p>}<Button type="submit" className="w-full" variant="primary" loading={busy} disabled={busy||!supabase}>Enviar cadastro para aprovação</Button>
 </form>}
 <Link className="dz-auth-recovery" to="/login">Já tenho acesso — entrar</Link><p className="dz-auth-client-note">Área exclusiva da equipe. Clientes usam os links de briefing e aprovação enviados pela agência.</p>
 </section></div></main>
}
