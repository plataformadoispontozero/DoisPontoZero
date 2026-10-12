-- Incremental safeguards for the existing monthly workflow; public review/production RPCs are preserved.
CREATE OR REPLACE FUNCTION private.editorial_normalize(p_text text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT trim(regexp_replace(translate(lower(coalesce(p_text,'')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),'[^a-z0-9]+',' ','g'));
$$;
REVOKE ALL ON FUNCTION private.editorial_normalize(text) FROM PUBLIC,anon,authenticated;
CREATE TABLE public.editorial_repertoire_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),agency_id uuid NOT NULL REFERENCES public.agencies(id),version integer NOT NULL,
 families jsonb NOT NULL CHECK(jsonb_typeof(families)='array' AND jsonb_array_length(families) BETWEEN 1 AND 20 AND octet_length(families::text)<30000),
 created_by uuid REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(agency_id,version)
);
CREATE TABLE public.editorial_campaign_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),agency_id uuid NOT NULL REFERENCES public.agencies(id),client_id uuid NOT NULL REFERENCES public.clients(id),
 campaign_id uuid NOT NULL REFERENCES public.monthly_editorial_campaigns(id),revision integer NOT NULL,
 month date NOT NULL,context jsonb NOT NULL,items jsonb NOT NULL,briefing_snapshot jsonb NOT NULL DEFAULT '{}',strategy_snapshot jsonb NOT NULL DEFAULT '{}',
 engine_version text NOT NULL,actor_id uuid REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(campaign_id,revision)
);
CREATE INDEX editorial_versions_client ON public.editorial_campaign_versions(agency_id,client_id,created_at DESC);
CREATE TABLE public.editorial_idea_registry (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),agency_id uuid NOT NULL REFERENCES public.agencies(id),client_id uuid NOT NULL REFERENCES public.clients(id),
 campaign_id uuid NOT NULL REFERENCES public.monthly_editorial_campaigns(id),signature text NOT NULL,essential_signature text NOT NULL,theme text,angle text,
 first_item jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(agency_id,client_id,signature),UNIQUE(agency_id,client_id,essential_signature)
);
CREATE INDEX editorial_registry_campaign ON public.editorial_idea_registry(campaign_id);
ALTER TABLE public.monthly_editorial_campaigns DROP CONSTRAINT monthly_editorial_campaigns_items_check;
ALTER TABLE public.monthly_editorial_campaigns ADD CONSTRAINT monthly_editorial_campaigns_items_check CHECK(jsonb_typeof(items)='array' AND jsonb_array_length(items) BETWEEN 1 AND 90 AND octet_length(items::text)<1200000);
CREATE UNIQUE INDEX editorial_one_campaign_per_month ON public.monthly_editorial_campaigns(agency_id,client_id,month);
ALTER TABLE public.editorial_repertoire_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_campaign_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_idea_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.editorial_repertoire_versions,public.editorial_campaign_versions,public.editorial_idea_registry FROM anon,authenticated;
GRANT SELECT ON public.editorial_repertoire_versions,public.editorial_campaign_versions,public.editorial_idea_registry TO authenticated;
CREATE POLICY repertoire_read ON public.editorial_repertoire_versions FOR SELECT TO authenticated USING(private.can_editorial(agency_id,'strategy.view'));
CREATE POLICY versions_read ON public.editorial_campaign_versions FOR SELECT TO authenticated USING(private.can_editorial(agency_id,'strategy.view'));
CREATE POLICY registry_read ON public.editorial_idea_registry FOR SELECT TO authenticated USING(private.can_editorial(agency_id,'strategy.view'));
CREATE OR REPLACE FUNCTION public.save_editorial_repertoire(p_agency uuid,p_families jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE next_version integer; family jsonb; angle jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id JOIN public.agencies a ON a.id=m.agency_id
 WHERE m.agency_id=p_agency AND m.user_id=auth.uid() AND m.status='active' AND a.status='active' AND r.name IN ('OWNER','ADMIN','MANAGER')) THEN RAISE EXCEPTION 'Somente gestor ou administrador pode editar o repertório.' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_families) IS DISTINCT FROM 'array' OR jsonb_array_length(p_families) NOT BETWEEN 1 AND 20 OR octet_length(p_families::text)>30000 THEN RAISE EXCEPTION 'Repertório inválido'; END IF;
 FOR family IN SELECT value FROM jsonb_array_elements(p_families) LOOP
 IF coalesce(family->>'id','') NOT IN ('educational','orientation','choice','institutional','action','differential','process') OR coalesce(family->>'journey','') NOT IN ('Descoberta','Consideração','Relacionamento','Conversão') OR jsonb_typeof(family->'angles') IS DISTINCT FROM 'array' OR jsonb_array_length(family->'angles') NOT BETWEEN 1 AND 12 OR coalesce(length(family->>'label'),0) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Família inválida'; END IF;
 FOR angle IN SELECT value FROM jsonb_array_elements(family->'angles') LOOP
 IF jsonb_typeof(angle) IS DISTINCT FROM 'string' OR length(angle#>>'{}') NOT BETWEEN 1 AND 80 OR private.editorial_normalize(angle#>>'{}')='' THEN RAISE EXCEPTION 'Ângulo inválido'; END IF;
 END LOOP;
 END LOOP;
 IF (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(p_families))<>jsonb_array_length(p_families) THEN RAISE EXCEPTION 'Família duplicada'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_agency::text||':editorial-repertoire',0));
 SELECT coalesce(max(version),0)+1 INTO next_version FROM public.editorial_repertoire_versions WHERE agency_id=p_agency;
 INSERT INTO public.editorial_repertoire_versions(agency_id,version,families,created_by) VALUES(p_agency,next_version,p_families,auth.uid());
 RETURN next_version;
