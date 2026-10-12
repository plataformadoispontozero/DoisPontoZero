import { describe, expect, it } from "vitest";
import {
  missingProfileFields,
  readClientProfile,
  validateClientProfile,
} from "./clientProfile";
describe("detailed client profile", () => {
  it("accepts original CSV dates without inventing timezone or source identifiers", () => {
    const profile = {
      niche: "Serviços",
      average_ticket: 1234.5,
      monthly_content_count: 0,
      source_created_at: "12/10/2026, 05:20",
      source_updated_at: "2026-10-12T05:20:00Z",
      renewal_date: "2028-02-29",
    };
    expect(validateClientProfile(profile)).toEqual([]);
    expect(readClientProfile(profile)).toEqual(profile);
  });
  it("rejects unknown fields, dangerous URLs, bad numbers and impossible calendar dates", () => {
    for (const profile of [
      { agency_id: "other" },
      { drive_url: "javascript:alert(1)" },
      { maps_url: "https://user:secret@example.com" },
      { average_ticket: 1.001 },
      { monthly_content_count: 1.5 },
      { renewal_date: "2026-02-29" },
      { source_created_at: "31/02/2026" },
      { source_updated_at: "2026-02-29T01:00:00Z" },
      { source_created_at: "12/10/2026 25:00" },
    ])
      expect(validateClientProfile(profile).length).toBeGreaterThan(0);
  });
  it("fills only absent data, keeping current values including numeric zero", () => {
    const current = {
      niche: "Atual",
      average_ticket: 0,
      monthly_content_count: 0,
      city: " ",
      tone: null,
    };
    const incoming = {
      niche: "Importado",
      average_ticket: 500,
      monthly_content_count: 20,
      city: "Nova cidade",
      tone: "Formal",
      target_audience: "Equipe",
    };
    expect(missingProfileFields(current, incoming)).toEqual({
      city: "Nova cidade",
      tone: "Formal",
      target_audience: "Equipe",
    });
  });
  it("drops unknown or invalid persisted data and preserves valid factual fields", () => {
    expect(
      readClientProfile({
        niche: " Serviços ",
        target_audience: ["unsafe"],
        role: "OWNER",
        average_ticket: 3,
        monthly_content_count: -1,
      }),
    ).toEqual({ niche: "Serviços", average_ticket: 3 });
  });
});
