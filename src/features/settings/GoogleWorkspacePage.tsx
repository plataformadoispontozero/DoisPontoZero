import { FunctionsHttpError } from "@supabase/supabase-js";
import { nativeApp } from "@/features/app-install/appRuntime";
import { useCallback, useEffect, useState } from "react";
import {
  useAgencyId,
  usePermission,
  useAuth,
} from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import {ProviderCredentialsForm} from "@/features/integrations/ProviderCredentialsForm";
import {authorizeClientFolder} from "@/features/integrations/googlePicker";
interface State {
  configured: boolean;
  connected: boolean;
  central?: boolean;
  rootFolderConfigured?: boolean;
  rootFolderReady?: boolean;
  requiresReauthorization?: boolean;
  email?: string;
}
export default function GoogleWorkspacePage() {
  const auth = useAuth();
  return (
    <GoogleWorkspacePanel
      key={`${auth.activeAgency?.agencyId || ""}:${auth.user?.id || ""}`}
    />
  );
}
function GoogleWorkspacePanel() {
  const auth = useAuth(),
    agency = useAgencyId(),
    settingsAllowed = usePermission("settings.edit"),
    clientsAllowed = usePermission("clients.view"),
    canManage = settingsAllowed && ["OWNER", "ADMIN"].includes(auth.activeAgency?.roleName || ""),
    allowed = canManage || clientsAllowed;
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<State | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [files, setFiles] = useState<{ id: string; name: string }[]>([]),
    [events, setEvents] = useState<
      {
        id: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
      }[]
    >([]);
  const request = useCallback(
    async (action: string) => {
      if (!supabase || !agency) throw Error("Conexão indisponível.");
      const { data, error } = await supabase.functions.invoke(
        "google-workspace",
        { body: { agencyId: agency, action } },
      );
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const details = await error.context.json().catch(() => null);
          throw Error(details?.error || (error.context.status === 401
            ? "Sua sessão expirou. Entre novamente na plataforma."
            : "Não foi possível consultar a integração Google. Tente novamente."));
        }
        throw Error("Não foi possível comunicar com a integração Google. Verifique a conexão e tente novamente.");
      }
      if (data?.error) throw Error(data.error);
      return data;
    },
    [agency],
  );
  useEffect(() => {
    let active = true;
    // Reset identity-bound display before loading the newly selected account.
    // eslint-disable-next-line react/set-state-in-effect
    setState(null);
    setError("");
    setFiles([]);
    setEvents([]);
    if (allowed && agency)
      request("status")
        .then((s) => {
          if (active) setState(s);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [agency, allowed, auth.user?.id, request, retry]);
  async function action(name: string) {
    setBusy(true);
    setError("");
    try {
      const data = await request(name);
      if (name === "start") {
        if (nativeApp())
          throw Error(
            "Conecte o Google pelo navegador na página oficial de configurações; o Google não aceita autorização no navegador embutido do app.",
          );
        const target = new URL(data.url);
        if (target.origin !== "https://accounts.google.com")
          throw Error("Endereço de autorização inválido.");
        window.location.assign(target.href);
      } else if (name === "root-picker-session") {await authorizeClientFolder(data);setState(await request("status"));}
      else if (name === "drive-list") setFiles(data.files);
      else if (name === "calendar-list") setEvents(data.events);
      else {
        setState(data);
        setFiles([]);
        setEvents([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível conectar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">Google Agenda e Drive</h2>
      <p>
        Conecte uma única conta de trabalho da agência. A equipe acessa os
        arquivos dos clientes pela plataforma, sem conectar contas Google pessoais.
      </p>
      {canManage && <ProviderCredentialsForm key={agency} provider="google" onSaved={()=>setRetry(v=>v+1)} />}
      {!allowed && (
        <p role="alert">É necessária a permissão de editar configurações.</p>
      )}
      {error && (
        <p role="alert" className="text-orange-300">
          {error}
          <button className="block underline mt-2" onClick={() => setRetry(v => v + 1)}>Tentar novamente</button>
        </p>
      )}
      {state && !state.configured && (
        <p role="status">
          Configuração necessária no Google Cloud e no backend. Nenhuma conta
          está conectada.
        </p>
      )}
      {state && !state.configured && (
        <div className="rounded-xl border border-white/15 bg-white/5 p-5 space-y-3">
          <h3 className="font-semibold">Ativar Agenda e Drive no Google Cloud</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Habilite Google Drive API e Google Calendar API no projeto <strong>firm-pentameter-474412-h7</strong>.</li>
            <li>Configure a tela de consentimento OAuth e adicione as contas da equipe como usuários de teste enquanto o aplicativo estiver em teste.</li>
            <li>Em Credenciais, crie um ID do cliente OAuth do tipo Aplicativo da Web. Uma conta de serviço não substitui esse cliente OAuth.</li>
            <li>Cadastre a origem <code className="break-all">https://doispontozero.renatodesigner.com.br</code> e o URI de redirecionamento <code className="break-all">https://pvkhlobsiszrjtblpruu.supabase.co/functions/v1/google-workspace</code>.</li>
            <li>Copie o Client ID e o Client Secret para o formulário seguro acima. A chave de criptografia é configurada pelo administrador técnico no backend; não precisa compartilhar segredos por chat.</li>
          </ol>
          <a className="inline-block underline text-orange-300" href="https://console.cloud.google.com/apis/credentials?project=firm-pentameter-474412-h7" target="_blank" rel="noreferrer">Abrir credenciais do Google Cloud</a>
          <button className="block underline" onClick={() => setRetry(v => v + 1)}>Verificar configuração novamente</button>
        </div>
      )}
      {state?.requiresReauthorization && <p role="status" className="text-orange-300">O administrador precisa reconectar o Google para autorizar a leitura dos materiais já existentes e manter a conexão central da agência.</p>}
      {state?.connected ? (
        <>
          <p>Conta central autorizada: {state.email}</p>
          {!state.rootFolderReady && <p role="status" className="text-orange-300">{state.rootFolderConfigured ? "A pasta raiz ainda precisa estar disponível e autorizada pelo Google Picker para gravação." : "Configure a pasta raiz da agência para acessar os materiais dos clientes."}</p>}
          {canManage && <div className="flex gap-3 flex-wrap">
            {[
              ["drive-list", "Consultar arquivos da conta central"],
              ["root-picker-session", "Autorizar pasta raiz para gravação"],
              ["calendar-list", "Consultar próximos 30 dias"],
              ["disconnect", "Desconectar Google"],
            ].map(([name, label]) => (
              <button
                className="border border-white/20 p-3 rounded-lg"
                key={name}
                disabled={busy}
                onClick={() => void action(name)}
              >
                {label}
              </button>
            ))}
          </div>}
        </>
      ) : (
        <button
          className="bg-[#c84408] rounded-lg p-3"
          disabled={!canManage || busy || !state?.configured}
          onClick={() => void action("start")}
        >
          Conectar conta central Google da agência
        </button>
      )}
      <p>
        Drive: leitura dos arquivos existentes (drive.readonly) e gravação somente em pastas autorizadas para o aplicativo (drive.file). Agenda: eventos da conta central. A equipe consulta apenas a pasta vinculada ao cliente nas áreas de produção. O administrador configura e revoga a conexão.
      </p>
      {files.length > 0 && (
        <div>
          <h3>Arquivos autorizados</h3>
          {files.map((f) => (
            <p key={f.id}>{f.name}</p>
          ))}
        </div>
      )}
      {events.length > 0 && (
        <div>
          <h3>Próximos eventos</h3>
          {events.map((e) => (
            <p key={e.id}>
              {e.summary || "Sem título"} · {e.start?.dateTime || e.start?.date}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
