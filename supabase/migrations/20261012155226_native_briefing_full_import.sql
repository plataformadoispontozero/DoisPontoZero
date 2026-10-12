create or replace function private.validate_imported_briefing() returns trigger language plpgsql security definer set search_path='' as $$
declare source public.client_legacy_records%rowtype;
begin
 if tg_op='UPDATE' and old.source_system is not null and auth.uid() is not null and (new.source_system,new.source_project,new.source_id,new.source_snapshot,new.source_status,new.source_created_at,new.source_updated_at,new.migrated_at,new.agency_id,new.client_id) is distinct from (old.source_system,old.source_project,old.source_id,old.source_snapshot,old.source_status,old.source_created_at,old.source_updated_at,old.migrated_at,old.agency_id,old.client_id) then raise exception 'Proveniência histórica é somente leitura' using errcode='42501';end if;
 if new.source_system is null then return new;end if;
 if auth.uid() is not null and (tg_op='INSERT' or (new.source_system,new.source_project,new.source_id,new.source_snapshot,new.source_status,new.source_created_at,new.source_updated_at,new.migrated_at) is distinct from (old.source_system,old.source_project,old.source_id,old.source_snapshot,old.source_status,old.source_created_at,old.source_updated_at,old.migrated_at)) then raise exception 'Proveniência histórica é somente leitura' using errcode='42501';end if;
 select * into source from public.client_legacy_records where agency_id=new.agency_id and client_id=new.client_id and source_project=new.source_project and source_kind='briefings' and source_id=new.source_id;
 if not found or not exists(select 1 from public.clients c where c.id=new.client_id and c.agency_id=new.agency_id and c.profile->>'source_id'=source.source_client_id::text) then raise exception 'Origem do briefing não corresponde ao cliente da agência' using errcode='23514';end if;
 if (new.source_status,new.source_created_at,new.source_updated_at) is distinct from (source.source_status,source.source_created_at,source.source_updated_at) then raise exception 'Datas e status históricos diferem da origem importada' using errcode='23514';end if;
 if new.source_snapshot is distinct from source.payload then raise exception 'Snapshot do briefing difere da origem importada' using errcode='23514';end if;
 if tg_op='INSERT' and (new.status<>'submitted' or new.approved_at is not null or new.created_by is not null or new.assigned_to is not null or new.migration_review_pending) then raise exception 'Briefing migrado não concede aprovação atual' using errcode='23514';end if;
 return new;
end;$$;
revoke all on function private.validate_imported_briefing() from public,anon,authenticated;

create or replace function private.import_legacy_briefing(p_agency uuid,p_client uuid,p_source_id uuid,p_history jsonb default '[]') returns jsonb language plpgsql security definer set search_path='' as $$
declare source public.client_legacy_records%rowtype; b public.briefings%rowtype; t uuid; section_id uuid; question_id uuid; field text; field_position int:=0; version_count int:=0; sections jsonb:='{}'; section_name text; section_position int; label text; h jsonb;
 ordered_fields text[]:=array['nome_fantasia','razao_social','segmento','descricao_negocio','produtos_servicos','tempo_mercado','unidades','numero_funcionarios','ticket_medio','faturamento_mensal','persona_descricao','classe_social','faixa_etaria','genero_predominante','localizacao_publico','dores_principais','desejos_principais','objecoes_comuns','missao','visao','valores','personalidade_marca','tom_de_voz','palavras_proibidas','diferenciais','diferenciais_vs_concorrentes','concorrentes','objetivo_principal','objetivos_secundarios','meta_faturamento','meta_leads_mes','prazo_resultados','conteudo_que_funciona','conteudo_que_nao_funciona','bio_atual','seguidores_instagram','instagram','facebook','tiktok','youtube','linkedin','site','outros_canais','ja_fez_trafego_pago','plataformas_trafego','orcamento_trafego','resultados_anteriores','agencias_anteriores','o_que_nao_gostou','responsavel_cliente','contato_whatsapp','melhor_horario_contato','dia_reuniao_mensal','observacoes_gerais'];
