import { useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
export interface SoundPreference {
  enabled: boolean;
  volume: number;
}
const memory = new Map<string, string>();
const subscribe = (callback: () => void) => {
  window.addEventListener("dz:sound-preference", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("dz:sound-preference", callback);
    window.removeEventListener("storage", callback);
  };
};
export function useSoundPreference() {
  const auth = useAuth(),
    key = `dz_notification_sounds:${auth.user?.id || "local"}`;
  const raw = useSyncExternalStore(subscribe, () => {
    try {
      return localStorage.getItem(key) || memory.get(key) || null;
    } catch {
      return memory.get(key) || null;
    }
  });
  const preference = useMemo<SoundPreference>(() => {
    try {
      const p = JSON.parse(raw || "null");
      return {
        enabled: p?.enabled === true,
        volume:
          typeof p?.volume === "number"
            ? Math.min(1, Math.max(0, p.volume))
            : 0.35,
      };
    } catch {
      return { enabled: false, volume: 0.35 };
    }
  }, [raw]);
  const save = (next: SoundPreference) => {
    const serialized = JSON.stringify(next);
    memory.set(key, serialized);
    try {
      localStorage.setItem(key, serialized);
    } catch {
      /* memory-only preference */
    }
    window.dispatchEvent(new Event("dz:sound-preference"));
  };
  return { preference, save };
}
