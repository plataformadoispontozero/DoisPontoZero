import { useEffect, useRef } from "react";
export function useSceneMotion(enabled: boolean) {
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
      panels.forEach((panel, i) => {
        const distance = i - progress * (panels.length - 1);
        panel.style.transform = `translate3d(${distance * 115}%, ${Math.abs(distance) * 5}%, ${-Math.abs(distance) * 180}px) rotateY(${distance * -18}deg)`;
        panel.style.opacity = String(
          Math.max(0.12, 1 - Math.abs(distance) * 0.58),
        );
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
  }, [enabled]);
  return ref;
}
