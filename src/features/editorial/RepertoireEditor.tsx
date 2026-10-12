import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { DEFAULT_REPERTOIRE, type RepertoireFamily } from "./campaignEngine";
export function RepertoireEditor({
  agency,
  version,
  families,
}: {
  agency: string;
  version: number;
  families: RepertoireFamily[];
}) {
  const auth = useAuth(),
    cache = useQueryClient();
  const [draft, setDraft] = useState(families),
    [angleText, setAngleText] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  if (
    !["OWNER", "ADMIN", "MANAGER"].includes(auth.activeAgency?.roleName || "")
  )
    return null;
  return (
    <details className="rounded-xl border border-white/10 p-4 space-y-3">
      <summary className="cursor-pointer">
        Repertório da agência · versão {version} · gestores/admin
      </summary>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Ative famílias e edite os ângulos disponíveis. Salvar cria uma nova
        versão; campanhas anteriores preservam sua versão. Blocos de redação são
        fixos nesta primeira evolução.
      </p>
      {DEFAULT_REPERTOIRE.map((f) => {
        const current = draft.find((d) => d.id === f.id);
        return (
          <div key={f.id} className="space-y-2">
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={!!current}
                onChange={(e) =>
                  setDraft(
                    e.target.checked
                      ? [...draft, f]
                      : draft.filter((d) => d.id !== f.id),
                  )
                }
              />
              {f.label}
            </label>
            {current && (
              <label className="block text-xs">
                Ângulos de {f.label}
                <input
                  className="w-full rounded-lg border border-white/15 bg-[var(--color-surface)] p-2"
                  value={angleText[f.id] ?? current.angles.join(", ")}
                  onChange={(e) =>
                    setAngleText({ ...angleText, [f.id]: e.target.value })
                  }
                />
              </label>
            )}
          </div>
        );
      })}
      <Button
        disabled={busy || !draft.length}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            const r = await supabase!.rpc("save_editorial_repertoire", {
              p_agency: agency,
              p_families: draft.map((f) => ({
                ...f,
                angles: (angleText[f.id] ?? f.angles.join(","))
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              })),
            });
            if (r.error) throw r.error;
            await cache.invalidateQueries({
              queryKey: ["campaign-repertoire", agency],
            });
            setMessage("Nova versão do repertório salva.");
          } catch (e) {
            setMessage(
              e instanceof Error
                ? e.message
                : "Não foi possível salvar o repertório.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Salvar nova versão do repertório
      </Button>
      {message && <p role="status">{message}</p>}
    </details>
  );
}
