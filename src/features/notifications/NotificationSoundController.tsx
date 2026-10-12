import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, usePermission } from "@/features/auth/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useNotifications } from "./hooks/useNotifications";
import { useSoundPreference } from "./useSoundPreference";
import {
  notificationSoundKind,
  playNotificationSound,
  unlockNotificationAudio,
  type SoundKind,
} from "./notificationSounds";
import { toast } from "@/components/ui/Toast";
export function NotificationSoundController() {
  const auth = useAuth(),
    agency = auth.activeAgency?.agencyId || "",
    scope = agency + ":" + auth.user?.id;
  const clientsAllowed = usePermission("clients.view"),
    strategyAllowed = usePermission("strategy.view");
  const { preference } = useSoundPreference(),
    notifications = useNotifications();
  const baseline = useRef<{
    scope: string;
    events: Map<string, { kind: SoundKind; title: string }>;
  } | null>(null);
  const source = useQuery({
    queryKey: ["sound-operational-events", agency, auth.user?.id],
    enabled:
      preference.enabled &&
      !!agency &&
      !!auth.user &&
      !auth.isDemo &&
      isSupabaseConfigured,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const events = new Map<string, { kind: SoundKind; title: string }>();
      if (clientsAllowed) {
        const r = await supabase!
          .from("clients")
          .select("id,name")
          .eq("agency_id", agency);
        if (r.error) throw r.error;
        for (const c of r.data || [])
          events.set("client:" + c.id, {
            kind: "client",
            title: "Cliente novo: " + c.name,
          });
      }
      if (strategyAllowed) {
        const r = await supabase!
          .from("monthly_editorial_campaigns")
          .select("id,status")
          .eq("agency_id", agency);
        if (r.error) throw r.error;
        for (const c of r.data || [])
          if (c.status === "approved" || c.status === "production")
            events.set("editorial:" + c.id + ":" + c.status, {
              kind: c.status === "approved" ? "approval" : "production",
              title:
                c.status === "approved"
                  ? "Cliente aprovou o calendário editorial."
                  : "Calendário entrou em produção.",
            });
      }
      return events;
    },
  });
  useEffect(() => {
    if (!preference.enabled) {
      baseline.current = null;
      return;
    }
    const unlock = () => {
      void unlockNotificationAudio().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [preference.enabled, scope]);
  useEffect(() => {
    if (!preference.enabled || !source.data || !notifications.data) return;
    const events = new Map(source.data);
    for (const n of notifications.data)
      if (!n.read_at)
        events.set("notification:" + n.id, {
          kind: notificationSoundKind(n.type),
          title: n.title,
        });
    if (baseline.current?.scope === scope) {
      const additions = [...events].filter(
        ([id]) => !baseline.current!.events.has(id),
      );
      const event = additions.at(-1)?.[1];
      if (event && document.visibilityState === "visible") {
        if (playNotificationSound(event.kind, preference.volume))
          toast.info(event.title);
      }
    }
    baseline.current = { scope, events };
  }, [
    source.data,
    notifications.data,
    scope,
    preference.enabled,
    preference.volume,
  ]);
  return null;
}
