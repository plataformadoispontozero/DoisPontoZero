import { useState } from "react";
import { useSoundPreference } from "./useSoundPreference";
import { Button } from "@/components/ui/Button";
import {
  soundKinds,
  soundLabels,
  unlockNotificationAudio,
  playNotificationSound,
} from "./notificationSounds";
export function NotificationSoundControls() {
  const { preference, save } = useSoundPreference(),
    [error, setError] = useState("");
  async function enable() {
    try {
      if (!(await unlockNotificationAudio()))
        throw Error("Áudio não disponível neste navegador.");
      save({ ...preference, enabled: true });
      playNotificationSound("approval", preference.volume);
      setError("");
    } catch {
      setError(
        "Não foi possível liberar o áudio. Tente novamente com uma interação no navegador.",
      );
    }
  }
  return (
    <section
      aria-label="Sons de notificação"
      className="rounded-xl border border-[var(--color-border)] p-5 space-y-4"
    >
      <h2 className="font-semibold">Sons de notificação</h2>
      <p className="text-sm text-content-secondary">
        Cinco sinais distintos. Receba avisos enquanto a plataforma estiver
        aberta; eventos novos são consultados a cada 15 segundos. O histórico
        não toca ao entrar.
      </p>
      <Button
        onClick={() =>
          preference.enabled
            ? save({ ...preference, enabled: false })
            : void enable()
        }
      >
        {preference.enabled
          ? "Silenciar notificações"
          : "Ativar sons de notificação"}
      </Button>
      <label className="block">
        Volume dos avisos
        <input
          aria-label="Volume dos avisos"
          type="range"
          min="0"
          max="100"
          value={Math.round(preference.volume * 100)}
          onChange={(e) =>
            save({ ...preference, volume: Number(e.target.value) / 100 })
          }
          className="block w-full max-w-sm"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {soundKinds.map((kind) => (
          <Button
            variant="outline"
            size="sm"
            key={kind}
            onClick={async () => {
              try {
                if (await unlockNotificationAudio())
                  playNotificationSound(kind, preference.volume);
                else setError("Áudio não disponível neste navegador.");
              } catch {
                setError("Não foi possível tocar o aviso.");
              }
            }}
          >
            Testar: {soundLabels[kind]}
          </Button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
