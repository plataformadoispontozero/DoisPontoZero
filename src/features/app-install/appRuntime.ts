export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
let prompt: InstallPrompt | null = null;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
export const subscribeInstall = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getInstallPrompt = () => prompt;
export const installed = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
export function registerAppRuntime() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    prompt = event as InstallPrompt;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    prompt = null;
    emit();
  });
  if (
    "serviceWorker" in navigator &&
    window.isSecureContext &&
    !("__TAURI_INTERNALS__" in window)
  ) {
    void navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch(() => {
        /* Settings reports unavailable browser capability. */
      });
  }
}
export async function requestInstallation() {
  const current = prompt;
  if (!current) return null;
  prompt = null;
  emit();
  await current.prompt();
  return (await current.userChoice).outcome;
}
export function safeNotificationText(value: string, max: number) {
  return Array.from(value, (character) =>
    character.charCodeAt(0) < 32 ? " " : character,
  )
    .join("")
    .trim()
    .slice(0, max);
}
export const nativeApp = () => "__TAURI_INTERNALS__" in window;
export async function requestDeviceNotificationPermission() {
  if (nativeApp()) {
    const api = await import("@tauri-apps/plugin-notification");
    return (await api.isPermissionGranted())
      ? "granted"
      : await api.requestPermission();
  }
  if (!("Notification" in window))
    throw new Error(
      "Este navegador não oferece notificações. No iPhone/iPad, instale o site na tela de início e abra o app instalado.",
    );
  return Notification.requestPermission();
}
export async function showBrandedNotification(
  title: string,
  body: string,
  tag: string,
) {
  if (nativeApp()) {
    const api = await import("@tauri-apps/plugin-notification");
    if (!(await api.isPermissionGranted())) return false;
    api.sendNotification({
      title: safeNotificationText(title, 120),
      body: safeNotificationText(body, 350),
    });
    return true;
  }
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted" ||
    !("serviceWorker" in navigator)
  )
    return false;
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration?.active) return false;
  await registration.showNotification(safeNotificationText(title, 120), {
    body: safeNotificationText(body, 350),
    icon: "/app-icons/icon-192.png",
    badge: "/app-icons/badge-96.png",
    tag,
    data: { route: "/notifications" },
  });
  return true;
}
export const preferenceKey = (scope: string) =>
  `doiszero:device-notifications:${scope}`;
