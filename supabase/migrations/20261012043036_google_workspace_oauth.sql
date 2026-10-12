-- Pending local migration: encrypted provider credentials never exposed to client roles.
create table private.google_workspace_secrets (
 agency_id uuid not null references public.agencies(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 ciphertext text not null, updated_at timestamptz not null default now(), primary key(agency_id,user_id)
);
create table private.google_workspace_states (
 hash text primary key, agency_id uuid not null references public.agencies(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 ciphertext text not null, expires_at timestamptz not null default now()+interval '10 minutes'
);
alter table private.google_workspace_secrets enable row level security;
alter table private.google_workspace_states enable row level security;
revoke all on private.google_workspace_secrets,private.google_workspace_states from public,anon,authenticated;
create function public.google_workspace_permission(p_agency uuid) returns boolean language sql stable security definer set search_path=public,private,pg_temp as $$ select private.can_editorial(p_agency,'settings.edit') $$;
revoke all on function public.google_workspace_permission(uuid) from public,anon;
grant execute on function public.google_workspace_permission(uuid) to authenticated;
create function public.google_workspace_secret(p_action text,p_agency uuid default null,p_user uuid default null,p_hash text default null,p_ciphertext text default null)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare s private.google_workspace_states; c text;
begin
 if p_action='state' then
  delete from private.google_workspace_states where expires_at < now();
  insert into private.google_workspace_states(hash,agency_id,user_id,ciphertext) values(p_hash,p_agency,p_user,p_ciphertext);return '{}'::jsonb;
 elsif p_action='consume' then
  delete from private.google_workspace_states where hash=p_hash and expires_at>now() returning * into s;
  if s.hash is null then raise exception 'Estado inválido ou expirado.';end if;
  if not exists(select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id join public.agencies a on a.id=m.agency_id where m.agency_id=s.agency_id and m.user_id=s.user_id and m.status='active' and a.status='active' and (r.name='OWNER' or exists(select 1 from public.role_permissions rp join public.permissions p on p.id=rp.permission_id where rp.role_id=r.id and rp.allowed and p.permission_key='settings.edit'))) then raise exception 'Permissão revogada.';end if;
  return jsonb_build_object('agency',s.agency_id,'user',s.user_id,'ciphertext',s.ciphertext);
 elsif p_action='save' then
  insert into private.google_workspace_secrets(agency_id,user_id,ciphertext) values(p_agency,p_user,p_ciphertext)
  on conflict(agency_id,user_id) do update set ciphertext=excluded.ciphertext,updated_at=now();return '{}'::jsonb;
 elsif p_action='read' then
  select ciphertext into c from private.google_workspace_secrets where agency_id=p_agency and user_id=p_user;
  return jsonb_build_object('ciphertext',c);
 elsif p_action='delete' then
  delete from private.google_workspace_secrets where agency_id=p_agency and user_id=p_user;return '{}'::jsonb;
 end if;raise exception 'Operação inválida.';
end $$;
revoke all on function public.google_workspace_secret(text,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.google_workspace_secret(text,uuid,uuid,text,text) to service_role;
