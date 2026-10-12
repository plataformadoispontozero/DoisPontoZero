-- One central OAuth connection per agency. Tokens remain encrypted in the existing private store.
create table private.google_agency_connections (
 agency_id uuid primary key references public.agencies(id) on delete cascade,
 connector_user_id uuid not null references auth.users(id) on delete cascade,
 updated_at timestamptz not null default now()
);
alter table private.google_agency_connections enable row level security;
revoke all on private.google_agency_connections from public,anon,authenticated;
create function private.google_connection_admin(p_agency uuid,p_user uuid) returns boolean
language sql stable security invoker set search_path=public,private,pg_temp as $$
 select exists(select 1 from public.agency_members m
 join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id
 join public.agencies a on a.id=m.agency_id
 where m.agency_id=p_agency and m.user_id=p_user and m.status='active' and a.status='active'
 and r.name in ('OWNER','ADMIN') and (r.name='OWNER' or exists(
 select 1 from public.role_permissions rp join public.permissions p on p.id=rp.permission_id
 where rp.role_id=r.id and rp.allowed and p.permission_key='settings.edit')))
$$;
revoke all on function private.google_connection_admin(uuid,uuid) from public,anon,authenticated;
grant execute on function private.google_connection_admin(uuid,uuid) to service_role;
create function public.google_workspace_connection(p_action text,p_agency uuid,p_user uuid default null) returns jsonb
language plpgsql security definer set search_path=public,private,pg_temp as $$
declare connector uuid;
begin
 if p_action='read' then
  select connector_user_id into connector from private.google_agency_connections where agency_id=p_agency;
  if connector is null or not private.google_connection_admin(p_agency,connector) then return jsonb_build_object('user',null);end if;
  return jsonb_build_object('user',connector);
 elsif p_action in ('set','delete') then
  if p_user is null or not private.google_connection_admin(p_agency,p_user) then raise exception 'Administrator required';end if;
  if p_action='set' then
   if not exists(select 1 from private.google_workspace_secrets where agency_id=p_agency and user_id=p_user) then raise exception 'OAuth credential required';end if;
   insert into private.google_agency_connections(agency_id,connector_user_id) values(p_agency,p_user)
   on conflict(agency_id) do update set connector_user_id=excluded.connector_user_id,updated_at=now();
  else delete from private.google_agency_connections where agency_id=p_agency;end if;
  return '{}'::jsonb;
 end if;raise exception 'Invalid connection operation';
end $$;
revoke all on function public.google_workspace_connection(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.google_workspace_connection(text,uuid,uuid) to service_role;
-- OAuth start and callback are now exclusive to administrators. Production actions use separate permissions.
create or replace function public.google_workspace_permission(p_agency uuid) returns boolean
language sql stable security definer set search_path=public,private,pg_temp as $$
 select private.google_connection_admin(p_agency,auth.uid())
$$;

create or replace function public.google_workspace_secret(p_action text,p_agency uuid default null,p_user uuid default null,p_hash text default null,p_ciphertext text default null)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare s private.google_workspace_states; c text;
begin
 if p_action='state' then
  delete from private.google_workspace_states where expires_at < now();
  insert into private.google_workspace_states(hash,agency_id,user_id,ciphertext) values(p_hash,p_agency,p_user,p_ciphertext);return '{}'::jsonb;
 elsif p_action='consume' then
  delete from private.google_workspace_states where hash=p_hash and expires_at>now() returning * into s;
  if s.hash is null then raise exception 'Estado inválido ou expirado.';end if;
  if not private.google_connection_admin(s.agency_id,s.user_id) then raise exception 'Permissão revogada.';end if;
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
-- Atomic OAuth credential + connector publication; no new credential survives a revoked administrator.
create function public.google_workspace_connect(p_agency uuid,p_user uuid,p_ciphertext text) returns jsonb
language plpgsql security definer set search_path=public,private,pg_temp as $$
begin
 if not private.google_connection_admin(p_agency,p_user) or p_ciphertext is null or octet_length(p_ciphertext)>32768 then raise exception 'Administrator required';end if;
 insert into private.google_workspace_secrets(agency_id,user_id,ciphertext) values(p_agency,p_user,p_ciphertext)
 on conflict(agency_id,user_id) do update set ciphertext=excluded.ciphertext,updated_at=now();
 insert into private.google_agency_connections(agency_id,connector_user_id) values(p_agency,p_user)
 on conflict(agency_id) do update set connector_user_id=excluded.connector_user_id,updated_at=now();
 return '{}'::jsonb;
end $$;
revoke all on function public.google_workspace_connect(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.google_workspace_connect(uuid,uuid,text) to service_role;
