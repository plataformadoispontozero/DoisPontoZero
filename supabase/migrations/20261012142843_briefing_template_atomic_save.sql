-- Atomic saves create a new immutable copy; existing questions/answers remain linked to the old template.
alter table public.briefing_templates add column if not exists origin_template_id uuid references public.briefing_templates(id);
alter table public.briefing_templates add column if not exists save_request_id uuid;
create unique index if not exists briefing_template_request_key on public.briefing_templates(agency_id,save_request_id) where save_request_id is not null;
create unique index if not exists briefing_template_lineage_version on public.briefing_templates(agency_id,origin_template_id,version) where origin_template_id is not null;
create or replace function public.save_briefing_template(p_agency uuid,p_payload jsonb,p_source_template uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result public.briefing_templates; source public.briefing_templates; section jsonb; question jsonb; section_id uuid; template_id uuid:=gen_random_uuid(); origin uuid; next_version integer:=1; section_position integer:=0; question_position integer; question_count integer:=0; request_id uuid; desired_status text:=coalesce(p_payload->>'status','draft');
begin
 if auth.uid() is null or not public.has_agency_permission(p_agency,'briefings.manage_templates') then raise exception 'Sem permissão para gerenciar modelos.' using errcode='42501';end if;
 if desired_status='published' and not public.has_agency_permission(p_agency,'briefings.publish_templates') then raise exception 'Sem permissão para publicar modelos.' using errcode='42501';end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>600000 or length(trim(coalesce(p_payload->>'name',''))) not between 1 and 200 or desired_status not in ('draft','published') or coalesce(p_payload->>'category','general') not in ('branding','social_media','motion','audiovisual','paid_media','campaign','general','custom') or length(coalesce(p_payload->>'description',''))>5000 then raise exception 'Dados do modelo inválidos.';end if;
 if jsonb_typeof(p_payload->'sections') is distinct from 'array' or jsonb_array_length(p_payload->'sections') not between 1 and 30 then raise exception 'Informe de 1 a 30 seções.';end if;
 request_id:=nullif(p_payload->>'save_request_id','')::uuid;
 if request_id is not null then
  perform pg_advisory_xact_lock(hashtextextended(p_agency::text||request_id::text,0));
  select * into result from public.briefing_templates where agency_id=p_agency and save_request_id=request_id;
  if result.id is not null then return to_jsonb(result);end if;
 end if;
 if p_source_template is not null then
  select * into source from public.briefing_templates where id=p_source_template and agency_id=p_agency;
  if source.id is null then raise exception 'Modelo de origem indisponível nesta agência.' using errcode='42501';end if;
  origin:=coalesce(source.origin_template_id,source.id);
  perform pg_advisory_xact_lock(hashtextextended(origin::text,0));
  select coalesce(max(version),source.version)+1 into next_version from public.briefing_templates where agency_id=p_agency and (id=origin or origin_template_id=origin);
 end if;
 insert into public.briefing_templates(id,agency_id,name,description,category,status,version,created_by,origin_template_id,save_request_id) values(template_id,p_agency,trim(p_payload->>'name'),nullif(trim(p_payload->>'description'),''),coalesce(p_payload->>'category','general'),desired_status,next_version,auth.uid(),origin,request_id) returning * into result;
 for section in select value from jsonb_array_elements(p_payload->'sections') loop
  if jsonb_typeof(section) is distinct from 'object' or length(trim(coalesce(section->>'title',''))) not between 1 and 200 or length(coalesce(section->>'description',''))>3000 or jsonb_typeof(section->'questions') is distinct from 'array' then raise exception 'Seção inválida.';end if;
  insert into public.briefing_sections(agency_id,template_id,title,description,position) values(p_agency,template_id,trim(section->>'title'),nullif(trim(section->>'description'),''),section_position) returning id into section_id;
  question_position:=0;
  for question in select value from jsonb_array_elements(section->'questions') loop
   question_count:=question_count+1;
   if question_count>250 or jsonb_typeof(question) is distinct from 'object' or coalesce(question->>'question_key','') !~ '^[a-zA-Z][a-zA-Z0-9_]{0,99}$' or length(trim(coalesce(question->>'label',''))) not between 1 and 1000 or length(coalesce(question->>'description',''))>3000 or coalesce(question->>'question_type','') not in ('short_text','long_text','single_choice','multiple_choice','date','number','url','email','file_upload') or jsonb_typeof(coalesce(question->'options','[]')) is distinct from 'array' or jsonb_typeof(coalesce(question->'validation_rules','{}')) is distinct from 'object' then raise exception 'Pergunta inválida.';end if;
   if question->>'question_type' in ('single_choice','multiple_choice') and jsonb_array_length(coalesce(question->'options','[]')) not between 1 and 50 then raise exception 'Adicione opções à pergunta de escolha.';end if;
   insert into public.briefing_questions(agency_id,template_id,section_id,question_key,label,description,question_type,is_required,position,options,validation_rules) values(p_agency,template_id,section_id,question->>'question_key',trim(question->>'label'),nullif(trim(question->>'description'),''),question->>'question_type',coalesce((question->>'is_required')::boolean,false),question_position,coalesce(question->'options','[]'),coalesce(question->'validation_rules','{}'));
   question_position:=question_position+1;
  end loop;
  section_position:=section_position+1;
 end loop;
 if question_count=0 then raise exception 'Adicione pelo menos uma pergunta.';end if;
 return to_jsonb(result);
end;$$;
revoke all on function public.save_briefing_template(uuid,jsonb,uuid) from public,anon;
grant execute on function public.save_briefing_template(uuid,jsonb,uuid) to authenticated;
comment on function public.save_briefing_template(uuid,jsonb,uuid) is 'Atomic authorized template copy. Immutable previous answers, idempotent request ID and serialized lineage versions. SECURITY INVOKER preserves RLS.';
