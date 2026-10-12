-- Historical client documents. No native workflow, approval tokens or tasks are created.
create table public.client_legacy_records (
 id uuid primary key default gen_random_uuid(),
 agency_id uuid not null references public.agencies(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete cascade,
 source_project text not null check(source_project='88ee1363-3966-494f-a78d-ad375651555f'),
 source_kind text not null check(source_kind in ('briefings','estrategias_mensais','calendarios','demands','controle_videomaker')),
 source_id uuid not null,
 source_client_id uuid not null,
 source_status text,
 source_created_at timestamptz,
 source_updated_at timestamptz,
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=2000000),
 imported_at timestamptz not null default now(),
 unique(agency_id,source_project,source_kind,source_id)
);
create index client_legacy_records_client_idx on public.client_legacy_records(agency_id,client_id,source_kind);
alter table public.client_legacy_records enable row level security;
revoke all on public.client_legacy_records from anon,authenticated;
grant select on public.client_legacy_records to authenticated;
grant all on public.client_legacy_records to service_role;
create policy client_legacy_records_read on public.client_legacy_records for select to authenticated
 using(private.can_editorial(agency_id,'clients.view') and
 case source_kind when 'briefings' then private.can_editorial(agency_id,'briefings.view')
 when 'estrategias_mensais' then private.can_editorial(agency_id,'strategy.view')
 when 'calendarios' then private.can_editorial(agency_id,'strategy.view')
 else private.can_editorial(agency_id,'tasks.view') end);
create function private.validate_client_legacy_record() returns trigger language plpgsql
set search_path='' as $$
begin
 if not exists(select 1 from public.clients c where c.id=new.client_id and c.agency_id=new.agency_id and c.profile->>'source_id'=new.source_client_id::text) then
 raise exception 'Legacy client source mapping does not match tenant' using errcode='23514';
 end if;
 if jsonb_path_exists(new.payload, '$.** ? (@.type() == "object").keyvalue() ? (@.key like_regex "(token|secret|password|senha|api_key|credential|acesso_)" flag "i")') then
 raise exception 'Legacy credentials and approval tokens must be excluded' using errcode='23514';
 end if;
 return new;
end;
$$;
create trigger validate_client_legacy_record before insert or update on public.client_legacy_records for each row execute function private.validate_client_legacy_record();
revoke all on function private.validate_client_legacy_record() from public;
comment on table public.client_legacy_records is 'Read-only imported source snapshots; original statuses are historical, not current approvals. Client review required before creating native work.';
