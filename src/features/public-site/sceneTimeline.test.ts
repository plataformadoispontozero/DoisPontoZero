import { describe, expect, it } from "vitest";
import { sceneFrame } from "./sceneTimeline";
describe("portfolio reading timeline", () => {
  it("holds the art and description still while reading", () => {
    expect(sceneFrame(0.4 / 3, 0, 3)).toEqual(sceneFrame(0.75 / 3, 0, 3));
    expect(sceneFrame(0.5 / 3, 0, 3).copy).toBe(1);
  });
  it("crosses project boundaries continuously with no overlapping copy", () => {
    for (const index of [0, 1]) {
      const before = sceneFrame((index + 1 - 0.0001) / 3, index, 3);
      const after = sceneFrame((index + 1 + 0.0001) / 3, index, 3);
      expect(Math.abs(before.opacity - after.opacity)).toBeLessThan(0.01);
      expect(before.copy).toBe(0);
      expect(sceneFrame((index + 1) / 3, index + 1, 3).copy).toBe(0);
    }
  });
  it("keeps the last project readable at the end", () => {
    expect(sceneFrame(1, 2, 3)).toMatchObject({ opacity: 1, copy: 1 });
    expect(sceneFrame(1, 2, 3).depth).toBeCloseTo(0);
  });
});
