-- Move a chosen subset or complete loaded client group atomically through canonical task movement.
CREATE FUNCTION public.move_task_group(p_agency_id uuid, p_task_ids uuid[], p_status text) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item record; target uuid; moved integer := 0; found_count integer := 0;
BEGIN
 IF NOT coalesce(public.is_agency_member(p_agency_id),false) OR NOT coalesce(public.has_agency_permission(p_agency_id,'tasks.view'),false) OR NOT coalesce(public.has_agency_permission(p_agency_id,'tasks.move'),false) THEN RAISE EXCEPTION 'Permissão negada para mover demandas' USING errcode='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('open','in_progress','review','done') THEN RAISE EXCEPTION 'Etapa inválida'; END IF;
 IF p_task_ids IS NULL OR cardinality(p_task_ids) NOT BETWEEN 1 AND 1000 OR cardinality(p_task_ids)<>(SELECT count(DISTINCT id) FROM unnest(p_task_ids) id) THEN RAISE EXCEPTION 'Seleção inválida'; END IF;
 FOR item IN SELECT t.id,t.board_id,t.status,t.project_id FROM public.tasks t JOIN public.projects p ON p.id=t.project_id AND p.agency_id=p_agency_id WHERE t.id=ANY(p_task_ids) AND t.agency_id=p_agency_id AND t.archived_at IS NULL AND t.status<>'archived' AND t.parent_task_id IS NULL AND p.archived_at IS NULL ORDER BY t.id FOR UPDATE OF t LOOP
  found_count := found_count+1;
  IF NOT public.can_access_project(item.project_id) THEN RAISE EXCEPTION 'Permissão negada para mover demandas' USING errcode='42501'; END IF;
  SELECT b.id INTO target FROM public.board_columns b WHERE b.agency_id=p_agency_id AND b.board_id=item.board_id AND b.category=CASE WHEN p_status='open' THEN 'backlog' ELSE p_status END ORDER BY b.position,b.id LIMIT 1;
  IF target IS NULL THEN RAISE EXCEPTION 'Uma demanda não possui coluna de destino. Nenhuma demanda foi movida.'; END IF;
  IF item.status IS DISTINCT FROM p_status THEN PERFORM public.move_task(item.id,target,0::double precision); moved := moved+1; END IF;
 END LOOP;
 IF found_count<>cardinality(p_task_ids) THEN RAISE EXCEPTION 'Seleção contém demandas indisponíveis. Nenhuma demanda foi movida.' USING errcode='42501'; END IF;
 RETURN moved;
END;$$;
REVOKE ALL ON FUNCTION public.move_task_group(uuid,uuid[],text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.move_task_group(uuid,uuid[],text) TO authenticated;
CREATE FUNCTION public.editorial_task_description(item jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE e jsonb := coalesce(item->'editorial','{}'::jsonb); entry jsonb; n integer := 0; result text;
BEGIN
 result := concat_ws(E'\n\n',item->>'format','Título: '||(item->>'title'),item->>'copy',CASE WHEN e->'postConcept'->>'support' IS NOT NULL THEN 'Texto de apoio: '||(e->'postConcept'->>'support') END,CASE WHEN e->>'cta' IS NOT NULL THEN 'CTA: '||(e->>'cta') END,CASE WHEN e->>'hashtags' IS NOT NULL THEN 'Hashtags: '||(e->>'hashtags') END,CASE WHEN e->>'angle' IS NOT NULL THEN 'Ângulo e enquadramento: '||(e->>'angle') END,CASE WHEN e->>'visual' IS NOT NULL THEN 'Direção criativa: '||(e->>'visual') END,CASE WHEN e->'postConcept'->>'composition' IS NOT NULL THEN 'Composição: '||(e->'postConcept'->>'composition') END);
 FOR entry IN SELECT value FROM jsonb_array_elements(coalesce(e->'slides','[]'::jsonb)) LOOP n:=n+1; result:=result||E'\n\nLâmina '||n||': '||concat_ws(E'\n',entry->>'headline',entry->>'text','Direção visual: '||(entry->>'visual')); END LOOP;
 n:=0;
 FOR entry IN SELECT value FROM jsonb_array_elements(coalesce(e->'scenes','[]'::jsonb)) LOOP n:=n+1; result:=result||E'\n\nCena '||n||' ('||coalesce(entry->>'seconds','0')||'s): '||concat_ws(E'\n',entry->>'text','Na tela: '||(entry->>'onScreen'),'Visual: '||(entry->>'visual'),'Câmera: '||(entry->>'camera'),'Áudio: '||(entry->>'audio')); END LOOP;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.editorial_task_description(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.editorial_task_description(jsonb) TO authenticated;
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
  VALUES(c.agency_id,project,board,column_id,CASE WHEN item->>'format'='reels' THEN '[Videomaker] ' ELSE '[Design] ' END||(item->>'title'),public.editorial_task_description(item),(item->>'date')::date,auth.uid(),idx);
  idx:=idx+1;
 END LOOP;
 IF p_include_traffic THEN INSERT INTO public.tasks(agency_id,project_id,board_id,column_id,title,description,due_date,created_by,position)
 VALUES(c.agency_id,project,board,column_id,'[Tráfego Pago] Planejar mídia — '||client_name,'Definir objetivo, orçamento, público e peças aprovadas com a equipe. Não publica anúncios automaticamente.',c.month,auth.uid(),idx); END IF;
 UPDATE public.monthly_editorial_campaigns SET project_id=project,status='production',updated_at=now() WHERE id=c.id;
 RETURN project;
END; $$;
