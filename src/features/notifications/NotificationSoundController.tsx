import { useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
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
  const { preference } = useSoundPreference(),
    notifications = useNotifications();
  const baseline = useRef<{
    scope: string;
    events: Map<string, { kind: SoundKind; title: string }>;
  } | null>(null);
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
    if (!preference.enabled || !notifications.data) return;
    const events = new Map<string, { kind: SoundKind; title: string }>();
    for (const n of notifications.data)
      if (!n.read_at && n.agency_id === agency && n.recipient_id === auth.user?.id)
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
    notifications.data,
    scope,
    agency,
    auth.user?.id,
    preference.enabled,
    preference.volume,
  ]);
  return null;
}
