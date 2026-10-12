import { useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { preferenceKey, showBrandedNotification } from "./appRuntime";
export function BrandedNotificationController() {
  const auth = useAuth(),
    notifications = useNotifications();
  const scope = `${auth.activeAgency?.agencyId || ""}:${auth.user?.id || ""}`;
  const baseline = useRef<{ scope: string; ids: Set<string> } | null>(null);
  useEffect(() => {
    if (
      !notifications.data ||
      !auth.user ||
      !auth.activeAgency ||
      auth.isDemo
    ) {
      baseline.current = null;
      return;
    }
    const scoped = notifications.data.filter(
      (n) =>
        n.recipient_id === auth.user!.id &&
        n.agency_id === auth.activeAgency!.agencyId,
    );
    const ids = new Set(scoped.map((n) => n.id));
    if (baseline.current?.scope === scope) {
      let enabled = false;
      try {
        enabled = localStorage.getItem(preferenceKey(scope)) === "enabled";
      } catch {
        /* Device storage can be disabled. */
      }
      if (enabled)
        for (const notification of scoped) {
          if (
            !notification.read_at &&
            !baseline.current.ids.has(notification.id)
          ) {
            void showBrandedNotification(
              notification.title,
              notification.body,
              `doiszero:${notification.id}`,
            ).catch(() => {});
          }
        }
    }
    // First load is a baseline, never a burst of old notifications.
    baseline.current = { scope, ids };
  }, [notifications.data, auth.user, auth.activeAgency, auth.isDemo, scope]);
  return null;
}