begin
 -- Service-only import of audited source UUIDs mapped to existing agency clients.
 if p_agency<>'a0f00e64-e8ba-44e5-b0cf-2ad7adb44211'::uuid then raise exception 'Importação limitada à agência autorizada' using errcode='42501';end if;
 if p_history is null or jsonb_typeof(p_history)<>'array' or jsonb_array_length(p_history)>1000 or octet_length(p_history::text)>2000000 then raise exception 'Histórico inválido';end if;
 select * into source from public.client_legacy_records where agency_id=p_agency and client_id=p_client and source_kind='briefings' and source_id=p_source_id and source_project='88ee1363-3966-494f-a78d-ad375651555f';
 if not found or not exists(select 1 from public.clients where id=p_client and agency_id=p_agency and profile->>'source_id'=source.source_client_id::text) then raise exception 'Mapeamento de origem inválido' using errcode='23514';end if;
 if source.payload->>'id' is distinct from p_source_id::text or source.payload->>'cliente_id' is distinct from source.source_client_id::text then raise exception 'Snapshot não corresponde à origem' using errcode='23514';end if;
 if exists(select 1 from jsonb_object_keys(source.payload) k where k<>all(ordered_fields||array['id','cliente_id','criado_por','atualizado_por','criado_em','atualizado_em','status','percentual_preenchimento'])) then raise exception 'Snapshot contém campos não mapeados';end if;
 if exists(select 1 from jsonb_array_elements(p_history) x where jsonb_typeof(x)<>'object' or x->>'briefing_id' is distinct from p_source_id::text or x->>'source_client_id' is distinct from source.source_client_id::text or x->>'id' is null or x->>'alterado_em' is null or x->>'campo_alterado' is null or x->>'campo_alterado' ~* '(token|secret|password|senha|api_key|credential|acesso_)' or x->>'campo_alterado' in ('acesso_canva','acesso_drive')) then raise exception 'Histórico fora do briefing ou contém campo restrito';end if;
 if exists(select 1 from jsonb_array_elements(p_history) x cross join lateral jsonb_object_keys(x) k where k not in ('id','briefing_id','source_client_id','alterado_por','campo_alterado','valor_anterior','valor_novo','alterado_em')) then raise exception 'Histórico contém metadados não autorizados';end if;
 if (select count(*) from jsonb_array_elements(p_history))<>(select count(distinct x->>'id') from jsonb_array_elements(p_history) x) then raise exception 'Histórico contém IDs duplicados';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_agency::text||p_source_id::text,0));
 select * into b from public.briefings where agency_id=p_agency and source_project=source.source_project and source_id=p_source_id;
 if found then
  if b.client_id is distinct from p_client or b.source_snapshot is distinct from source.payload then raise exception 'Conflito com briefing já migrado';end if;
  if exists(select 1 from jsonb_array_elements(p_history) x where not exists(select 1 from public.briefing_versions v where v.briefing_id=b.id and v.source_id=(x->>'id')::uuid and v.snapshot->'legacy_history'=x)) or (select count(*) from public.briefing_versions where briefing_id=b.id and source_system='lovable')<>jsonb_array_length(p_history)+1 then raise exception 'Conflito com histórico já migrado';end if;
  update public.briefings set migration_review_pending=false,status=case when migration_review_pending and status='draft' then 'submitted' else status end where id=b.id;
  return jsonb_build_object('briefing_id',b.id,'already_imported',true,'answers',(select count(*) from public.briefing_answers where briefing_id=b.id),'versions',jsonb_array_length(p_history)+1);
 end if;
 insert into public.briefing_templates(agency_id,name,description,category,status,created_by) values(p_agency,'Briefing histórico migrado','Modelo histórico interno; publicação depende de ação explícita da equipe.','custom','draft',null) returning id into t;
 for section_position in 1..6 loop
  section_name:=case section_position when 1 then 'Negócio e oferta' when 2 then 'Público e persona' when 3 then 'Marca e posicionamento' when 4 then 'Objetivos e conteúdo' when 5 then 'Canais e tráfego' else 'Relacionamento e operação' end;
  insert into public.briefing_sections(agency_id,template_id,title,position) values(p_agency,t,section_name,section_position) returning id into section_id;
  sections:=sections||jsonb_build_object(section_position::text,section_id);
 end loop;
 insert into public.briefings(agency_id,client_id,template_id,title,description,status,created_by,assigned_to,created_at,updated_at,source_system,source_project,source_id,source_status,source_created_at,source_updated_at,migrated_at,source_snapshot,migration_review_pending) values(p_agency,p_client,t,'Briefing histórico importado','Dados históricos disponíveis para planejamento. Responsável ainda não atribuído.','submitted',null,null,coalesce(source.source_created_at,now()),coalesce(source.source_updated_at,source.source_created_at,now()),'lovable',source.source_project,source.source_id,source.source_status,source.source_created_at,source.source_updated_at,now(),source.payload,false) returning * into b;
 foreach field in array ordered_fields loop
  if not source.payload ? field then continue;end if;
  field_position:=field_position+1;
  section_position:=case when array_position(ordered_fields,field)<=10 then 1 when array_position(ordered_fields,field)<=18 then 2 when array_position(ordered_fields,field)<=27 then 3 when array_position(ordered_fields,field)<=36 then 4 when array_position(ordered_fields,field)<=49 then 5 else 6 end;
  label:=case field when 'persona_descricao' then 'Público-alvo/persona' when 'objetivo_principal' then 'Objetivo principal' when 'tom_de_voz' then 'Tom de comunicação' when 'diferenciais' then 'Diferenciais/posicionamento' else initcap(replace(field,'_',' ')) end;
  insert into public.briefing_questions(agency_id,template_id,section_id,question_key,label,question_type,is_required,position,options) values(p_agency,t,(sections->>section_position::text)::uuid,field,label,case when field='ja_fez_trafego_pago' then 'single_choice' else 'long_text' end,false,field_position,case when field='ja_fez_trafego_pago' then '[{"label":"Sim","value":true},{"label":"Não","value":false}]'::jsonb else '[]'::jsonb end) returning id into question_id;
  insert into public.briefing_answers(agency_id,briefing_id,question_id,answer_value,created_at,updated_at) values(p_agency,b.id,question_id,source.payload->field,coalesce(source.source_created_at,now()),coalesce(source.source_updated_at,source.source_created_at,now()));
 end loop;
 for h in select value from jsonb_array_elements(p_history) order by (value->>'alterado_em')::timestamptz,value->>'id' loop
  version_count:=version_count+1;
  insert into public.briefing_versions(agency_id,briefing_id,version_number,snapshot,created_by,created_at,source_system,source_project,source_id,source_created_at,migrated_at) values(p_agency,b.id,version_count,jsonb_build_object('source_kind','briefing_historico','legacy_history',h),null,(h->>'alterado_em')::timestamptz,'lovable',source.source_project,(h->>'id')::uuid,(h->>'alterado_em')::timestamptz,now());
 end loop;
 version_count:=version_count+1;
 insert into public.briefing_versions(agency_id,briefing_id,version_number,snapshot,created_by,created_at,source_system,source_project,source_id,source_created_at,migrated_at) values(p_agency,b.id,version_count,jsonb_build_object('source_kind','briefing_snapshot','legacy_snapshot',source.payload),null,coalesce(source.source_updated_at,source.source_created_at,now()),'lovable',source.source_project,p_source_id,source.source_updated_at,now());
 return jsonb_build_object('briefing_id',b.id,'already_imported',false,'answers',field_position,'versions',version_count);
