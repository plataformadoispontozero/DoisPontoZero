create function private.write_proposal_content(a uuid,p uuid,changes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare x jsonb; xid uuid; quantity numeric; price bigint; discount bigint; total bigint; subtotal bigint; once_total bigint; recurring bigint;
begin
 if jsonb_typeof(changes)<>'object' or octet_length(changes::text)>1000000 then raise exception 'Conteúdo inválido';end if;
 if changes ? 'status' and changes->>'status' not in ('draft','internal_review','archived') then raise exception 'Status exige fluxo de publicação ou aprovação';end if;
 if changes ? 'title' and (length(btrim(changes->>'title')) not between 1 and 300) then raise exception 'Título inválido';end if;
 update public.proposals set title=case when changes?'title' then btrim(changes->>'title') else title end,description=case when changes?'description' then changes->>'description' else description end,status=coalesce(changes->>'status',status),updated_at=now() where id=p and agency_id=a;
 if changes?'sections' then
  if jsonb_typeof(changes->'sections')<>'array' or jsonb_array_length(changes->'sections')>100 then raise exception 'Seções inválidas';end if;
  for x in select value from jsonb_array_elements(changes->'sections') loop
   if nullif(x->>'id','') is null then raise exception 'ID do conteúdo obrigatório';end if;xid:=(x->>'id')::uuid;
   if exists(select 1 from public.proposal_sections where id=xid and (proposal_id<>p or agency_id<>a)) then raise exception 'Seção fora da proposta';end if;
   if x->>'title' is null or length(btrim(x->>'title')) not between 1 and 300 or jsonb_typeof(coalesce(x->'content','{}'))<>'object' then raise exception 'Seção inválida';end if;
   insert into public.proposal_sections(id,agency_id,proposal_id,section_type,title,content,position,is_visible) values(xid,a,p,coalesce(x->>'section_type','custom'),x->>'title',coalesce(x->'content','{}'),coalesce((x->>'position')::int,0),coalesce((x->>'is_visible')::bool,true)) on conflict(id) do update set section_type=excluded.section_type,title=excluded.title,content=excluded.content,position=excluded.position,is_visible=excluded.is_visible,updated_at=now();
  end loop;
  delete from public.proposal_sections where proposal_id=p and agency_id=a and id not in(select (value->>'id')::uuid from jsonb_array_elements(changes->'sections') where value->>'id' is not null);
 end if;
 if changes?'items' then
  if jsonb_typeof(changes->'items')<>'array' or jsonb_array_length(changes->'items')>200 then raise exception 'Itens inválidos';end if;
  for x in select value from jsonb_array_elements(changes->'items') loop
   if nullif(x->>'id','') is null then raise exception 'ID do conteúdo obrigatório';end if;xid:=(x->>'id')::uuid;
   if exists(select 1 from public.proposal_items where id=xid and (proposal_id<>p or agency_id<>a)) then raise exception 'Item fora da proposta';end if;
   if nullif(x->>'service_id','') is not null and not exists(select 1 from public.agency_services where id=(x->>'service_id')::uuid and agency_id=a and is_active) then raise exception 'Serviço fora da agência';end if;
   quantity:=coalesce((x->>'quantity')::numeric,1);price:=coalesce((x->>'unit_price_cents')::bigint,0);discount:=coalesce((x->>'discount_cents')::bigint,0);
   if quantity<=0 or quantity>100000 or price<0 or price>100000000000 or discount<0 or discount>round(quantity*price) or x->>'name' is null or length(btrim(x->>'name')) not between 1 and 300 then raise exception 'Precificação inválida';end if;
   total:=round(quantity*price)-discount;
   insert into public.proposal_items(id,agency_id,proposal_id,service_id,name,description,quantity,unit,unit_price_cents,discount_cents,total_cents,billing_type,position) values(xid,a,p,nullif(x->>'service_id','')::uuid,x->>'name',x->>'description',quantity,coalesce(x->>'unit','unidade'),price,discount,total,coalesce(x->>'billing_type','one_time'),coalesce((x->>'position')::int,0)) on conflict(id) do update set service_id=excluded.service_id,name=excluded.name,description=excluded.description,quantity=excluded.quantity,unit=excluded.unit,unit_price_cents=excluded.unit_price_cents,discount_cents=excluded.discount_cents,total_cents=excluded.total_cents,billing_type=excluded.billing_type,position=excluded.position,updated_at=now();
  end loop;
  delete from public.proposal_items where proposal_id=p and agency_id=a and id not in(select (value->>'id')::uuid from jsonb_array_elements(changes->'items') where value->>'id' is not null);
 end if;
 select coalesce(sum(total_cents) filter(where billing_type<>'optional'),0),coalesce(sum(total_cents) filter(where billing_type='one_time'),0),coalesce(sum(total_cents) filter(where billing_type='recurring'),0) into subtotal,once_total,recurring from public.proposal_items where proposal_id=p and agency_id=a;
 insert into public.proposal_pricing(agency_id,proposal_id,subtotal_cents,total_cents,one_time_total_cents,recurring_monthly_total_cents) values(a,p,subtotal,subtotal,once_total,recurring) on conflict(proposal_id) do update set subtotal_cents=excluded.subtotal_cents,discount_cents=0,fees_cents=0,total_cents=excluded.total_cents,one_time_total_cents=excluded.one_time_total_cents,recurring_monthly_total_cents=excluded.recurring_monthly_total_cents,updated_at=now();
 return (select to_jsonb(q)||jsonb_build_object('sections',coalesce((select jsonb_agg(to_jsonb(s) order by position) from public.proposal_sections s where s.proposal_id=p),'[]'),'items',coalesce((select jsonb_agg(to_jsonb(i) order by position) from public.proposal_items i where i.proposal_id=p),'[]'),'pricing',(select to_jsonb(t) from public.proposal_pricing t where t.proposal_id=p)) from public.proposals q where q.id=p);
end;$$;
revoke all on function private.write_proposal_content(uuid,uuid,jsonb) from public,anon,authenticated;
create function public.save_agency_proposal(p_agency_id uuid,p_proposal_id uuid,p_changes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.can_editorial(p_agency_id,'proposals.edit') then raise exception 'Sem permissão' using errcode='42501';end if;
 perform 1 from public.proposals where id=p_proposal_id and agency_id=p_agency_id and status in ('draft','internal_review','archived') for update;
 if not found then raise exception 'Proposta inexistente ou protegida';end if;
 return private.write_proposal_content(p_agency_id,p_proposal_id,p_changes);
end;$$;
create function public.create_agency_proposal(p_agency_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare pid uuid; template public.proposal_templates%rowtype; changes jsonb:='{}';
begin
 if auth.uid() is null or not private.can_editorial(p_agency_id,'proposals.create') then raise exception 'Sem permissão' using errcode='42501';end if;
 if not exists(select 1 from public.clients where id=(p_payload->>'client_id')::uuid and agency_id=p_agency_id) then raise exception 'Cliente fora da agência';end if;
 if nullif(p_payload->>'briefing_id','') is not null and not exists(select 1 from public.briefings where id=(p_payload->>'briefing_id')::uuid and client_id=(p_payload->>'client_id')::uuid and agency_id=p_agency_id) then raise exception 'Briefing fora do cliente';end if;
 if nullif(p_payload->>'strategy_id','') is not null and not exists(select 1 from public.content_strategies where id=(p_payload->>'strategy_id')::uuid and client_id=(p_payload->>'client_id')::uuid and agency_id=p_agency_id) then raise exception 'Estratégia fora do cliente';end if;
 if p_payload->>'title' is null or length(btrim(p_payload->>'title')) not between 1 and 300 then raise exception 'Título inválido';end if;
 insert into public.proposals(agency_id,client_id,briefing_id,strategy_id,title,description,proposal_number,created_by,owner_id) values(p_agency_id,(p_payload->>'client_id')::uuid,nullif(p_payload->>'briefing_id','')::uuid,nullif(p_payload->>'strategy_id','')::uuid,btrim(p_payload->>'title'),p_payload->>'description','PROP-'||to_char(now(),'YYYY')||'-'||substr(gen_random_uuid()::text,1,8),auth.uid(),auth.uid()) returning id into pid;
 if nullif(p_payload->>'template_id','') is not null then
  select * into template from public.proposal_templates where id=(p_payload->>'template_id')::uuid and agency_id=p_agency_id and status='published';if not found then raise exception 'Modelo fora da agência';end if;
  changes:=jsonb_build_object('sections',(select coalesce(jsonb_agg((x-'id')||jsonb_build_object('id',gen_random_uuid())),'[]') from jsonb_array_elements(template.sections_snapshot)x),'items',(select coalesce(jsonb_agg((x-'id')||jsonb_build_object('id',gen_random_uuid())),'[]') from jsonb_array_elements(template.items_snapshot)x));
 end if;
 return private.write_proposal_content(p_agency_id,pid,changes);
end;$$;
revoke all on function public.create_agency_proposal(uuid,jsonb),public.save_agency_proposal(uuid,uuid,jsonb) from public,anon;
grant execute on function public.create_agency_proposal(uuid,jsonb),public.save_agency_proposal(uuid,uuid,jsonb) to authenticated;
