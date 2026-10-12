import { describe, it, expect } from "vitest";
import { generateMonthlyPlan, emptyContext } from "./monthlyPlanner";
const context = {
  ...emptyContext,
  objective: "apresentar o serviço",
  audience: "comércios locais",
  positioning: "Atendimento próximo e claro",
  topics: ["Atendimento", "Planejamento", "Consultoria"],
};
describe("monthly editorial planning", () => {
  it("respects exact quantities and a leap-year month", () => {
    const plan = generateMonthlyPlan("2028-02", "Cliente teste", context, {
      post: 3,
      reels: 2,
      carousel: 4,
    });
    expect(plan).toHaveLength(9);
    expect(plan.filter((i) => i.format === "carousel")).toHaveLength(4);
    expect(plan.filter((i) => i.format === "reels")).toHaveLength(2);
    expect(
      plan.every(
        (i) => i.date.startsWith("2028-02-") && Number(i.date.slice(-2)) <= 29,
      ),
    ).toBe(true);
    expect(plan[0].editorial?.audience).toBe("comércios locais");
  });
  it("rejects invalid quotas and missing strategic information", () => {
    expect(() =>
      generateMonthlyPlan("2026-13", "X", context, {
        post: 1,
        reels: 0,
        carousel: 0,
      }),
    ).toThrow();
    expect(() =>
      generateMonthlyPlan("2026-02", "X", emptyContext, {
        post: 1,
        reels: 0,
        carousel: 0,
      }),
    ).toThrow();
    expect(() =>
      generateMonthlyPlan("2026-02", "X", context, {
        post: 1.5,
        reels: 0,
        carousel: 0,
      }),
    ).toThrow();
  });
});