END; $$;
REVOKE ALL ON FUNCTION public.save_editorial_repertoire(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_editorial_repertoire(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION private.editorial_brief_snapshot(p_agency uuid,p_briefing uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('id',b.id,'templateVersion',b.template_version,'updatedAt',b.updated_at,'answers',coalesce((SELECT jsonb_agg(jsonb_build_object('questionId',a.question_id,'value',a.answer_value,'updatedAt',a.updated_at,'questionKey',q.question_key,'label',q.label) ORDER BY a.question_id) FROM public.briefing_answers a JOIN public.briefing_questions q ON q.id=a.question_id AND q.agency_id=a.agency_id WHERE a.briefing_id=b.id AND a.agency_id=p_agency),'[]'::jsonb)) FROM public.briefings b WHERE b.id=p_briefing AND b.agency_id=p_agency;
$$;
REVOKE ALL ON FUNCTION private.editorial_brief_snapshot(uuid,uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.get_editorial_briefing(p_agency uuid,p_client uuid,p_briefing uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE snapshot jsonb;
BEGIN
 IF NOT private.can_editorial(p_agency,'strategy.view') OR NOT EXISTS(SELECT 1 FROM public.briefings WHERE id=p_briefing AND agency_id=p_agency AND client_id=p_client) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 snapshot:=private.editorial_brief_snapshot(p_agency,p_briefing);
 RETURN snapshot || jsonb_build_object('revision',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'));
END; $$;
REVOKE ALL ON FUNCTION public.get_editorial_briefing(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_editorial_briefing(uuid,uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION private.editorial_campaign_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
#variable_conflict use_variable
DECLARE item jsonb; signature text; essential text; fingerprints text[]:='{}'; essentials text[]:='{}'; blocked text; text_value text; old_match uuid; strategy uuid; latest_repertoire integer; family jsonb;
BEGIN
 IF TG_OP='UPDATE' AND NEW.items=OLD.items AND NEW.context=OLD.context AND NEW.client_id=OLD.client_id AND NEW.briefing_id IS NOT DISTINCT FROM OLD.briefing_id AND NEW.month=OLD.month THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.agency_id::text||':'||NEW.client_id::text||':editorial',0));
 IF TG_OP='UPDATE' AND (NEW.agency_id<>OLD.agency_id OR NEW.client_id<>OLD.client_id OR NEW.month<>OLD.month) THEN RAISE EXCEPTION 'Cliente e mês da campanha não podem ser alterados'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.clients WHERE id=NEW.client_id AND agency_id=NEW.agency_id) THEN RAISE EXCEPTION 'Client mismatch'; END IF;
 IF NEW.briefing_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.briefings WHERE id=NEW.briefing_id AND agency_id=NEW.agency_id AND client_id=NEW.client_id) THEN RAISE EXCEPTION 'Briefing mismatch'; END IF;
 IF NEW.context->>'engineVersion'='campaign-rules-1.0' AND NEW.briefing_id IS NOT NULL AND coalesce(NEW.context->>'briefingRevision','') IS DISTINCT FROM encode(sha256(convert_to(private.editorial_brief_snapshot(NEW.agency_id,NEW.briefing_id)::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Briefing atualizado. Reimporte e revise a campanha antes de salvar.'; END IF;
 IF coalesce(NEW.context->>'strategyId','')<>'' THEN
 strategy:=(NEW.context->>'strategyId')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.content_strategies WHERE id=strategy AND agency_id=NEW.agency_id AND client_id=NEW.client_id) THEN RAISE EXCEPTION 'Strategy mismatch'; END IF;
 END IF;
 SELECT coalesce(max(version),0) INTO latest_repertoire FROM public.editorial_repertoire_versions WHERE agency_id=NEW.agency_id;
 IF NEW.context->>'engineVersion'='campaign-rules-1.0' AND coalesce((NEW.context->>'repertoireVersion')::integer,0)<>latest_repertoire THEN RAISE EXCEPTION 'Repertório atualizado. Gere e revise uma nova prévia.'; END IF;
 IF jsonb_typeof(NEW.context->'forbiddenTerms') IS NOT NULL AND jsonb_typeof(NEW.context->'forbiddenTerms')<>'array' THEN RAISE EXCEPTION 'Termos proibidos inválidos'; END IF;
 IF NEW.context->>'engineVersion'='campaign-rules-1.0' AND (coalesce(trim(NEW.context->>'objective'),'')='' OR coalesce(trim(NEW.context->>'audience'),'')='') THEN RAISE EXCEPTION 'Objetivo e público obrigatórios'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(NEW.items) LOOP
 IF NEW.context->>'engineVersion'='campaign-rules-1.0' AND NOT (item ? 'editorial') THEN RAISE EXCEPTION 'Ficha editorial obrigatória para este motor'; END IF;
 IF item ? 'editorial' THEN
 IF item->>'format'='carousel' AND (jsonb_typeof(item->'editorial'->'slides') IS DISTINCT FROM 'array' OR jsonb_array_length(item->'editorial'->'slides') NOT BETWEEN 3 AND 10) THEN RAISE EXCEPTION 'Estrutura de carrossel inválida'; END IF;
 IF item->>'format'='reels' AND (jsonb_typeof(item->'editorial'->'scenes') IS DISTINCT FROM 'array' OR jsonb_array_length(item->'editorial'->'scenes') NOT BETWEEN 3 AND 10) THEN RAISE EXCEPTION 'Estrutura de reels inválida'; END IF;
 IF item->'editorial'->>'version' IS DISTINCT FROM 'campaign-rules-1.0' OR coalesce(length(item->'editorial'->>'theme'),0) NOT BETWEEN 1 AND 200 OR coalesce(length(item->'editorial'->>'angle'),0) NOT BETWEEN 1 AND 80 OR coalesce(item->'editorial'->>'family','') NOT IN ('educational','orientation','choice','institutional','action','differential','process') THEN RAISE EXCEPTION 'Ficha editorial inválida'; END IF;
 signature:=private.editorial_normalize(item->'editorial'->>'theme')||'|'||private.editorial_normalize(item->'editorial'->>'family')||'|'||private.editorial_normalize(item->'editorial'->>'angle');
 essential:=private.editorial_normalize(item->'editorial'->>'theme')||'|'||private.editorial_normalize(item->'editorial'->>'angle');
 IF item->'editorial'->>'pillarId'='monthly-priorities' THEN
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(NEW.context->'topics','[]')) t WHERE private.editorial_normalize(t.value)=private.editorial_normalize(item->'editorial'->>'theme')) THEN RAISE EXCEPTION 'Tema não consta nas prioridades aprovadas'; END IF;
 ELSE
 IF strategy IS NULL OR NOT EXISTS(SELECT 1 FROM public.editorial_pillars p WHERE p.id=(item->'editorial'->>'pillarId')::uuid AND p.agency_id=NEW.agency_id AND p.strategy_id=strategy AND p.percentage>0 AND EXISTS(SELECT 1 FROM unnest(p.example_topics) t WHERE private.editorial_normalize(t)=private.editorial_normalize(item->'editorial'->>'theme')) AND (coalesce(cardinality(p.content_formats),0)=0 OR item->>'format'=ANY(p.content_formats) OR (item->>'format'='carousel' AND 'carrossel'=ANY(p.content_formats)))) THEN RAISE EXCEPTION 'Pilar/tema incompatível com cliente e formato'; END IF;
 END IF;
 IF latest_repertoire=0 THEN
 family:='{"educational":["conceito","pergunta","guia"],"orientation":["necessidade","decisao","prioridade"],"choice":["criterio","checklist","comparacao-interna"],"institutional":["proposito","posicionamento","valores"],"action":["primeiro-passo","contato","planejamento"],"differential":["atributo","beneficio"],"process":["etapas","bastidores"]}'::jsonb;
 IF NOT ((family->(item->'editorial'->>'family')) ? (item->'editorial'->>'angle')) THEN RAISE EXCEPTION 'Ângulo fora do repertório padrão'; END IF;
 END IF;
 IF latest_repertoire>0 THEN
 SELECT f.value INTO family FROM public.editorial_repertoire_versions r CROSS JOIN LATERAL jsonb_array_elements(r.families) f WHERE r.agency_id=NEW.agency_id AND r.version=latest_repertoire AND f.value->>'id'=item->'editorial'->>'family';
 IF family IS NULL OR NOT (family->'angles' ? (item->'editorial'->>'angle')) THEN RAISE EXCEPTION 'Família/ângulo fora do repertório vigente'; END IF;
 END IF;
 IF item->'editorial'->>'family' IN ('process','differential') AND (jsonb_typeof(NEW.context->'approvedFacts') IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.context->'approvedFacts')=0) THEN RAISE EXCEPTION 'Família exige informação factual aprovada'; END IF;
 IF item->'editorial'->>'signature' IS DISTINCT FROM signature THEN RAISE EXCEPTION 'Assinatura editorial inválida'; END IF;
 ELSE
 signature:='legacy:'||private.editorial_normalize(item->>'title')||'|'||private.editorial_normalize(item->>'copy');essential:=signature;
 END IF;
 IF signature=ANY(fingerprints) OR essential=ANY(essentials) THEN RAISE EXCEPTION 'Ideia duplicada na campanha'; END IF;
 fingerprints:=array_append(fingerprints,signature);essentials:=array_append(essentials,essential);
 SELECT campaign_id INTO old_match FROM public.editorial_idea_registry WHERE agency_id=NEW.agency_id AND client_id=NEW.client_id AND (editorial_idea_registry.signature=signature OR essential_signature=essential) LIMIT 1;
 IF old_match IS NOT NULL AND old_match<>NEW.id THEN RAISE EXCEPTION 'Ideia já registrada para este cliente. Escolha outro ângulo.'; END IF;
 text_value:=' '||private.editorial_normalize((item->>'title')||' '||(item->>'copy')||' '||coalesce(item->'editorial'->>'visual',''))||' ';
 FOR blocked IN SELECT private.editorial_normalize(value) FROM jsonb_array_elements_text(coalesce(NEW.context->'forbiddenTerms','[]')) LOOP
 IF blocked<>'' AND position(' '||blocked||' ' IN text_value)>0 THEN RAISE EXCEPTION 'Termo proibido encontrado: %',blocked; END IF;
 END LOOP;
 -- Legacy ideas are consulted across all states, including discarded; scoped through their strategy.
 IF EXISTS(SELECT 1 FROM public.editorial_idea_registry h WHERE h.agency_id=NEW.agency_id AND h.client_id=NEW.client_id AND h.campaign_id<>NEW.id AND (private.editorial_normalize(h.first_item->>'title')=private.editorial_normalize(item->>'title') OR (h.signature LIKE 'legacy:%' AND private.editorial_normalize(h.first_item->>'title')=private.editorial_normalize(item->'editorial'->>'theme')))) THEN RAISE EXCEPTION 'Tema idêntico já registrado no histórico do cliente'; END IF;
 IF EXISTS(SELECT 1 FROM public.content_ideas i JOIN public.content_strategies s ON s.id=i.strategy_id AND s.agency_id=i.agency_id WHERE s.agency_id=NEW.agency_id AND s.client_id=NEW.client_id AND private.editorial_normalize(i.title) IN (private.editorial_normalize(item->>'title'),private.editorial_normalize(item->'editorial'->>'theme'))) THEN RAISE EXCEPTION 'Tema já registrado no banco de ideias deste cliente'; END IF;
 END LOOP;
 IF TG_OP='UPDATE' AND NEW.status IN ('pending','approved','changes_requested') THEN NEW.status:='draft'; UPDATE public.monthly_editorial_shares SET revoked=true WHERE campaign_id=NEW.id; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.editorial_campaign_guard() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.editorial_campaign_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
#variable_conflict use_variable
DECLARE item jsonb; signature text; essential text; revision integer; brief jsonb:='{}'; strategy_snapshot jsonb:='{}'; strategy uuid;
BEGIN
 IF TG_OP='UPDATE' AND NEW.items=OLD.items AND NEW.context=OLD.context AND NEW.briefing_id IS NOT DISTINCT FROM OLD.briefing_id AND NEW.month=OLD.month THEN RETURN NEW; END IF;
 IF NEW.briefing_id IS NOT NULL THEN
 brief:=private.editorial_brief_snapshot(NEW.agency_id,NEW.briefing_id);
 END IF;
 IF coalesce(NEW.context->>'strategyId','')<>'' THEN
 strategy:=(NEW.context->>'strategyId')::uuid;
 SELECT to_jsonb(s) || jsonb_build_object('pillars',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.position,p.id) FROM public.editorial_pillars p WHERE p.strategy_id=s.id AND p.agency_id=NEW.agency_id),'[]')) INTO strategy_snapshot FROM public.content_strategies s WHERE s.id=strategy AND s.agency_id=NEW.agency_id AND s.client_id=NEW.client_id;
 END IF;
 SELECT coalesce(max(v.revision),0)+1 INTO revision FROM public.editorial_campaign_versions v WHERE campaign_id=NEW.id;
 INSERT INTO public.editorial_campaign_versions(agency_id,client_id,campaign_id,revision,month,context,items,briefing_snapshot,strategy_snapshot,engine_version,actor_id)
 VALUES(NEW.agency_id,NEW.client_id,NEW.id,revision,NEW.month,NEW.context,NEW.items,coalesce(brief,'{}'),coalesce(strategy_snapshot,'{}'),coalesce(NEW.context->>'engineVersion','legacy-rules'),auth.uid());
 FOR item IN SELECT value FROM jsonb_array_elements(NEW.items) LOOP
 IF item ? 'editorial' THEN
 signature:=private.editorial_normalize(item->'editorial'->>'theme')||'|'||private.editorial_normalize(item->'editorial'->>'family')||'|'||private.editorial_normalize(item->'editorial'->>'angle');essential:=private.editorial_normalize(item->'editorial'->>'theme')||'|'||private.editorial_normalize(item->'editorial'->>'angle');
 ELSE signature:='legacy:'||private.editorial_normalize(item->>'title')||'|'||private.editorial_normalize(item->>'copy');essential:=signature; END IF;
 INSERT INTO public.editorial_idea_registry(agency_id,client_id,campaign_id,signature,essential_signature,theme,angle,first_item)
 VALUES(NEW.agency_id,NEW.client_id,NEW.id,signature,essential,item->'editorial'->>'theme',item->'editorial'->>'angle',item) ON CONFLICT DO NOTHING;
 END LOOP;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.editorial_campaign_audit() FROM PUBLIC,anon,authenticated;
