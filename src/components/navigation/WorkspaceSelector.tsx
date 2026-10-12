import { Building2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useBranding } from "@/hooks/useBranding";
export function WorkspaceSelector({
  mobile = false,
  collapsed = false,
  onExpand,
}: {
  mobile?: boolean;
  collapsed?: boolean;
  onExpand?: () => void;
}) {
  const auth = useAuth(),
    { branding } = useBranding(),
    name = auth.activeAgency?.agencyName || branding.company.workspaceName;
  if (collapsed)
    return (
      <button
        aria-label="Expandir para selecionar agência"
        title={name}
        onClick={onExpand}
        className="flex w-full min-h-[44px] items-center justify-center rounded-lg hover:bg-[var(--color-surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <Building2 className="w-4 h-4 text-[var(--color-accent)]" />
      </button>
    );
  return (
    <div className="space-y-1 px-2 py-2 text-xs">
      <p className="text-[10px] text-[var(--color-text-muted)]">
        WORKSPACE DA AGÊNCIA
      </p>
      {!auth.isDemo && auth.memberships.length > 1 ? (
        <select
          aria-label={mobile ? "Agência no menu móvel" : "Agência"}
          value={auth.activeAgency?.agencyId || ""}
          onChange={(e) => auth.selectAgency(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-[var(--color-text-primary)]"
        >
          {auth.memberships.map((m) => (
            <option value={m.agencyId} key={m.agencyId}>
              {m.agencyName}
            </option>
          ))}
        </select>
      ) : (
        <p className="font-medium text-[var(--color-text-primary)] truncate">
          {name}
        </p>
      )}
    </div>
  );
}
