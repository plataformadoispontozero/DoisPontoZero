import { useEffect, useRef } from "react";
export function useSceneMotion(enabled: boolean, panelCount: number) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 767px)",
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      if (media.matches) {
        node.style.setProperty("--progress", "0");
        return;
      }
      const rect = node.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight)),
      );
      node.style.setProperty("--progress", String(progress));
      const panels = node.querySelectorAll<HTMLElement>("[data-scene-panel]");
      const travel = progress * panels.length;
      const active = Math.min(panels.length - 1, Math.floor(travel));
      const phase = Math.min(1, travel - active);
      panels.forEach((panel, i) => {
        const selected = i === active;
        panel.style.transform = selected
          ? `translate3d(0, ${(1 - phase) * 8}%, ${-(1 - phase) * 240}px) rotateY(${(1 - phase) * -14}deg)`
          : "translate3d(0, 0, -700px)";
        panel.style.opacity = selected ? "1" : "0";
        panel.style.pointerEvents = selected ? "auto" : "none";
        panel.style.zIndex = selected ? "2" : "0";
        const reveal = Math.min(1, Math.max(0, (phase - 0.25) / 0.3));
        const copy = panel.querySelector<HTMLElement>(".dz-scene-copy");
        if (copy) {
          copy.style.opacity = String(reveal);
          copy.style.transform = `translateY(${(1 - reveal) * 28}px)`;
        }
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    update();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
    };
  }, [enabled, panelCount]);
  return ref;
}