-- Preserve all existing campaign content as initial immutable history, including drafts.
INSERT INTO public.editorial_campaign_versions(agency_id,client_id,campaign_id,revision,month,context,items,engine_version)
SELECT agency_id,client_id,id,1,month,context,items,'legacy-rules' FROM public.monthly_editorial_campaigns;
INSERT INTO public.editorial_idea_registry(agency_id,client_id,campaign_id,signature,essential_signature,first_item)
SELECT c.agency_id,c.client_id,c.id,'legacy:'||private.editorial_normalize(i.value->>'title')||'|'||private.editorial_normalize(i.value->>'copy'),'legacy:'||private.editorial_normalize(i.value->>'title')||'|'||private.editorial_normalize(i.value->>'copy'),i.value FROM public.monthly_editorial_campaigns c CROSS JOIN LATERAL jsonb_array_elements(c.items) i ON CONFLICT DO NOTHING;
CREATE TRIGGER editorial_guard BEFORE INSERT OR UPDATE ON public.monthly_editorial_campaigns FOR EACH ROW EXECUTE FUNCTION private.editorial_campaign_guard();
CREATE TRIGGER editorial_audit AFTER INSERT OR UPDATE ON public.monthly_editorial_campaigns FOR EACH ROW EXECUTE FUNCTION private.editorial_campaign_audit();

