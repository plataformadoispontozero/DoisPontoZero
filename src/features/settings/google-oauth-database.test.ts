// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { it, expect } from "vitest";
import migration from "../../../supabase/migrations/20261012043036_google_workspace_oauth.sql?raw";
it("OAuth states are single-use, expire, recheck permission and never expose credentials", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth;create schema private;create role anon;create role authenticated;create role service_role;
 create table public.agencies(id uuid primary key,status text);create table auth.users(id uuid primary key);
 create table public.roles(id uuid primary key,agency_id uuid,name text);
 create table public.agency_members(agency_id uuid,user_id uuid,role_id uuid,status text);
 create table public.permissions(id uuid,permission_key text);create table public.role_permissions(role_id uuid,permission_id uuid,allowed boolean);
 create function private.can_editorial(uuid,text) returns boolean language sql as $$select false$$;
 insert into agencies values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active');insert into auth.users values('11111111-1111-4111-8111-111111111111');
 insert into roles values('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','OWNER');
 insert into agency_members values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','active');`);
    await db.exec(migration);
    const action = (name: string, hash: string) =>
      db.query("select google_workspace_secret($1,$2,$3,$4,$5)", [
        name,
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "11111111-1111-4111-8111-111111111111",
        hash,
        "encrypted-placeholder",
      ]);
    await action("state", "first");
    expect((await action("consume", "first")).rows).toHaveLength(1);
    await expect(action("consume", "first")).rejects.toThrow("expirado");
    await action("state", "expired");
    await db.exec(
      "update private.google_workspace_states set expires_at=now()-interval '1 second'",
    );
    await expect(action("consume", "expired")).rejects.toThrow("expirado");
    await action("state", "revoked");
    await db.exec("update agency_members set status='inactive'");
    await expect(action("consume", "revoked")).rejects.toThrow("revogada");
    await action("save", "");
    await db.exec("set role authenticated");
    await expect(action("read", "")).rejects.toThrow("permission denied");
    await expect(
      db.query("select * from private.google_workspace_secrets"),
    ).rejects.toThrow("permission denied");
    await db.exec("reset role;set role anon");
    await expect(action("consume", "revoked")).rejects.toThrow(
      "permission denied",
    );
  } finally {
    await db.close();
  }
}, 30000);
