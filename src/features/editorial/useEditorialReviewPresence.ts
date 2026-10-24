import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

/** Anonymous, temporary page presence: no device fingerprint or member identity. */
export function useEditorialReviewPresence(token: string | undefined, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !token || !supabase || !/^[a-f0-9]{64}$/.test(token)) return;
    let disposed = false;
    let inFlight = false;
    const pulse = async () => {
      if (disposed || inFlight || document.visibilityState !== 'visible' || !navigator.onLine) return;
      inFlight = true;
      try {
        await supabase!.rpc('touch_public_editorial_review', { p_token: token });
      } catch { /* Presence must never block reviewing or submitting a decision. */ }
      finally { inFlight = false; }
    };
    void pulse();
    const timer = window.setInterval(() => void pulse(), 30000);
    const resume = () => void pulse();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
    };
  }, [token, enabled]);
}