CREATE OR REPLACE FUNCTION public.share_monthly_editorial(p_campaign uuid,p_token text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; client_name text; expires timestamptz;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign FOR UPDATE;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.edit') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR c.project_id IS NOT NULL THEN RAISE EXCEPTION 'Invalid share'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(c.items) i WHERE i.value->>'copy' ~ '\[(Completar|Complementar)') THEN RAISE EXCEPTION 'Complete as lacunas antes de enviar para aprovação.'; END IF;
 SELECT name INTO client_name FROM public.clients WHERE id=c.client_id AND agency_id=c.agency_id;
 UPDATE public.monthly_editorial_shares SET revoked=true WHERE campaign_id=c.id;
 INSERT INTO public.monthly_editorial_shares(campaign_id,token_hash,snapshot) VALUES(c.id,encode(sha256(convert_to(p_token,'UTF8')),'hex'),jsonb_build_object('client',client_name,'month',c.month,'items',(SELECT jsonb_agg(value - 'editorial') FROM jsonb_array_elements(c.items)))) RETURNING expires_at INTO expires;
 UPDATE public.monthly_editorial_campaigns SET status='pending',updated_at=now() WHERE id=c.id;
 RETURN expires;
END; $$;
CREATE OR REPLACE FUNCTION public.produce_monthly_editorial(p_campaign uuid,p_include_traffic boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; project uuid; board uuid; column_id uuid; client_name text; item jsonb; idx integer:=0;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign FOR UPDATE;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.edit') OR NOT private.can_editorial(c.agency_id,'projects.create') OR NOT private.can_editorial(c.agency_id,'tasks.create') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF c.project_id IS NOT NULL THEN RETURN c.project_id; END IF;
 IF c.status<>'approved' THEN RAISE EXCEPTION 'Approve the calendar before production'; END IF;
 SELECT name INTO client_name FROM public.clients WHERE id=c.client_id AND agency_id=c.agency_id;
 INSERT INTO public.projects(agency_id,client_id,name,description,status,created_by,start_date,due_date) VALUES(c.agency_id,c.client_id,'Campanha '||client_name||' — '||to_char(c.month,'MM/YYYY'),'Calendário editorial aprovado.','active',auth.uid(),c.month,(c.month+interval '1 month -1 day')::date) RETURNING id INTO project;
 INSERT INTO public.project_boards(agency_id,project_id,name,is_default) VALUES(c.agency_id,project,'Produção mensal',true) RETURNING id INTO board;
 INSERT INTO public.board_columns(agency_id,board_id,name,category,position) VALUES(c.agency_id,board,'A produzir','backlog',0) RETURNING id INTO column_id;
 INSERT INTO public.board_columns(agency_id,board_id,name,category,position) VALUES(c.agency_id,board,'Em produção','in_progress',1),(c.agency_id,board,'Revisão','review',2),(c.agency_id,board,'Concluído','done',3);
 FOR item IN SELECT value FROM jsonb_array_elements(c.items) LOOP
  INSERT INTO public.tasks(agency_id,project_id,board_id,column_id,title,description,due_date,created_by,position)
  VALUES(c.agency_id,project,board,column_id,CASE WHEN item->>'format'='reels' THEN '[Videomaker] ' ELSE '[Design] ' END||(item->>'title'),(item->>'format')||E'\n\n'||(item->>'copy')||CASE WHEN item ? 'editorial' THEN E'\n\nDireção visual (sugestão para produção): '||(item->'editorial'->>'visual')||coalesce(E'\nSlides: '||(SELECT jsonb_agg(jsonb_build_object('slide',ordinality,'direcao',value->>'visual'))::text FROM jsonb_array_elements(coalesce(item->'editorial'->'slides','[]'::jsonb)) WITH ORDINALITY),'')||coalesce(E'\nCenas: '||(SELECT jsonb_agg(jsonb_build_object('cena',ordinality,'segundos',value->'seconds','direcao',value->>'visual'))::text FROM jsonb_array_elements(coalesce(item->'editorial'->'scenes','[]'::jsonb)) WITH ORDINALITY),'') ELSE '' END,(item->>'date')::date,auth.uid(),idx);
  idx:=idx+1;
 END LOOP;
 IF p_include_traffic THEN INSERT INTO public.tasks(agency_id,project_id,board_id,column_id,title,description,due_date,created_by,position)
 VALUES(c.agency_id,project,board,column_id,'[Tráfego Pago] Planejar mídia — '||client_name,'Definir objetivo, orçamento, público e peças aprovadas com a equipe. Não publica anúncios automaticamente.',c.month,auth.uid(),idx); END IF;
 UPDATE public.monthly_editorial_campaigns SET project_id=project,status='production',updated_at=now() WHERE id=c.id;
 RETURN project;
END; $$;
