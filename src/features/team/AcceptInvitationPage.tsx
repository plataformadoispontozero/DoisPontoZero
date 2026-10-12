import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { OfficialBrandLogo } from "@/components/shared/OfficialBrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
export function AcceptInvitationPage() {
  const auth = useAuth();
  const [params] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)),
  );
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [email, setEmail] = useState(""),
    [name, setName] = useState("");
  const [verified, setVerified] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const query = new URLSearchParams(window.location.search);
  const id = params.get("id") || query.get("id") || "",
    hash = params.get("token_hash") || "",
    isNew = !!hash || query.get("setup") === "1";
  async function accept(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!supabase || !/^[0-9a-f-]{36}$/i.test(id))
        throw Error("Convite inválido. Peça um novo link ao administrador.");
      if (isNew && (password.length < 8 || password !== confirm))
        throw Error("Use pelo menos 8 caracteres e confirme a mesma senha.");
      if (isNew) {
        if (!verified && hash) {
          const result = await supabase.auth.verifyOtp({
            token_hash: hash,
            type: "invite",
          });
          if (result.error)
            throw Error(
              "Link expirado ou já utilizado. Solicite um novo convite.",
            );
          setVerified(true);
          window.history.replaceState(null, "", "/accept-invitation#id=" + id);
        }
        if (!hash) {
          const session = await supabase.auth.getUser();
          if (session.error || !session.data.user) throw Error("Abra o link recebido por e-mail para definir sua senha.");
        }
        const updated = await supabase.auth.updateUser({
          password,
          data: { full_name: name.trim() },
        });
        if (updated.error) throw Error(updated.error.message);
        if (name.trim()) {
          const profile = await supabase
            .from("profiles")
            .update({ full_name: name.trim() })
            .eq("id", updated.data.user.id);
          if (profile.error) throw profile.error;
        }
      } else if (!auth.user) {
        const login = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (login.error)
          throw Error("Confira o e-mail e a senha da conta convidada.");
      }
      const accepted = await supabase.rpc("accept_team_invitation", {
        p_id: id,
      });
      if (accepted.error || !accepted.data)
        throw Error(
          accepted.error?.message || "Não foi possível aceitar o convite.",
        );
      auth.reloadAccess();
      window.location.assign("/dashboard");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível concluir o convite.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#101014] p-5 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#1c1c24] p-7 space-y-5">
        <OfficialBrandLogo src="/agency/official-logo.webp" name="Dois.Zero" />
        <h1 className="text-2xl font-semibold">
          Seu acesso à equipe Dois.Zero
        </h1>
        <p className="text-sm text-[#B8B8C0]">
          {isNew
            ? "Defina sua senha pessoal para aceitar o convite."
            : "Entre com a conta do e-mail convidado para confirmar seu acesso à agência."}
        </p>
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        <form onSubmit={accept} className="space-y-4">
          {isNew ? (
            <label className="block">
              Seu nome
              <Input
                aria-label="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </label>
          ) : !auth.user ? (
            <label className="block">
              E-mail
              <Input
                aria-label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
          ) : (
            <p>Conta atual: {auth.user.email}</p>
          )}
          {(isNew || !auth.user) && (
            <label className="block">
              {isNew ? "Criar senha" : "Senha"}
              <Input
                aria-label={isNew ? "Criar senha" : "Senha"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete={isNew ? "new-password" : "current-password"}
                required
              />
            </label>
          )}
          {isNew && (
            <label className="block">
              Confirmar senha
              <Input
                aria-label="Confirmar senha"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          )}
          <Button type="submit" variant="primary" loading={busy}>
            Aceitar convite e entrar
          </Button>
        </form>
        {!isNew && auth.user && (
          <Button variant="ghost" onClick={() => void auth.signOut()}>
            Usar outra conta
          </Button>
        )}
        {!isNew && (
          <Link className="block text-[#FF8759]" to="/forgot-password">
            Esqueci minha senha
          </Link>
        )}
        <Link className="block text-[#FF8759]" to="/">
          Voltar ao site
        </Link>
      </section>
    </main>
  );
}
