import { sceneFrame } from "./sceneTimeline";
import { useEffect, useRef } from "react";
export function useSceneMotion(enabled: boolean, panelCount: number) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 767px)",
    );
    node.style.setProperty("--scene-height", `${panelCount * 170 + 100}svh`);
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
      panels.forEach((panel, i) => {
        const state = sceneFrame(progress, i, panels.length);
        panel.style.transform = `translate3d(0, ${state.y}%, ${state.depth}px) rotateY(${state.rotation}deg)`;
        panel.style.opacity = String(state.opacity);
        panel.style.pointerEvents = state.opacity > 0.6 ? "auto" : "none";
        panel.style.zIndex = state.opacity > 0.6 ? "2" : "1";
        const copy = panel.querySelector<HTMLElement>(".dz-scene-copy");
        if (copy) {
          copy.style.opacity = String(state.copy);
          copy.style.transform = `translateY(${(1 - state.copy) * 28}px)`;
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
