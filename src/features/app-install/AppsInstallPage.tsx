import { useState, useSyncExternalStore } from "react";
import { Download, Bell, Smartphone, Monitor } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  getInstallPrompt,
  installed,
  preferenceKey,
  nativeApp,
  requestDeviceNotificationPermission,
  requestInstallation,
  showBrandedNotification,
  subscribeInstall,
} from "./appRuntime";
export default function AppsInstallPage() {
  const auth = useAuth(),
    scope = `${auth.activeAgency?.agencyId || ""}:${auth.user?.id || ""}`;
  const available = useSyncExternalStore(
    subscribeInstall,
    () => Boolean(getInstallPrompt()),
    () => false,
  );
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [devicePreference, setDevicePreference] = useState(() => {
    try {
      return {
        scope,
        enabled: localStorage.getItem(preferenceKey(scope)) === "enabled",
      };
    } catch {
      return { scope, enabled: false };
    }
  });
  const enabled = devicePreference.scope === scope && devicePreference.enabled;
  const setEnabled = (value: boolean) =>
    setDevicePreference({ scope, enabled: value });
  async function enableNotifications() {
    setBusy(true);
    try {
      const permission = await requestDeviceNotificationPermission();
      if (permission !== "granted")
        throw new Error(
          "Permissão não concedida. Confira as permissões deste site no navegador e no sistema.",
        );
      const shown = await showBrandedNotification(
        "Dois.Zero • Notificações ativadas",
        "Teste solicitado por você. Novos avisos da sua conta aparecerão com o símbolo da agência.",
        "doiszero:notification-test",
      );
      if (!shown)
        throw new Error(
          "O serviço de notificações ainda não está disponível. Recarregue o site em HTTPS e tente novamente.",
        );
      localStorage.setItem(preferenceKey(scope), "enabled");
      setEnabled(true);
      setMessage("Notificações ativadas neste dispositivo para sua conta.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar as notificações.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold">Apps e notificações</h1>
        <p className="text-muted-foreground mt-2">
          Leve o workspace da Dois.Zero para seu desktop ou celular.
        </p>
      </header>
      <div className="rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Monitor />
          <h2 className="text-xl font-semibold">Instalar o workspace</h2>
        </div>
        <p>
          O app web instalado abre em uma janela própria e usa a mesma conta da
          plataforma. É necessário estar conectado à internet.
        </p>
        {nativeApp() ? (
          <p>Você está usando o aplicativo nativo Dois.Zero.</p>
        ) : installed() ? (
          <p>Este workspace já está aberto como app instalado.</p>
        ) : (
          <button
            className="bg-primary text-primary-foreground rounded-lg px-4 py-3 disabled:opacity-50 inline-flex gap-2 items-center"
            disabled={!available}
            onClick={() => {
              void requestInstallation()
                .then((outcome) =>
                  setMessage(
                    outcome === "accepted"
                      ? "Instalação solicitada ao navegador."
                      : "Você pode instalar quando quiser.",
                  ),
                )
                .catch(() =>
                  setMessage(
                    "Não foi possível abrir a instalação. Use o menu do navegador.",
                  ),
                );
            }}
          >
            <Download size={18} />
            Instalar app web
          </button>
        )}
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            Mac: Safari → Arquivo → Adicionar ao Dock; Chrome/Edge → Instalar
            aplicativo.
          </li>
          <li>Windows: Edge/Chrome → menu → Instalar aplicativo.</li>
          <li className="flex gap-2">
            <Smartphone size={16} />
            iPhone/iPad: Safari → Compartilhar → Adicionar à Tela de Início.
          </li>
          <li>
            Android: Chrome → menu → Instalar aplicativo ou Adicionar à tela
            inicial.
          </li>
        </ul>
        <p className="text-sm">
          Instaladores nativos para Mac, Windows, Android e iOS estão em
          preparação. Nenhum pacote assinado ou publicado está disponível nesta
          versão.
        </p>
      </div>
      <div className="rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Bell />
          <h2 className="text-xl font-semibold">
            Avisos com a marca da agência
          </h2>
        </div>
        <p>
          Receba o símbolo Dois.Zero e a mensagem de novos avisos destinados à
          sua conta, enquanto a plataforma está aberta. O sistema operacional
          controla a aparência e pode reduzir ou ocultar ícones.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            className="bg-primary text-primary-foreground rounded-lg px-4 py-3 disabled:opacity-50"
            disabled={busy}
            onClick={() => {
              void enableNotifications();
            }}
          >
            {enabled ? "Testar notificação" : "Ativar e testar notificações"}
          </button>
          {enabled && (
            <button
              className="border border-border rounded-lg px-4 py-3"
              onClick={() => {
                try {
                  localStorage.removeItem(preferenceKey(scope));
                  setEnabled(false);
                  setMessage("Avisos desativados neste dispositivo.");
                } catch {
                  setMessage("O armazenamento do navegador está indisponível.");
                }
              }}
            >
              Desativar neste dispositivo
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          App fechado: entrega push ainda não configurada. Som e apresentação
          dependem das permissões do navegador e do sistema; os sons internos da
          plataforma continuam nas preferências de som.
        </p>
      </div>
      {message && (
        <p role="status" className="border border-border rounded-lg p-4">
          {message}
        </p>
      )}
    </section>
  );
}
