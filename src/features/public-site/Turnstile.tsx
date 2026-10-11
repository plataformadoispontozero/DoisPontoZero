import { useEffect, useRef } from "react";
interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
let loading: Promise<void> | undefined;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  return (loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = undefined;
      reject(
        new Error("Não foi possível carregar a verificação de segurança."),
      );
    };
    document.head.appendChild(script);
  }));
}
export function Turnstile({
  onToken,
  onError,
  resetKey,
}: {
  onToken: (v: string) => void;
  onError: () => void;
  resetKey: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tokenRef = useRef(onToken),
    errorRef = useRef(onError);
  useEffect(() => {
    tokenRef.current = onToken;
    errorRef.current = onError;
  }, [onToken, onError]);
  const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!key) return;
    let disposed = false,
      id: string | undefined;
    void loadTurnstile()
      .then(() => {
        if (disposed || !ref.current || !window.turnstile) return;
        id = window.turnstile.render(ref.current, {
          sitekey: key,
          theme: "dark",
          action: "agency_brief",
          callback: (token: string) => tokenRef.current(token),
          "expired-callback": () => tokenRef.current(""),
          "error-callback": () => {
            tokenRef.current("");
            errorRef.current();
          },
        });
      })
      .catch(() => errorRef.current());
    return () => {
      disposed = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [key, resetKey]);
  return key ? <div ref={ref} aria-label="Verificação de segurança" /> : null;
}
