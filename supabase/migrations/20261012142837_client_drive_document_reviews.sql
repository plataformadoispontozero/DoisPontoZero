-- Drive keeps the original documents; this index stores metadata and human-reviewed context only.
create table public.client_drive_documents (
 id uuid primary key default gen_random_uuid(),
 agency_id uuid not null references public.agencies(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete cascade,
 google_file_id text not null check (google_file_id ~ '^[A-Za-z0-9_-]{10,200}$'),
 name text not null check (length(name) between 1 and 1000),
 mime_type text not null, path text not null default '', version text not null,
 modified_time timestamptz, size text, web_view_link text,
 can_read_text boolean not null default false, available boolean not null default true, synced_at timestamptz not null default now(),
 reviewed_context jsonb not null default '{}'::jsonb,
 reviewed_version text, reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz,
 unique(agency_id,client_id,google_file_id)
);
create index client_drive_documents_client on public.client_drive_documents(agency_id,client_id,synced_at desc);
alter table public.client_drive_documents enable row level security;
revoke all on public.client_drive_documents from public,anon,authenticated;
grant select on public.client_drive_documents to authenticated;
grant all on public.client_drive_documents to service_role;
create policy client_drive_documents_read on public.client_drive_documents for select to authenticated
 using (public.has_agency_permission(agency_id,'clients.view') and public.has_agency_permission(agency_id,'briefings.view'));

create function private.validate_drive_document_client() returns trigger
language plpgsql security invoker set search_path=public,private,pg_temp as $$
begin
 if not exists(select 1 from public.clients where id=new.client_id and agency_id=new.agency_id) then raise exception 'Client does not belong to agency';end if;
 return new;
end $$;
revoke all on function private.validate_drive_document_client() from public,anon,authenticated;
create trigger client_drive_documents_tenant before insert or update on public.client_drive_documents
for each row execute function private.validate_drive_document_client();

-- The browser cannot forge Google metadata or the reviewer identity. Version locking prevents stale reviews.
create function public.save_client_drive_review(p_document uuid,p_version text,p_context jsonb) returns uuid
language plpgsql security definer set search_path=public,private,pg_temp as $$
declare d public.client_drive_documents; kv record; topic jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 select * into d from public.client_drive_documents where id=p_document for update;
 if d.id is null or not public.has_agency_permission(d.agency_id,'clients.view')
 or not public.has_agency_permission(d.agency_id,'briefings.view')
 or not public.has_agency_permission(d.agency_id,'briefings.review') then raise exception 'Review permission required';end if;
 if not d.available or p_version is distinct from d.version then raise exception 'Document changed. Synchronize and review again';end if;
 if p_context is null or jsonb_typeof(p_context)<>'object' or octet_length(p_context::text)>40000 then raise exception 'Invalid reviewed context';end if;
 for kv in select * from jsonb_each(p_context) loop
  if kv.key not in ('objective','audience','tone','positioning','restrictions','topics') then raise exception 'Unexpected context field';end if;
  if kv.key='topics' then
   if jsonb_typeof(kv.value)<>'array' then raise exception 'Invalid topics';end if;
   if jsonb_array_length(kv.value)>50 then raise exception 'Too many topics';end if;
   for topic in select value from jsonb_array_elements(kv.value) loop
    if jsonb_typeof(topic)<>'string' or length(topic#>>'{}')>500 then raise exception 'Invalid topic';end if;
   end loop;
  elsif jsonb_typeof(kv.value)<>'string' or length(kv.value#>>'{}')>4000 then raise exception 'Invalid context text';end if;
 end loop;
 update public.client_drive_documents set reviewed_context=p_context,reviewed_version=version,reviewed_by=auth.uid(),reviewed_at=now() where id=d.id;
 return d.id;
end $$;
revoke all on function public.save_client_drive_review(uuid,text,jsonb) from public,anon;
grant execute on function public.save_client_drive_review(uuid,text,jsonb) to authenticated;
