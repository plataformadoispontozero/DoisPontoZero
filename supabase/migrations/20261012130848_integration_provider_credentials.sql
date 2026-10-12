create table private.integration_credentials (
 agency_id uuid not null references public.agencies(id) on delete cascade,
 provider text not null check(provider in ('google','meta')),
 user_id uuid not null default '00000000-0000-0000-0000-000000000000',
 ciphertext text not null, updated_at timestamptz not null default now(),
 primary key(agency_id,provider,user_id)
);
create table private.integration_oauth_states (
 hash text primary key, agency_id uuid not null references public.agencies(id) on delete cascade,
 provider text not null check(provider in ('google','meta')), user_id uuid not null references auth.users(id) on delete cascade,
 ciphertext text not null, expires_at timestamptz not null default now()+interval '10 minutes'
);
alter table private.integration_credentials enable row level security;
alter table private.integration_oauth_states enable row level security;
revoke all on private.integration_credentials, private.integration_oauth_states from public,anon,authenticated;
create function public.integration_provider_secret(p_action text,p_provider text,p_agency uuid default null,p_user uuid default null,p_hash text default null,p_ciphertext text default null)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare s private.integration_oauth_states; value text;
begin
 if p_provider not in ('google','meta') then raise exception 'Provider invalid';end if;
 if p_action='state' then
  delete from private.integration_oauth_states where expires_at < now();
  insert into private.integration_oauth_states(hash,agency_id,provider,user_id,ciphertext) values(p_hash,p_agency,p_provider,p_user,p_ciphertext);return '{}'::jsonb;
 elsif p_action='consume' then
  delete from private.integration_oauth_states where hash=p_hash and provider=p_provider and expires_at>now() returning * into s;
  if s.hash is null then raise exception 'State expired';end if;
  if not exists(select 1 from public.agency_members m join public.agencies a on a.id=m.agency_id join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id where m.agency_id=s.agency_id and m.user_id=s.user_id and m.status='active' and a.status='active' and (r.name='OWNER' or exists(select 1 from public.role_permissions rp join public.permissions p on p.id=rp.permission_id where rp.role_id=r.id and rp.allowed and p.permission_key='settings.edit'))) then raise exception 'Membership revoked';end if;
  return jsonb_build_object('agency',s.agency_id,'user',s.user_id,'ciphertext',s.ciphertext);
 elsif p_action='save' then
  insert into private.integration_credentials(agency_id,provider,user_id,ciphertext) values(p_agency,p_provider,coalesce(p_user,'00000000-0000-0000-0000-000000000000'::uuid),p_ciphertext)
  on conflict(agency_id,provider,user_id) do update set ciphertext=excluded.ciphertext,updated_at=now();return '{}'::jsonb;
 elsif p_action='read' then
  select ciphertext into value from private.integration_credentials where agency_id=p_agency and provider=p_provider and user_id=coalesce(p_user,'00000000-0000-0000-0000-000000000000'::uuid);return jsonb_build_object('ciphertext',value);
 elsif p_action='delete' then
  delete from private.integration_credentials where agency_id=p_agency and provider=p_provider and user_id=coalesce(p_user,'00000000-0000-0000-0000-000000000000'::uuid);return '{}'::jsonb;
 end if;raise exception 'Operation invalid';
