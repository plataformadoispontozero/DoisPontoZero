import { describe, it, expect, vi } from "vitest";
import {
  defaultSiteContent,
  normalizeSiteContent,
  safeMediaUrl,
  readSiteDraft,
  writeSiteDraft,
} from "./siteContent";
import { leadWhatsAppUrl, validateLead, type LeadDraft } from "./lead";
const lead: LeadDraft = {
  name: "Cliente de teste",
  email: "cliente@example.invalid",
  phone: "84999999999",
  company: "Empresa",
  services: ["Branding & identidade"],
  objective: "Precisamos reposicionar a marca para o novo público.",
  budget: "",
  consent: true,
  website: "",
  requestId: "11111111-1111-4111-8111-111111111111",
};
describe("Public site boundaries", () => {
  it("keeps hero pieces distinct from gallery pieces", () => {
    const hero = defaultSiteContent.projects
      .filter((p) => p.placement === "hero")
      .map((p) => p.title);
    expect(
      defaultSiteContent.projects
        .filter((p) => p.placement === "gallery")
        .every((p) => !hero.includes(p.title)),
    ).toBe(true);
  });
  it("rejects executable and insecure media URLs", () => {
    for (const v of [
      "javascript:alert(1)",
      "data:image/svg+xml,test",
      "//external.example/image",
      "http://example.com/image",
      "/\\external",
    ])
      expect(safeMediaUrl(v)).toBe("");
    expect(safeMediaUrl("/agency/logo.webp")).toBe("/agency/logo.webp");
  });
  it("normalizes malformed content without injecting markup or extra fields", () => {
    const c = normalizeSiteContent({
      name: "<script>test</script>",
      projects: [null, { image: "javascript:x", placement: "bad" }],
      team: "bad",
      service_role: "never expose",
    });
    expect(c.name).toBe("<script>test</script>");
    expect(c.projects[0].image).toBe("");
    expect(c.team).toEqual([]);
    expect(c).not.toHaveProperty("service_role");
  });
  it("isolates local drafts between agencies", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    });
    writeSiteDraft("agency-a", {
      ...defaultSiteContent,
      headline: "Agency A draft",
    });
    expect(readSiteDraft("agency-a")?.headline).toBe("Agency A draft");
    expect(readSiteDraft("agency-b")).toBeNull();
    vi.unstubAllGlobals();
  });
  it("requires valid contact, useful objective and explicit consent", () => {
    expect(validateLead(lead)).toBeNull();
    expect(validateLead({ ...lead, consent: false })).toMatch(/Autorize/);
    expect(validateLead({ ...lead, email: "invalid" })).toMatch(/e-mail/);
    expect(validateLead({ ...lead, objective: "short" })).toMatch(/objetivo/);
    expect(validateLead({ ...lead, services: [] })).toMatch(/serviço/);
  });
  it("encodes the WhatsApp draft and never sends it automatically", () => {
    const url = new URL(
      leadWhatsAppUrl("+55 (84) 99954-2292", {
        ...lead,
        objective: "Uma ideia & outra?",
      }),
    );
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/5584999542292");
    expect(url.searchParams.get("text")).toContain("Uma ideia & outra?");
  });
});

 it("normalizes the hero background opacity without changing project media", () => {
   expect(normalizeSiteContent({ ...defaultSiteContent, heroOpacity: undefined }).heroOpacity).toBe(50);
   expect(normalizeSiteContent({ ...defaultSiteContent, heroOpacity: 150 }).heroOpacity).toBe(100);
   expect(normalizeSiteContent({ ...defaultSiteContent, heroOpacity: -5 }).heroOpacity).toBe(0);
   expect(normalizeSiteContent({ ...defaultSiteContent, heroOpacity: 25 }).heroOpacity).toBe(25);
 });
