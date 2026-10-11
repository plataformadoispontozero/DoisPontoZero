import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import {
  validateLead,
  type LeadDraft,
} from "../../../src/features/public-site/lead.ts";
const services = new Set([
  "Branding & identidade",
  "Social media & conteúdo",
  "Tráfego pago",
  "Websites & experiências",
  "Assessoria de marketing",
]);
const allowedOrigins = (Deno.env.get("PUBLIC_SITE_ALLOWED_ORIGINS") || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
function response(
  status: number,
  body: Record<string, unknown>,
  origin: string,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
      "Cache-Control": "no-store",
    },
  });
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (!allowedOrigins.includes(origin))
    return response(403, { error: "Origin not allowed" }, "");
  if (req.method === "OPTIONS") return response(200, {}, origin);
  if (req.method !== "POST")
    return response(405, { error: "Method not allowed" }, origin);
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!secret || !serviceKey || !url)
    return response(503, { error: "Form unavailable" }, origin);
  if (!req.headers.get("content-type")?.includes("application/json"))
    return response(415, { error: "JSON required" }, origin);
  try {
    // Stream limit protects memory even when Content-Length is absent or inaccurate.
    const reader = req.body?.getReader();
    if (!reader) return response(400, { error: "Empty request" }, origin);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16000) {
        await reader.cancel();
        return response(413, { error: "Request too large" }, origin);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const raw = JSON.parse(new TextDecoder().decode(bytes));
    const d = raw as LeadDraft;
    if (
      !raw ||
      typeof raw !== "object" ||
      ![
        "name",
        "email",
        "phone",
        "company",
        "objective",
        "budget",
        "website",
        "requestId",
        "slug",
        "captchaToken",
      ].every((k) => typeof raw[k] === "string") ||
      !Array.isArray(d.services) ||
      !d.services.every((s) => typeof s === "string" && services.has(s)) ||
      d.services.length > 5 ||
      d.company.length > 160 ||
      d.budget.length > 100 ||
      d.website ||
      d.consent !== true ||
      validateLead(d) ||
      !/^[a-z0-9][a-z0-9-]{1,79}$/.test(raw.slug) ||
      !/^[a-f0-9-]{36}$/i.test(d.requestId) ||
      raw.captchaToken.length > 2048
    )
      return response(400, { error: "Invalid briefing" }, origin);
    const verify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: raw.captchaToken }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const captcha = await verify.json();
    if (
      !verify.ok ||
      captcha.success !== true ||
      captcha.action !== "agency_brief" ||
      captcha.hostname !== new URL(origin).hostname
    )
      return response(403, { error: "Verification failed" }, origin);
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc("receive_agency_site_lead", {
      p_slug: raw.slug,
      p_payload: {
        name: d.name,
        email: d.email,
        phone: d.phone,
        company: d.company,
        services: d.services,
        objective: d.objective,
        budget: d.budget,
        website: "",
        consent: true,
        requestId: d.requestId,
      },
    });
    if (error)
      return response(
        error.code === "P0001" ? 429 : 400,
        {
          error:
            error.code === "P0001"
              ? "Try again later"
              : "Unable to receive briefing",
        },
        origin,
      );
    return response(200, { accepted: true, receipt: data }, origin);
  } catch {
    return response(400, { error: "Unable to process briefing" }, origin);
  }
});