end $$;
revoke all on function public.integration_provider_secret(text,text,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.integration_provider_secret(text,text,uuid,uuid,text,text) to service_role;

-- Extend client profile through its existing immutable CHECK validator.
create or replace function private.valid_client_profile(p_profile jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb; t text; limit_chars integer; m text[]; parsed_date date;
begin
 if p_profile is null or jsonb_typeof(p_profile) <> 'object' or octet_length(p_profile::text)>32768 then return false; end if;
 for k,v in select key,value from jsonb_each(p_profile) loop
  if k not in ('niche','city','instagram','plan','average_ticket','monthly_content_count','target_audience','age_range','audience_gender','tone','differential','special_dates','renewal_date','source_id','source_created_at','source_updated_at','positioning','structure','monthly_objective','drive_url','maps_url','meta_ad_account_id') then return false; end if;
  if v='null'::jsonb or v='""'::jsonb then continue; end if;
  t:=v#>>'{}';
  if k in ('average_ticket','monthly_content_count') then
   if jsonb_typeof(v)<>'number' or t::numeric<0 then return false; end if;
   if k='monthly_content_count' and (t::numeric>1000 or trunc(t::numeric)<>t::numeric) then return false; end if;
   if k='average_ticket' and (t::numeric>1000000000 or round(t::numeric,2)<>t::numeric) then return false; end if;
   continue;
  end if;
  if jsonb_typeof(v)<>'string' then return false; end if;
  limit_chars:=case when k in ('drive_url','maps_url') then 2048 when k='instagram' then 500 when k='tone' then 1000 when k in ('source_created_at','source_updated_at','audience_gender') then 100 when k in ('niche','city','plan','age_range','source_id') then 200 when k='renewal_date' then 10 else 4000 end;
  if length(t)>limit_chars then return false; end if;
  if k in ('drive_url','maps_url') then
   m:=regexp_match(t,'^https?://(\[[0-9a-fA-F:]+\]|[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?)(:([0-9]{1,5}))?([/?#][^[:space:]]*)?$');
   if m is null or coalesce(m[4],'0')::integer>65535 then return false; end if;
  end if;
  if k='meta_ad_account_id' and t !~ '^act_[0-9]{5,40}$' then return false;end if;
  if k='renewal_date' then
   if t !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return false; end if;
   parsed_date:=make_date(split_part(t,'-',1)::integer,split_part(t,'-',2)::integer,split_part(t,'-',3)::integer);
   if extract(year from parsed_date)<1900 then return false; end if;
  end if;
  if k in ('source_created_at','source_updated_at') then
   m:=regexp_match(t,'^([0-9]{2})/([0-9]{2})/([0-9]{4})(?:[ ,T]+([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?)?$');
   if m is not null then
    parsed_date:=make_date(m[3]::integer,m[2]::integer,m[1]::integer);
    if extract(year from parsed_date)<1900 or coalesce(m[4],'0')::integer>23 or coalesce(m[5],'0')::integer>59 or coalesce(m[6],'0')::integer>59 then return false; end if;
   elsif t ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    parsed_date:=make_date(split_part(t,'-',1)::integer,split_part(t,'-',2)::integer,split_part(t,'-',3)::integer);
    if extract(year from parsed_date)<1900 then return false; end if;
   elsif t ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]{1,9})?)?(Z|[+-][0-9]{2}:[0-9]{2})$' then
    parsed_date:=make_date(split_part(t,'-',1)::integer,split_part(t,'-',2)::integer,substring(t,9,2)::integer);
    if extract(year from parsed_date)<1900 then return false; end if;
    perform t::timestamptz;
   else return false;
   end if;
  end if;
 end loop;
 return true;
exception when others then return false;
end $$;

-- Production members may authorize their own account; app credential setup remains owner/admin only.
create or replace function public.google_workspace_permission(p_agency uuid) returns boolean language sql stable security definer set search_path=public,private,pg_temp as $$ select private.can_editorial(p_agency,'settings.edit') or (private.can_editorial(p_agency,'clients.view') and private.can_editorial(p_agency,'tasks.edit')) $$;
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
  if not exists(select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id join public.agencies a on a.id=m.agency_id where m.agency_id=s.agency_id and m.user_id=s.user_id and m.status='active' and a.status='active' and (r.name='OWNER' or exists(select 1 from public.role_permissions rp join public.permissions p on p.id=rp.permission_id where rp.role_id=r.id and rp.allowed and p.permission_key='settings.edit') or (exists(select 1 from public.role_permissions rp join public.permissions p on p.id=rp.permission_id where rp.role_id=r.id and rp.allowed and p.permission_key='tasks.edit') and exists(select 1 from public.role_permissions rp join public.permissions p on p.id=rp.permission_id where rp.role_id=r.id and rp.allowed and p.permission_key='clients.view')))) then raise exception 'Permissão revogada.';end if;
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
