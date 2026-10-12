// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import migration from "../../../../supabase/migrations/20261012043032_import_clients_csv.sql?raw";
import { it, expect } from "vitest";
it("importação isolada: permissão, agência, repetição, falha parcial e auditoria", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create schema private; create role anon; create role authenticated; create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function private.can_editorial(uuid,text) returns boolean language sql as $$select auth.uid()='11111111-1111-4111-8111-111111111111'::uuid and $1='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid$$;
 create table clients(id uuid default gen_random_uuid(),agency_id uuid,name text,slug text,logo_url text,status text,unique(agency_id,slug));
 create table audit_logs(agency_id uuid,actor_user_id uuid,action text,entity_type text,metadata jsonb);
 `);
    await db.exec(migration);
    const call = async (agency: string, rows: unknown[]) =>
      db.query<{ data: { imported: number; ignored: number; errors: number } }>(
        "select import_clients_csv($1,$2,$3::jsonb) data",
        [agency, "clientes.csv", JSON.stringify(rows)],
      );
    const agency = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    await expect(call(agency, [])).rejects.toThrow("Permissão");
    await db.exec("set test.uid='11111111-1111-4111-8111-111111111111'");
    await expect(
      call("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", []),
    ).rejects.toThrow("Permissão");
    const rows = [
      { row: 2, name: "Cliente", slug: "cliente" },
      { row: 3, name: "Inválido", slug: "ABC" },
      { row: 4, name: "Intruso", slug: "intruso", agency_id: agency },
    ];
    expect((await call(agency, rows)).rows[0].data).toMatchObject({
      imported: 1,
      ignored: 0,
      errors: 2,
    });
    expect((await call(agency, [rows[0]])).rows[0].data).toMatchObject({
      imported: 0,
      ignored: 1,
      errors: 0,
    });
    expect((await db.query("select * from clients")).rows).toHaveLength(1);
    const audit = await db.query<{ metadata: unknown }>(
      "select metadata from audit_logs",
    );
    expect(JSON.stringify(audit.rows)).not.toContain("Cliente");
  } finally {
    await db.close();
  }
}, 30000);
