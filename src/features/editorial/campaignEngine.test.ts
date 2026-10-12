import { describe, it, expect } from "vitest";
import {
  generateCampaignPlan,
  validateEditorialItems,
  editorialSignature,
  DEFAULT_REPERTOIRE,
  restructureItem,
  editorialQualityWarnings,
} from "./campaignEngine";
import { emptyContext } from "./monthlyPlanner";
const context = {
  ...emptyContext,
  objective: "Gerar contatos",
  audience: "Primeiro apartamento",
  tone: "Próximo",
  positioning: "Consultoria online",
  topics: ["Planejamento do espaço", "Escolhas de móveis"],
  visualGuidance: "Tons claros e diagramas",
};
const counts = { post: 2, reels: 2, carousel: 2 };
describe("campaign engine — editorial workbench", () => {
  it("is reproducible and preserves exact quantities, valid month and unique ideas", () => {
    const a = generateCampaignPlan("2028-02", "Forma Casa", context, counts);
    expect(a).toEqual(
      generateCampaignPlan("2028-02", "Forma Casa", context, counts),
    );
    expect(a.filter((i) => i.format === "post")).toHaveLength(2);
    expect(a.filter((i) => i.format === "carousel")).toHaveLength(2);
    expect(new Set(a.map((i) => i.editorial?.signature)).size).toBe(6);
    expect(a.every((i) => Number(i.date.slice(-2)) <= 29)).toBe(true);
  });
  it("asks for missing topics and critical briefing; never silently substitutes the six old themes", () => {
    expect(() =>
      generateCampaignPlan(
        "2026-11",
        "Cliente",
        { ...context, topics: [] },
        counts,
      ),
    ).toThrow(/temas/i);
    expect(() =>
      generateCampaignPlan("2026-11", "Cliente", emptyContext, counts),
    ).toThrow(/objetivo/i);
  });
  it("uses exact slide/scene quantities and sums scene durations", () => {
    const plan = generateCampaignPlan(
      "2026-11",
      "Cliente",
      { ...context, carouselSlides: 5, reelsScenes: 6, reelsSeconds: 42 },
      counts,
    );
    expect(
      plan.find((i) => i.format === "carousel")?.editorial?.slides,
    ).toHaveLength(5);
    const scenes = plan.find((i) => i.format === "reels")!.editorial!.scenes!;
    expect(scenes).toHaveLength(6);
    expect(scenes.reduce((n, s) => n + s.seconds, 0)).toBe(42);
    expect(() =>
      generateCampaignPlan(
        "2026-11",
        "X",
        { ...context, reelsScenes: 10, reelsSeconds: 10 },
        counts,
      ),
    ).toThrow(/cena/i);
  });
  it("labels absent facts and suggested visuals without creating prices, results or testimony", () => {
    const plan = generateCampaignPlan("2026-11", "Cliente", context, counts);
    expect(
      plan.every((i) => i.editorial!.visual.includes("material a produzir")),
    ).toBe(true);
    expect(plan.some((i) => i.copy.includes("[Completar"))).toBe(true);
    expect(
      plan.every(
        (i) => !i.copy.includes("R$") && !i.copy.includes("garantido"),
      ),
    ).toBe(true);
    expect(plan.every((i) => i.editorial!.warnings.length)).toBe(true);
  });
  it("filters forbidden themes and blocks conflicting approved information", () => {
    const plan = generateCampaignPlan(
      "2026-11",
      "X",
      { ...context, forbiddenTerms: ["móveis"] },
      { post: 2, reels: 0, carousel: 0 },
    );
    expect(plan.every((i) => !i.title.includes("móveis"))).toBe(true);
    expect(() =>
      generateCampaignPlan(
        "2026-11",
        "X",
        {
          ...context,
          forbiddenTerms: ["garantia"],
          approvedFacts: ["Garantia de resultado"],
        },
        counts,
      ),
    ).toThrow(/conflitam/i);
    const altered = [{ ...plan[0], copy: "Garantia total" }];
    expect(() =>
      validateEditorialItems(altered, {
        ...context,
        forbiddenTerms: ["garantia"],
      }),
    ).toThrow(/proibido/i);
  });
  it("treats archived/rejected history as used and isolates other clients", () => {
    const first = generateCampaignPlan("2026-11", "X", context, counts, {
      clientId: "a",
    });
    const history = first.map((item) => ({
      clientId: "a",
      state: "discarded",
      item,
    }));
    const next = generateCampaignPlan("2026-12", "X", context, counts, {
      clientId: "a",
      history,
    });
    expect(
      next.every(
        (i) =>
          !first.some((j) => j.editorial!.signature === i.editorial!.signature),
      ),
    ).toBe(true);
    expect(
      next.some((i) =>
        i.editorial!.warnings.some((w) => w.includes("histórico")),
      ),
    ).toBe(true);
    expect(
      generateCampaignPlan("2026-11", "X", context, counts, {
        clientId: "b",
        history,
      }),
    ).toEqual(first);
  });
  it("fails explicitly when the eligible combinations are exhausted", () => {
    const repertoire = [{ ...DEFAULT_REPERTOIRE[0], angles: ["guia"] }];
    expect(() =>
      generateCampaignPlan(
        "2026-11",
        "X",
        { ...context, topics: ["Uma pauta"] },
        { post: 2, reels: 0, carousel: 0 },
        { repertoire },
      ),
    ).toThrow(/esgotado/i);
  });
  it("distributes within fixed quotas by eligible pillar weights and respects format availability", () => {
    const pillars = [
      {
        id: "a",
        name: "Educação",
        percentage: 75,
        example_topics: ["Dúvidas", "Rotina"],
        content_formats: ["post", "reels", "carrossel"],
      },
      {
        id: "b",
        name: "Contato",
        percentage: 25,
        example_topics: ["Consultoria"],
        content_formats: ["post", "reels", "carrossel"],
      },
    ];
    const plan = generateCampaignPlan(
      "2026-11",
      "X",
      { ...context, topics: [] },
      { post: 4, reels: 2, carousel: 2 },
      { pillars },
    );
    expect(plan).toHaveLength(8);
    expect(plan.filter((i) => i.editorial?.pillarId === "a")).toHaveLength(6);
    expect(() =>
      generateCampaignPlan(
        "2026-11",
        "X",
        { ...context, topics: [] },
        { post: 0, reels: 1, carousel: 0 },
        { pillars: [{ ...pillars[0], content_formats: ["post"] }] },
      ),
    ).toThrow(/esgotado/i);
  });
  it("normalizes accents for signatures and never truncates an edited copy silently", () => {
    expect(editorialSignature("Decisão", "Educativa", "Ângulo")).toBe(
      editorialSignature("decisao", "educativa", "angulo"),
    );
    const plan = generateCampaignPlan("2026-11", "X", context, {
      post: 1,
      reels: 0,
      carousel: 0,
    });
    expect(() =>
      validateEditorialItems([{ ...plan[0], copy: "a".repeat(3001) }], context),
    ).toThrow(/3000/i);
  });
  it("keeps factual families ineligible until information is explicitly provided", () => {
    const repertoire = DEFAULT_REPERTOIRE.filter((f) => f.id === "process");
    expect(() =>
      generateCampaignPlan(
        "2026-11",
        "X",
        context,
        { post: 1, reels: 0, carousel: 0 },
        { repertoire },
      ),
    ).toThrow(/esgotado/i);
    expect(
      generateCampaignPlan(
        "2026-11",
        "X",
        { ...context, approvedFacts: ["Consultoria realizada online."] },
        { post: 1, reels: 0, carousel: 0 },
        { repertoire },
      )[0].copy,
    ).toContain("Consultoria realizada online.");
  });
  it("resizes a piece explicitly without discarding edited free-form copy silently", () => {
    const plan = generateCampaignPlan("2026-11", "X", context, {
      post: 0,
      reels: 1,
      carousel: 1,
    });
    const carousel = plan.find((i) => i.format === "carousel")!;
    expect(restructureItem(carousel, 5).editorial?.slides).toHaveLength(5);
    const reel = plan.find((i) => i.format === "reels")!;
    expect(restructureItem(reel, 5, 40).editorial?.scenes).toHaveLength(5);
    expect(() =>
      restructureItem({ ...carousel, copy: "Texto livre aprovado" }, 5),
    ).toThrow(/manualmente/i);
  });
  it("consults legacy idea titles, including discarded ideas, during selection", () => {
    const history = [
      {
        clientId: "a",
        state: "discarded",
        item: {
          date: "",
          format: "post" as const,
          title: "Planejamento do espaço",
          copy: "",
        },
      },
    ];
    const plan = generateCampaignPlan(
      "2026-11",
      "X",
      context,
      { post: 2, reels: 0, carousel: 0 },
      { clientId: "a", history },
    );
    expect(
      plan.every((i) => i.editorial?.theme !== "Planejamento do espaço"),
    ).toBe(true);
  });
});

it("supports the maximum contracted batch within the database payload limit", () => {
  const plan = generateCampaignPlan(
    "2026-11",
    "Cliente",
    {
      ...context,
      topics: Array.from({ length: 10 }, (_, i) => `Tema aprovado ${i}`),
      carouselSlides: 10,
      reelsScenes: 10,
      reelsSeconds: 90,
    },
    { post: 30, reels: 30, carousel: 30 },
  );
  expect(plan).toHaveLength(90);
  expect(new TextEncoder().encode(JSON.stringify(plan)).byteLength).toBeLessThan(1200000);
});
it("flags repeated or long blocks and pending facts without truncating edited copy", () => {
  const item = {
    date: "2026-11-01",
    format: "carousel" as const,
    title: "Teste",
    copy: "Slide 1: Uma ideia\nSlide 2: Uma ideia\nSlide 3: [Completar ponto aprovado]",
  };
  expect(editorialQualityWarnings(item)).toHaveLength(2);
  expect(
    editorialQualityWarnings({ ...item, copy: "Texto ".repeat(200) }),
  ).toEqual([expect.stringMatching(/extenso/)]);
  expect(item.copy).toContain("Slide 3");
});
