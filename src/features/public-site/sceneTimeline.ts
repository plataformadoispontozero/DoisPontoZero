const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
export function sceneFrame(progress: number, index: number, count: number) {
  const phase = clamp(progress) * count - index;
  const enter = index === 0 && phase >= 0 ? 1 : smooth(-0.12, 0.18, phase);
  const exit = index === count - 1 ? 0 : smooth(0.88, 1.12, phase);
  return {
    opacity: enter * (1 - exit),
    copy: smooth(0.2, 0.35, phase) * (index === count - 1 ? 1 : 1 - smooth(0.8, 0.95, phase)),
    depth: -(1 - enter) * 300 - exit * 260,
    y: (1 - enter) * 8 - exit * 8,
    rotation: -(1 - enter) * 14 + exit * 12,
  };
}