end;$$;
revoke all on function private.import_legacy_briefing(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.import_legacy_briefing(uuid,uuid,uuid,jsonb) to service_role;


update public.briefings set status=case when migration_review_pending and status='draft' then 'submitted' else status end,migration_review_pending=false where agency_id='a0f00e64-e8ba-44e5-b0cf-2ad7adb44211' and source_system='lovable';
comment on column public.briefings.migration_review_pending is 'Historical import review gate; explicitly cleared for authorized complete migration. No client approval is implied.';

create table private.client_import_enrichment_audit(id uuid primary key default gen_random_uuid(),agency_id uuid not null,client_id uuid not null,source_id uuid not null,applied_fields jsonb not null,conflict_fields jsonb not null,created_at timestamptz not null default now());
alter table private.client_import_enrichment_audit enable row level security;
revoke all on private.client_import_enrichment_audit from public,anon,authenticated;
create function private.enrich_legacy_client(p_agency uuid,p_client uuid,p_source uuid,p_profile jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.clients%rowtype; k text; v jsonb; merged jsonb; applied jsonb:='[]'; conflicts jsonb:='[]';
begin
 if p_agency is distinct from 'a0f00e64-e8ba-44e5-b0cf-2ad7adb44211'::uuid or not private.valid_client_profile(p_profile) then raise exception 'Perfil de origem inválido';end if;
 select * into c from public.clients where id=p_client and agency_id=p_agency for update;
 if not found or c.profile->>'source_id' is distinct from p_source::text then raise exception 'Mapeamento do cliente divergente';end if;
 merged:=coalesce(c.profile,'{}');
 for k,v in select key,value from jsonb_each(p_profile) loop
  if v='null'::jsonb or (jsonb_typeof(v)='string' and btrim(v#>>'{}')='') then continue;end if;
  if not merged?k or merged->k='null'::jsonb or (jsonb_typeof(merged->k)='string' and btrim(merged->>k)='') then merged:=merged||jsonb_build_object(k,v);applied:=applied||jsonb_build_array(k);
  elsif merged->k is distinct from v then conflicts:=conflicts||jsonb_build_array(k);end if;
 end loop;
 update public.clients set profile=merged where id=p_client;
 insert into private.client_import_enrichment_audit(agency_id,client_id,source_id,applied_fields,conflict_fields) values(p_agency,p_client,p_source,applied,conflicts);
 return jsonb_build_object('client_id',p_client,'applied_fields',applied,'preserved_local_fields',conflicts);
end;$$;
revoke all on function private.enrich_legacy_client(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function private.enrich_legacy_client(uuid,uuid,uuid,jsonb) to service_role;
