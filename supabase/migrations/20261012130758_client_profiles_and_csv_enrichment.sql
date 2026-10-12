-- Detailed client profile, tenant-safe CSV creation and explicit fill-missing action.
-- No real customer records are imported by this migration.
create or replace function private.valid_client_profile(p_profile jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb; t text; limit_chars integer; m text[]; parsed_date date;
begin
 if p_profile is null or jsonb_typeof(p_profile) <> 'object' or octet_length(p_profile::text)>32768 then return false; end if;
 for k,v in select key,value from jsonb_each(p_profile) loop
  if k not in ('niche','city','instagram','plan','average_ticket','monthly_content_count','target_audience','age_range','audience_gender','tone','differential','special_dates','renewal_date','source_id','source_created_at','source_updated_at','positioning','structure','monthly_objective','drive_url','maps_url') then return false; end if;
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
revoke all on function private.valid_client_profile(jsonb) from public,anon;
grant execute on function private.valid_client_profile(jsonb) to authenticated;

alter table public.clients add column if not exists profile jsonb not null default '{}'::jsonb;
alter table public.clients add constraint clients_profile_valid check(private.valid_client_profile(profile));

create or replace function public.import_clients_csv(p_agency_id uuid, p_filename text, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb; results jsonb:='[]'; new_id uuid; outcome text; message text;
 imported integer:=0; updated integer:=0; ignored integer:=0; failed integer:=0;
 incoming jsonb; additions jsonb; existing_profile jsonb; existing_source text; action text;
begin
 if auth.uid() is null or not private.can_editorial(p_agency_id,'clients.create') then raise exception 'Permissão de criação de clientes necessária.' using errcode='42501'; end if;
 if p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>500 or octet_length(p_rows::text)>2097152 then raise exception 'Lote inválido ou acima do limite.'; end if;
 if exists(select 1 from jsonb_array_elements(p_rows) x group by x->>'row' having count(*)>1) then raise exception 'Linhas repetidas no lote.'; end if;
 if exists(select 1 from jsonb_array_elements(p_rows) x where x->>'action'='fill_missing') and not private.can_editorial(p_agency_id,'clients.edit') then raise exception 'Permissão de edição de clientes necessária para completar perfis.' using errcode='42501'; end if;
 -- Stable tenant lock serializes import batches; individual target rows are locked too.
 perform pg_advisory_xact_lock(hashtextextended(p_agency_id::text||':clients.csv',0));
 for r in select value from jsonb_array_elements(p_rows) loop
  new_id:=null; outcome:='error'; message:='Registro inválido.';
  begin
   action:=coalesce(r->>'action','create');
   if jsonb_typeof(r)<>'object' or exists(select 1 from jsonb_object_keys(r) k where k not in ('row','name','slug','logo_url','status','profile','action','existing_id'))
    or coalesce(r->>'row','') !~ '^[0-9]{1,6}$' or (r->>'row')::integer<2
    or jsonb_typeof(r->'name') is distinct from 'string' or jsonb_typeof(r->'slug') is distinct from 'string'
    or (r ? 'status' and jsonb_typeof(r->'status') is distinct from 'string') or (r ? 'logo_url' and jsonb_typeof(r->'logo_url') is distinct from 'string')
    or (r ? 'action' and jsonb_typeof(r->'action') is distinct from 'string') or action not in ('create','fill_missing')
    or length(btrim(coalesce(r->>'name',''))) not between 1 and 200
    or length(coalesce(r->>'slug','')) not between 1 and 100 or (r->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or coalesce(nullif(r->>'status',''),'active') not in ('active','inactive','archived')
    or (coalesce(r->>'logo_url','')<>'' and (length(r->>'logo_url')>2048 or (r->>'logo_url') !~ '^https?://[^/@[:space:]]+([/:?][^[:space:]]*)?$'))
    or (action='create' and r ? 'existing_id')
    or (action='fill_missing' and (jsonb_typeof(r->'existing_id') is distinct from 'string' or (r->>'existing_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'))
    then raise exception 'Campos inválidos: confira nome, slug, status, ação e URL.'; end if;
   incoming:=coalesce(r->'profile','{}'::jsonb);
   if not private.valid_client_profile(incoming) then raise exception 'Perfil inválido.'; end if;
   select coalesce(jsonb_object_agg(key,case when jsonb_typeof(value)='string' then to_jsonb(btrim(value#>>'{}')) else value end),'{}'::jsonb)
    into incoming from jsonb_each(incoming) where value<>'null'::jsonb and (jsonb_typeof(value)<>'string' or btrim(value#>>'{}')<>'');
   if action='create' then
    insert into public.clients(agency_id,name,slug,logo_url,status,profile)
     values(p_agency_id,btrim(r->>'name'),r->>'slug',nullif(r->>'logo_url',''),coalesce(nullif(r->>'status',''),'active'),incoming)
     on conflict(agency_id,slug) do nothing returning id into new_id;
    if new_id is null then outcome:='ignored'; message:='Slug já cadastrado nesta agência.'; ignored:=ignored+1;
    else outcome:='imported'; message:='Cliente cadastrado com perfil.'; imported:=imported+1; end if;
   else
    select id,profile,profile->>'source_id' into new_id,existing_profile,existing_source from public.clients
     where id=(r->>'existing_id')::uuid and agency_id=p_agency_id and slug=r->>'slug' for update;
    if new_id is null then raise exception 'Cliente de destino não corresponde à agência e ao slug.'; end if;
    if coalesce(existing_source,'')<>'' and coalesce(incoming->>'source_id','')<>'' and existing_source<>incoming->>'source_id' then raise exception 'Identificador de origem não corresponde ao cliente.'; end if;
    select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into additions from jsonb_each(incoming)
     where not (existing_profile ? key) or existing_profile->key='null'::jsonb or (jsonb_typeof(existing_profile->key)='string' and btrim(existing_profile->>key)='');
    if additions='{}'::jsonb then outcome:='ignored'; message:='Perfil já preenchido; nenhum campo substituído.'; ignored:=ignored+1;
    else
     update public.clients set profile=existing_profile||additions where id=new_id and agency_id=p_agency_id;
     outcome:='updated'; message:='Somente campos ausentes do perfil foram completados.'; updated:=updated+1;
    end if;
   end if;
  exception when others then failed:=failed+1; outcome:='error'; new_id:=null; message:='Registro rejeitado. Confira os campos e o destino selecionado.';
  end;
  results:=results||jsonb_build_array(jsonb_build_object('row',r->'row','status',outcome,'id',new_id,'message',message));
 end loop;
 insert into public.audit_logs(agency_id,actor_user_id,action,entity_type,metadata)
 values(p_agency_id,auth.uid(),'clients.csv_import','clients',jsonb_build_object('filename',left(regexp_replace(coalesce(p_filename,''),'^.*[/\\]',''),255),'imported',imported,'updated',updated,'ignored',ignored,'errors',failed));
 return jsonb_build_object('results',results,'imported',imported,'updated',updated,'ignored',ignored,'errors',failed);
end $$;
revoke all on function public.import_clients_csv(uuid,text,jsonb) from public,anon;
grant execute on function public.import_clients_csv(uuid,text,jsonb) to authenticated;
