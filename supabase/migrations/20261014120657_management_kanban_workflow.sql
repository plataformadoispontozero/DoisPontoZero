-- Grant global project visibility to current management roles, preserving professional project membership.
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.projects p WHERE p.id=p_project_id AND public.is_agency_member(p.agency_id) AND (
 public.is_agency_owner(p.agency_id) OR EXISTS(SELECT 1 FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id WHERE m.agency_id=p.agency_id AND m.user_id=auth.uid() AND m.status='active' AND r.name IN ('ADMIN','MANAGER') AND public.has_agency_permission(p.agency_id,'projects.view')) OR
 EXISTS(SELECT 1 FROM public.project_members pm WHERE pm.project_id=p.id AND pm.agency_id=p.agency_id AND pm.user_id=auth.uid()) OR p.created_by=auth.uid()));
$$;
-- Keep the previous endpoint as a private historical implementation; browser uses one unambiguous paged signature.
ALTER FUNCTION public.get_management_kanban(uuid) SET SCHEMA private;
ALTER FUNCTION private.get_management_kanban(uuid) RENAME TO legacy_management_kanban;
REVOKE ALL ON FUNCTION private.legacy_management_kanban(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.get_management_kanban(p_agency_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 100) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id WHERE m.agency_id=p_agency_id AND m.user_id=auth.uid() AND m.status='active' AND r.name IN ('OWNER','ADMIN','MANAGER')) OR NOT coalesce(public.has_agency_permission(p_agency_id,'tasks.view'),false) OR NOT coalesce(public.has_agency_permission(p_agency_id,'projects.view'),false) THEN RAISE EXCEPTION 'Kanban geral restrito à gestão da agência' USING errcode='42501';END IF;
 IF p_offset IS NULL OR p_limit IS NULL OR p_offset<0 OR p_limit NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Página inválida';END IF;
 SELECT jsonb_build_object('tasks',coalesce(jsonb_agg(row_data ORDER BY due_date NULLS LAST,id) FILTER(WHERE n<=p_limit),'[]'::jsonb),'has_more',coalesce(bool_or(n>p_limit),false),'next_offset',p_offset+p_limit) INTO result
 FROM (SELECT t.id,t.due_date,row_number() OVER(ORDER BY t.due_date NULLS LAST,t.id)-p_offset n,
 to_jsonb(t)||jsonb_build_object('project',jsonb_build_object('id',p.id,'name',p.name,'client_id',p.client_id,'client',CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('id',c.id,'name',c.name) END),'column',to_jsonb(b),
 'available_columns',coalesce((SELECT jsonb_agg(to_jsonb(bc) ORDER BY bc.position,bc.id) FROM public.board_columns bc WHERE bc.board_id=t.board_id AND bc.agency_id=p_agency_id),'[]'::jsonb),
 'assignees',coalesce((SELECT jsonb_agg(to_jsonb(ta)||jsonb_build_object('profile',jsonb_build_object('id',pr.id,'full_name',pr.full_name,'avatar_url',pr.avatar_url)) ORDER BY ta.user_id) FROM public.task_assignees ta LEFT JOIN public.profiles pr ON pr.id=ta.user_id WHERE ta.task_id=t.id AND ta.agency_id=p_agency_id),'[]'::jsonb)) row_data
 FROM public.tasks t JOIN public.projects p ON p.id=t.project_id AND p.agency_id=p_agency_id
 LEFT JOIN public.clients c ON c.id=p.client_id AND c.agency_id=p_agency_id
 LEFT JOIN public.board_columns b ON b.id=t.column_id AND b.agency_id=p_agency_id
 WHERE t.agency_id=p_agency_id AND t.archived_at IS NULL AND t.status<>'archived' AND t.parent_task_id IS NULL AND p.archived_at IS NULL
 ORDER BY t.due_date NULLS LAST,t.id OFFSET p_offset LIMIT p_limit+1) page;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.get_management_kanban(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_management_kanban(uuid,integer,integer) TO authenticated;
