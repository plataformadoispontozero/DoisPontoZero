import { nativeApp } from "@/features/app-install/appRuntime";
import { useCallback, useEffect, useState } from "react";
import {
  useAgencyId,
  usePermission,
  useAuth,
} from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
interface State {
  configured: boolean;
  connected: boolean;
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
    allowed = usePermission("settings.edit");
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
      if (error || data?.error)
        throw Error(
          data?.error ||
            "Backend Google ainda não disponível. Configure e implante a integração antes de conectar.",
        );
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
  }, [agency, allowed, auth.user?.id, request]);
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
      } else if (name === "drive-list") setFiles(data.files);
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
        Conecte a conta de trabalho por autorização Google. O acesso pertence ao
        seu usuário nesta agência.
      </p>
      {!allowed && (
        <p role="alert">É necessária a permissão de editar configurações.</p>
      )}
      {error && (
        <p role="alert" className="text-orange-300">
          {error}
        </p>
      )}
      {state && !state.configured && (
        <p role="status">
          Configuração necessária no Google Cloud e no backend. Nenhuma conta
          está conectada.
        </p>
      )}
      {state?.connected ? (
        <>
          <p>Conta autorizada: {state.email}</p>
          <div className="flex gap-3 flex-wrap">
            {[
              ["drive-list", "Consultar arquivos autorizados"],
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
          </div>
        </>
      ) : (
        <button
          className="bg-[#c84408] rounded-lg p-3"
          disabled={!allowed || busy || !state?.configured}
          onClick={() => void action("start")}
        >
          Conectar Google Agenda e Drive
        </button>
      )}
      <p>
        Drive: somente arquivos autorizados para este aplicativo (drive.file).
        Agenda: eventos da conta autorizada. A consulta não importa nem modifica
        dados da plataforma.
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
