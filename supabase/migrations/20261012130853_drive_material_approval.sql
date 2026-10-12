-- Drive files remain private; only metadata and client feedback are persisted.
create table private.drive_material_approvals (
 id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id),
 client_id uuid not null references public.clients(id), owner_id uuid not null references auth.users(id),
 token_hash text not null unique, folder_id text not null, files jsonb not null,
 expires_at timestamptz not null default now()+interval '14 days',
 status text not null default 'pending' check(status in ('pending','approved','changes_requested')),
 feedback text, created_at timestamptz not null default now(), responded_at timestamptz,
 check(jsonb_typeof(files)='array' and jsonb_array_length(files) between 1 and 100)
);
alter table private.drive_material_approvals enable row level security;
revoke all on private.drive_material_approvals from public,anon,authenticated;
create function public.drive_material_approval_service(p_action text,p_hash text default null,p_agency uuid default null,p_client uuid default null,p_owner uuid default null,p_folder text default null,p_files jsonb default null,p_status text default null,p_feedback text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item private.drive_material_approvals;
begin
 if p_action='create' then
  if not exists(select 1 from public.clients where id=p_client and agency_id=p_agency) or not exists(select 1 from public.agency_members where agency_id=p_agency and user_id=p_owner and status='active') then raise exception 'Invalid approval scope';end if;
  insert into private.drive_material_approvals(agency_id,client_id,owner_id,token_hash,folder_id,files) values(p_agency,p_client,p_owner,p_hash,p_folder,p_files) returning * into item;
 elsif p_action in ('read','respond') then
  select * into item from private.drive_material_approvals where token_hash=p_hash and expires_at>now() for update;
  if not found then raise exception 'Invalid or expired approval';end if;
  if not exists(select 1 from public.agency_members where agency_id=item.agency_id and user_id=item.owner_id and status='active') then raise exception 'Approval owner no longer active';end if;
  if p_action='respond' then
   if item.status<>'pending' or p_status not in ('approved','changes_requested') or length(coalesce(p_feedback,''))>4000 then raise exception 'Invalid approval response';end if;
   update private.drive_material_approvals set status=p_status,feedback=p_feedback,responded_at=now() where id=item.id returning * into item;
  end if;
 else raise exception 'Invalid approval action';end if;
 return to_jsonb(item)-'token_hash';
end;$$;
revoke all on function public.drive_material_approval_service(text,text,uuid,uuid,uuid,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.drive_material_approval_service(text,text,uuid,uuid,uuid,text,jsonb,text,text) to service_role;
