import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { usePublicSite } from "./usePublicSite";
import { SITE_SLUG, siteServices } from "./siteContent";
import { leadWhatsAppUrl, validateLead, type LeadDraft } from "./lead";
import { Turnstile } from "./Turnstile";
import "./public-site.css";
export function PublicBriefPage() {
  const { content, configured } = usePublicSite();
  const [params] = useSearchParams();
  const service = params.get("service");
  const [draft, setDraft] = useState<LeadDraft>(() => ({
    name: "",
    email: "",
    phone: "",
    company: "",
    services: siteServices.some((s) => s.name === service) ? [service!] : [],
    objective: "",
    budget: "",
    consent: false,
    website: "",
    requestId: crypto.randomUUID(),
  }));
  const [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [token, setToken] = useState(""),
    [resetKey, setResetKey] = useState(0);
  const submitting = useRef(false),
    form = useRef<HTMLFormElement>(null);
  const hasCaptcha = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const patch = (field: keyof LeadDraft, value: string | boolean | string[]) =>
    setDraft((d) => ({ ...d, [field]: value }));
  function next() {
    if (!form.current?.reportValidity()) return;
    if (step === 1 && !draft.services.length) {
      setError("Selecione pelo menos um serviço.");
      return;
    }
    setError("");
    setStep((s) => s + 1);
  }
  async function send() {
    if (submitting.current) return;
    const invalid = validateLead(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!configured || !supabase || !hasCaptcha) {
      setError(
        "O envio para a plataforma ainda não foi ativado. Você pode enviar este briefing pelo WhatsApp abaixo.",
      );
      return;
    }
    if (!token) {
      setError("Conclua a verificação de segurança.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error: sendError } = await supabase.functions.invoke(
        "public-agency-brief",
        { body: { slug: SITE_SLUG, ...draft, captchaToken: token } },
      );
      if (sendError || data?.accepted !== true)
        throw new Error(
          "Não foi possível confirmar o envio. Tente novamente ou use o WhatsApp.",
        );
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha no envio. Tente novamente.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
      setToken("");
      setResetKey((n) => n + 1);
    }
  }
  return (
    <div className="dz-site dz-brief">
      <header className="dz-nav">
        <Link to="/" className="dz-wordmark">
          dois<span>.</span>zero
        </Link>
        <Link to="/" className="dz-text-link">
          <ArrowLeft size={15} /> Voltar ao site
        </Link>
      </header>
      <main className="dz-brief-main">
        {done ? (
          <div className="dz-success" role="status">
            <CheckCircle2 size={48} />
            <h1>Primeira conexão feita.</h1>
            <p>
              Seu briefing foi recebido pela agência. Nossa equipe vai avaliar
              sua demanda e entrar em contato pelos dados que você informou.
            </p>
            <Link to="/" className="dz-button">
              Voltar ao site <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            <p className="dz-eyebrow">
              DOIS.ZERO / VAMOS COMEÇAR PELO SEU NEGÓCIO
            </p>
            <h1>
              Uma boa ideia começa
              <br />
              com <em>uma conversa.</em>
            </h1>
            <p>
              Conte o essencial. Sem criar uma conta, sem compromisso de
              contratação.
            </p>
            <div
              className="dz-brief-progress"
              aria-label={`Etapa ${step + 1} de 3`}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className={i <= step ? "dz-active" : ""} />
              ))}
            </div>
            <form
              ref={form}
              className="dz-brief-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 2) next();
                else void send();
              }}
            >
              <p className="dz-eyebrow">
                0{step + 1} /{" "}
                {["SEU CONTATO", "SEU DESAFIO", "REVISAR E ENVIAR"][step]}
              </p>
              {step === 0 && (
                <>
                  <label className="dz-field">
                    Seu nome
                    <input
                      required
                      autoComplete="name"
                      value={draft.name}
                      onChange={(e) => patch("name", e.target.value)}
                      minLength={2}
                      maxLength={120}
                      placeholder="Como podemos chamar você?"
                    />
                  </label>
                  <label className="dz-field">
                    E-mail
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={draft.email}
                      onChange={(e) => patch("email", e.target.value)}
                      maxLength={254}
                      placeholder="voce@empresa.com.br"
                    />
                  </label>
                  <label className="dz-field">
                    WhatsApp com DDD
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      value={draft.phone}
                      onChange={(e) => patch("phone", e.target.value)}
                      pattern="[+()0-9 .-]{10,30}"
                      maxLength={30}
                      placeholder="(84) 99999-9999"
                    />
                  </label>
                  <label className="dz-field">
                    Empresa ou marca{" "}
                    <small>
                      Opcional — também podemos conversar sobre uma marca que
                      está começando.
                    </small>
                    <input
                      autoComplete="organization"
                      value={draft.company}
                      onChange={(e) => patch("company", e.target.value)}
                      maxLength={160}
                      placeholder="Nome da sua empresa"
                    />
                  </label>
                </>
              )}
              {step === 1 && (
                <>
                  <fieldset>
                    <legend>Do que sua marca precisa?</legend>
                    <div className="dz-service-options">
                      {siteServices.map((s) => (
                        <label key={s.name}>
                          <input
                            type="checkbox"
                            checked={draft.services.includes(s.name)}
                            onChange={(e) =>
                              patch(
                                "services",
                                e.target.checked
                                  ? [...draft.services, s.name]
                                  : draft.services.filter((v) => v !== s.name),
                              )
                            }
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="dz-field">
                    O que você quer alcançar?
                    <textarea
                      required
                      minLength={15}
                      maxLength={3000}
                      value={draft.objective}
                      onChange={(e) => patch("objective", e.target.value)}
                      placeholder="Conte seu momento, seu desafio e o que gostaria de fazer diferente."
                    />
                  </label>
                  <label className="dz-field">
                    Investimento previsto{" "}
                    <small>
                      Opcional. Ajuda a definir um escopo que faça sentido para
                      você.
                    </small>
                    <select
                      value={draft.budget}
                      onChange={(e) => patch("budget", e.target.value)}
                    >
                      <option value="">Ainda não defini</option>
                      <option>Até R$ 3 mil</option>
                      <option>R$ 3 mil a R$ 8 mil</option>
                      <option>R$ 8 mil a R$ 20 mil</option>
                      <option>Acima de R$ 20 mil</option>
                    </select>
                  </label>
                </>
              )}
              {step === 2 && (
                <>
                  <dl className="dz-brief-review">
                    <div>
                      <dt>Contato</dt>
                      <dd>
                        {draft.name} · {draft.email}
                        <br />
                        {draft.phone}
                      </dd>
                    </div>
                    <div>
                      <dt>Empresa</dt>
                      <dd>{draft.company || "Não informada"}</dd>
                    </div>
                    <div>
                      <dt>Serviços</dt>
                      <dd>{draft.services.join(" · ")}</dd>
                    </div>
                    <div>
                      <dt>Objetivo</dt>
                      <dd>{draft.objective}</dd>
                    </div>
                    <div>
                      <dt>Investimento</dt>
                      <dd>{draft.budget || "A definir"}</dd>
                    </div>
                  </dl>
                  <label className="dz-check">
                    <input
                      type="checkbox"
                      required
                      checked={draft.consent}
                      onChange={(e) => patch("consent", e.target.checked)}
                    />
                    <span>
                      Autorizo a {content.name} a usar esses dados para avaliar
                      meu briefing e entrar em contato. Eles não serão exibidos
                      no site público.
                    </span>
                  </label>
                  <div className="dz-honeypot" aria-hidden="true">
                    <label>
                      Website
                      <input
                        tabIndex={-1}
                        autoComplete="off"
                        value={draft.website}
                        onChange={(e) => patch("website", e.target.value)}
                      />
                    </label>
                  </div>
                  <Turnstile
                    onToken={setToken}
                    onError={() =>
                      setError(
                        "A verificação não carregou. Tente novamente ou use o WhatsApp.",
                      )
                    }
                    resetKey={resetKey}
                  />
                  {(!configured || !hasCaptcha) && (
                    <p className="dz-submit-preview">
                      Nesta prévia, o recebimento na plataforma aguarda
                      ativação. O envio pelo WhatsApp está disponível após
                      autorizar o contato.
                    </p>
                  )}
                </>
              )}
              {error && (
                <p className="dz-brief-error" role="alert">
                  {error}
                </p>
              )}
              <div className="dz-actions">
                {step > 0 && (
                  <button
                    className="dz-text-link"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setStep((s) => s - 1);
                      setError("");
                    }}
                    style={{ background: "none", border: 0, color: "inherit" }}
                  >
                    <ArrowLeft size={15} /> Voltar
                  </button>
                )}
                <button className="dz-button" type="submit" disabled={busy}>
                  {busy
                    ? "Enviando…"
                    : step < 2
                      ? "Continuar"
                      : "Enviar briefing"}
                  <ArrowRight size={18} />
                </button>
              </div>
              {step === 2 && content.whatsapp && (
                <div className="dz-form-fallback">
                  <p>
                    Prefere conversar diretamente? Envie o resumo pelo WhatsApp
                    da agência.
                  </p>
                  {draft.consent ? (
                    <a
                      href={leadWhatsAppUrl(content.whatsapp, draft)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Enviar pelo WhatsApp <ArrowUpRight size={16} />
                    </a>
                  ) : (
                    <p>Autorize o contato acima para abrir o resumo.</p>
                  )}
                </div>
              )}
            </form>
          </>
        )}
      </main>
    </div>
  );
}
