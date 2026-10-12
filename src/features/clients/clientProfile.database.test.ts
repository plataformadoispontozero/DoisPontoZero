// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import migration from "../../../supabase/migrations/20261012130758_client_profiles_and_csv_enrichment.sql?raw";
import { describe, it, expect } from "vitest";
const agency = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  owner = "11111111-1111-4111-8111-111111111111",
  creator = "22222222-2222-4222-8222-222222222222";
async function database() {
  const db = new PGlite();
  await db.exec(`create schema auth;create schema private;create role anon;create role authenticated;
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
 create function private.can_editorial(uuid,text) returns boolean language sql as $$select $1='${agency}'::uuid and (auth.uid()='${owner}'::uuid or(auth.uid()='${creator}'::uuid and $2='clients.create'))$$;
 create table clients(id uuid primary key default gen_random_uuid(),agency_id uuid,name text,slug text,logo_url text,status text,unique(agency_id,slug));
 create table audit_logs(agency_id uuid,actor_user_id uuid,action text,entity_type text,metadata jsonb);`);
  await db.exec(migration);
  const call = async (rows: unknown[], tenant = agency) =>
    (
      await db.query<{
        data: {
          imported: number;
          updated: number;
          ignored: number;
          errors: number;
          results: Array<{ id: string; status: string }>;
        };
      }>("select public.import_clients_csv($1,$2,$3::jsonb) as data", [
        tenant,
        "clients.csv",
        JSON.stringify(rows),
      ])
    ).rows[0].data;
  return { db, call };
}
describe("CSV complete profiles persistence", () => {
  it("preserves full profile, explicit fill-missing, idempotence and no overwrite", async () => {
    const { db, call } = await database();
    try {
      await db.exec(`set test.uid='${owner}'`);
      const full = {
        niche: "Teste",
        city: "Cidade",
        instagram: "@teste",
        plan: "Mensal",
        average_ticket: 0,
        monthly_content_count: 0,
        target_audience: "Público",
        age_range: "18 a 40",
        audience_gender: "Todos",
        tone: "Formal",
        differential: "Equipe",
        special_dates: "Aniversário",
        renewal_date: "2028-02-29",
        source_id: "external-id",
        source_created_at: "12/10/2026, 05:20",
        source_updated_at: "2026-10-12T05:20:00Z",
        positioning: "Especialista",
        structure: "Loja",
        monthly_objective: "Contato",
        drive_url: "https://drive.google.com/folders/test",
        maps_url: "https://maps.google.com/?q=test",
      };
      const result = await call([
        {
          row: 2,
          name: "Cliente fictício",
          slug: "ficticio",
          status: "active",
          profile: full,
        },
      ]);
      expect(result).toMatchObject({ imported: 1, updated: 0, errors: 0 });
      const id = result.results[0].id;
      expect(
        (
          await db.query<{ profile: unknown }>(
            "select profile from clients where id=$1",
            [id],
          )
        ).rows[0].profile,
      ).toEqual(full);
      await db.exec(
        `update clients set profile=profile-'city'-'tone',status='archived' where id='${id}'`,
      );
      const update = {
        row: 2,
        name: "Não substituir",
        slug: "ficticio",
        status: "inactive",
        action: "fill_missing",
        existing_id: id,
        profile: {
          city: "Nova",
          tone: "Direto",
          average_ticket: 99,
          monthly_content_count: 20,
          niche: "Não substituir",
          source_id: "external-id",
        },
      };
      expect(await call([update])).toMatchObject({ updated: 1, errors: 0 });
      expect(
        (
          await db.query<{
            name: string;
            status: string;
            profile: Record<string, unknown>;
          }>("select name,status,profile from clients where id=$1", [id])
        ).rows[0],
      ).toMatchObject({
        name: "Cliente fictício",
        status: "archived",
        profile: {
          city: "Nova",
          tone: "Direto",
          average_ticket: 0,
          monthly_content_count: 0,
          niche: "Teste",
        },
      });
      expect(await call([update])).toMatchObject({
        updated: 0,
        ignored: 1,
        errors: 0,
      });
      expect(
        await call([{ ...update, profile: { source_id: "wrong" } }]),
      ).toMatchObject({ errors: 1 });
      const audit = await db.query("select metadata from audit_logs");
      expect(JSON.stringify(audit.rows)).not.toContain("Cliente fictício");
      expect(JSON.stringify(audit.rows)).not.toContain("external-id");
    } finally {
      await db.close();
    }
  }, 30000);
  it("enforces permissions, target tenant/identity, whitelist and numeric/date constraints", async () => {
    const { db, call } = await database();
    try {
      await expect(call([])).rejects.toThrow("Permissão");
      await db.exec(`set test.uid='${creator}'`);
      const result = await call([
        {
          row: 2,
          name: "Fictício",
          slug: "ficticio",
          profile: { monthly_content_count: 12 },
        },
      ]);
      expect(result.imported).toBe(1);
      await expect(
        call([
          {
            row: 2,
            name: "Fictício",
            slug: "ficticio",
            action: "fill_missing",
            existing_id: result.results[0].id,
            profile: { city: "Teste" },
          },
        ]),
      ).rejects.toThrow("edição");
      await expect(
        call([], "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
      ).rejects.toThrow("Permissão");
      await db.exec(`set test.uid='${owner}'`);
      for (const profile of [
        { role: "OWNER" },
        { average_ticket: 1.001 },
        { monthly_content_count: 3.5 },
        { renewal_date: "2026-02-29" },
        { source_created_at: "31/02/2026" },
        { drive_url: "https://user:secret@example.com" },
        { drive_url: "https://host:abc" },
        { drive_url: "javascript:alert(1)" },
      ])
        expect(
          await call([{ row: 3, name: "Inválido", slug: "invalid", profile }]),
        ).toMatchObject({ errors: 1, imported: 0 });
      expect(
        await call([
          {
            row: 3,
            name: "Intruso",
            slug: "ficticio",
            action: "fill_missing",
            existing_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            profile: { city: "Teste" },
          },
        ]),
      ).toMatchObject({ errors: 1 });
      expect(
        await call([
          {
            row: 3,
            name: "Intruso",
            slug: "wrong-slug",
            action: "fill_missing",
            existing_id: result.results[0].id,
            profile: { city: "Teste" },
          },
        ]),
      ).toMatchObject({ errors: 1 });
      await expect(
        db.query("update clients set profile=$1::jsonb", [
          JSON.stringify({ unknown: "x" }),
        ]),
      ).rejects.toThrow("clients_profile_valid");
      expect((await db.query("select id from clients")).rows).toHaveLength(1);
    } finally {
      await db.close();
    }
  }, 30000);
});
