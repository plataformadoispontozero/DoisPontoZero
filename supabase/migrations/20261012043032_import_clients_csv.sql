-- Local preparation only. No production application in this round.
create or replace function public.import_clients_csv(p_agency_id uuid, p_filename text, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public, private, pg_temp as $$
declare r jsonb; results jsonb := '[]'; new_id uuid; outcome text; message text; imported integer := 0; ignored integer := 0; failed integer := 0;
begin
 if auth.uid() is null or not private.can_editorial(p_agency_id, 'clients.create') then raise exception 'Permissão de criação de clientes necessária.' using errcode='42501'; end if;
 if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 or octet_length(p_rows::text) > 2097152 then raise exception 'Lote inválido ou acima do limite.'; end if;
 if exists(select 1 from jsonb_array_elements(p_rows) x group by x->>'row' having count(*) > 1) then raise exception 'Linhas repetidas no lote.'; end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  new_id := null; outcome := 'error'; message := 'Registro inválido.';
  begin
   if jsonb_typeof(r) <> 'object' or exists(select 1 from jsonb_object_keys(r) k where k not in ('row','name','slug','logo_url','status'))
    or coalesce(r->>'row','') !~ '^[0-9]{1,6}$' or (r->>'row')::integer < 2
    or jsonb_typeof(r->'name') is distinct from 'string' or jsonb_typeof(r->'slug') is distinct from 'string'
    or (r ? 'status' and jsonb_typeof(r->'status') is distinct from 'string') or (r ? 'logo_url' and jsonb_typeof(r->'logo_url') is distinct from 'string')
    or length(btrim(coalesce(r->>'name',''))) not between 1 and 200
    or length(coalesce(r->>'slug','')) not between 1 and 100 or (r->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or coalesce(nullif(r->>'status',''),'active') not in ('active','inactive','archived')
    or (coalesce(r->>'logo_url','') <> '' and (length(r->>'logo_url') > 2048 or (r->>'logo_url') !~ '^https?://[^/@[:space:]]+([/:?][^[:space:]]*)?$'))
    then raise exception 'Campos inválidos: confira nome, slug, status e URL.'; end if;
   insert into public.clients(agency_id,name,slug,logo_url,status)
    values(p_agency_id,btrim(r->>'name'),r->>'slug',nullif(r->>'logo_url',''),coalesce(nullif(r->>'status',''),'active'))
    on conflict(agency_id,slug) do nothing returning id into new_id;
   if new_id is null then outcome := 'ignored'; message := 'Slug já cadastrado nesta agência.'; ignored := ignored + 1;
   else outcome := 'imported'; message := 'Cliente cadastrado.'; imported := imported + 1; end if;
  exception when others then failed := failed + 1; message := 'Registro rejeitado. Confira os campos e tente novamente.';
  end;
  results := results || jsonb_build_array(jsonb_build_object('row',r->'row','status',outcome,'id',new_id,'message',message));
 end loop;
 insert into public.audit_logs(agency_id,actor_user_id,action,entity_type,metadata)
 values(p_agency_id,auth.uid(),'clients.csv_import','clients',jsonb_build_object('filename',left(regexp_replace(coalesce(p_filename,''),'^.*[/\\]',''),255),'imported',imported,'ignored',ignored,'errors',failed));
 return jsonb_build_object('results',results,'imported',imported,'ignored',ignored,'errors',failed);
end $$;
revoke all on function public.import_clients_csv(uuid,text,jsonb) from public, anon;
grant execute on function public.import_clients_csv(uuid,text,jsonb) to authenticated;
