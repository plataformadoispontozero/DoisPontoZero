-- New briefing is the intake of a new client. Client + briefing + source snapshot commit together.
CREATE TABLE private.briefing_intakes (
 agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,
 source_lead_id uuid REFERENCES public.agency_site_leads(id) ON DELETE SET NULL,
 client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
 briefing_id uuid NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(agency_id,request_id), UNIQUE(source_lead_id)
);
ALTER TABLE private.briefing_intakes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.briefing_intakes FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.get_briefing_intake_leads(p_agency uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT private.can_editorial(p_agency,'briefings.create') OR NOT private.can_editorial(p_agency,'clients.create') THEN RAISE EXCEPTION 'Permissão para iniciar o cadastro de clientes e briefings necessária.' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC),'[]'::jsonb) INTO result FROM (
 SELECT s.id,s.name,s.company,s.email,s.phone,s.services,s.objective,s.budget,s.created_at
 FROM public.agency_site_leads s WHERE s.agency_id=p_agency AND NOT EXISTS(SELECT 1 FROM private.briefing_intakes i WHERE i.source_lead_id=s.id)
 ORDER BY s.created_at DESC LIMIT 200) l;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.get_briefing_intake_leads(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_briefing_intake_leads(uuid) TO authenticated;

CREATE FUNCTION public.create_briefing_intake(p_agency uuid,p_request uuid,p_lead uuid,p_identity jsonb,p_template uuid,p_title text,p_description text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_client uuid; v_brief uuid; v_version integer; v_name text; v_contact text; v_email text; v_phone text; v_slug text; v_context text; lead public.agency_site_leads; prior private.briefing_intakes;
BEGIN
 IF auth.uid() IS NULL OR NOT private.can_editorial(p_agency,'briefings.create') OR NOT private.can_editorial(p_agency,'clients.create') THEN RAISE EXCEPTION 'Permissão para cadastrar clientes e criar briefings necessária.' USING ERRCODE='42501'; END IF;
 IF p_request IS NULL OR p_identity IS NULL OR jsonb_typeof(p_identity)<>'object' OR octet_length(p_identity::text)>4096 THEN RAISE EXCEPTION 'Identificação inválida.'; END IF;
 -- Retry-safe creation, even when the browser loses the first successful response.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_agency::text||p_request::text,0));
 SELECT * INTO prior FROM private.briefing_intakes WHERE agency_id=p_agency AND request_id=p_request;
 IF FOUND THEN
  IF prior.created_by<>auth.uid() THEN RAISE EXCEPTION 'Solicitação indisponível.' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object('client_id',prior.client_id,'briefing_id',prior.briefing_id);
 END IF;
 IF p_lead IS NOT NULL THEN
  SELECT * INTO lead FROM public.agency_site_leads WHERE id=p_lead AND agency_id=p_agency FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação de orçamento indisponível.'; END IF;
  IF EXISTS(SELECT 1 FROM private.briefing_intakes WHERE source_lead_id=p_lead) THEN RAISE EXCEPTION 'Esta solicitação já possui briefing. Consulte o histórico do cliente.'; END IF;
 END IF;
 v_name:=trim(coalesce(p_identity->>'name',''));v_contact:=trim(coalesce(p_identity->>'contactName',''));v_email:=trim(coalesce(p_identity->>'email',''));v_phone:=trim(coalesce(p_identity->>'phone',''));
 IF length(v_name) NOT BETWEEN 2 AND 160 OR length(v_contact)>120 OR length(v_email)>254 OR length(v_phone)>30 OR (v_email<>'' AND v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') OR length(trim(coalesce(p_title,''))) NOT BETWEEN 1 AND 500 OR length(coalesce(p_description,''))>12000 THEN RAISE EXCEPTION 'Confira o nome, o contato e o título do briefing.'; END IF;
 -- Serialize by normalized company name; existing clients use their briefing history.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_agency::text||lower(v_name),1));
 IF EXISTS(SELECT 1 FROM public.clients WHERE agency_id=p_agency AND lower(trim(name))=lower(v_name)) THEN RAISE EXCEPTION 'Este cliente já está cadastrado. Abra o histórico de briefings em vez de criar outro cadastro.'; END IF;
 SELECT version INTO v_version FROM public.briefing_templates WHERE id=p_template AND agency_id=p_agency AND status<>'archived' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Modelo de briefing indisponível.'; END IF;
 v_client:=gen_random_uuid();v_slug:=trim(both '-' from regexp_replace(lower(v_name),'[^a-z0-9]+','-','g'));
 v_slug:=coalesce(nullif(left(v_slug,100),''),'cliente')||'-'||replace(v_client::text,'-','');
 INSERT INTO public.clients(id,agency_id,name,slug,status,profile) VALUES(v_client,p_agency,v_name,v_slug,'active',CASE WHEN p_lead IS NOT NULL THEN jsonb_build_object('monthly_objective',lead.objective) ELSE '{}'::jsonb END);
 v_context:=format(E'Contato inicial: %s\nE-mail: %s\nTelefone: %s',coalesce(nullif(v_contact,''),'A informar'),coalesce(nullif(v_email,''),'A informar'),coalesce(nullif(v_phone,''),'A informar'));
 IF p_lead IS NOT NULL THEN v_context:=v_context||format(E'\n\nSolicitação original do site (%s)\nEmpresa: %s\nContato: %s\nE-mail: %s\nTelefone: %s\nServiços: %s\nObjetivo: %s\nInvestimento informado: %s',lead.created_at,lead.company,lead.name,lead.email,lead.phone,array_to_string(lead.services,', '),lead.objective,coalesce(nullif(lead.budget,''),'A definir')); END IF;
 v_context:=v_context||CASE WHEN nullif(trim(p_description),'') IS NOT NULL THEN E'\n\nContexto para a reunião:\n'||trim(p_description) ELSE '' END;
 INSERT INTO public.briefings(agency_id,client_id,template_id,template_version,title,description,status,created_by) VALUES(p_agency,v_client,p_template,v_version,trim(p_title),v_context,'draft',auth.uid()) RETURNING id INTO v_brief;
 -- Only semantically matching text questions are seeded. Other answers remain for the meeting.
 IF p_lead IS NOT NULL THEN
  INSERT INTO public.briefing_answers(agency_id,briefing_id,question_id,answer_value)
  SELECT p_agency,v_brief,q.id,to_jsonb(lead.objective) FROM public.briefing_questions q WHERE q.agency_id=p_agency AND q.template_id=p_template AND q.question_type IN ('short_text','long_text') AND q.question_key IN ('branding_main_goal','social_goals','motion_purpose','video_goal','campaign_objective','objective');
 END IF;
 INSERT INTO private.briefing_intakes(agency_id,request_id,source_lead_id,client_id,briefing_id,created_by) VALUES(p_agency,p_request,p_lead,v_client,v_brief,auth.uid());
 RETURN jsonb_build_object('client_id',v_client,'briefing_id',v_brief);
END; $$;
REVOKE ALL ON FUNCTION public.create_briefing_intake(uuid,uuid,uuid,jsonb,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_briefing_intake(uuid,uuid,uuid,jsonb,uuid,text,text) TO authenticated;
