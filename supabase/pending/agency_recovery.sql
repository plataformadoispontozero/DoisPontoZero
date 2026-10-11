-- DRAFT: reconcile remote schema/history, review and test in isolated staging BEFORE application.
-- Not in migrations/: cannot be picked up automatically by db push.
BEGIN;

CREATE OR REPLACE FUNCTION public.set_agency_role_permissions(p_agency_id uuid, p_changes jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE change jsonb; role_record record; permission_id_value uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_agency_permission(p_agency_id, 'permissions.manage') THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_changes) <> 'array' OR jsonb_array_length(p_changes) > 5000 THEN
    RAISE EXCEPTION 'Invalid permission matrix';
  END IF;
  -- Lock tenant roles so a concurrent role change cannot bypass the OWNER checks.
  PERFORM 1 FROM public.roles WHERE agency_id = p_agency_id ORDER BY id FOR UPDATE;
  FOR change IN SELECT value FROM jsonb_array_elements(p_changes) LOOP
    SELECT * INTO role_record FROM public.roles
      WHERE id = (change->>'role_id')::uuid AND agency_id = p_agency_id;
    IF NOT FOUND OR role_record.name = 'OWNER' THEN
      RAISE EXCEPTION 'Role unavailable or protected';
    END IF;
    SELECT id INTO permission_id_value FROM public.permissions WHERE id = (change->>'permission_id')::uuid;
    IF NOT FOUND OR jsonb_typeof(change->'allowed') <> 'boolean' THEN RAISE EXCEPTION 'Invalid permission'; END IF;
    INSERT INTO public.role_permissions(role_id, permission_id, allowed)
      VALUES(role_record.id, permission_id_value, (change->>'allowed')::boolean)
      ON CONFLICT(role_id, permission_id) DO UPDATE SET allowed = EXCLUDED.allowed;
  END LOOP;
  INSERT INTO public.audit_logs(agency_id, actor_user_id, action, entity_type, metadata)
    VALUES(p_agency_id, auth.uid(), 'permissions.updated', 'role_permissions', jsonb_build_object('changes', jsonb_array_length(p_changes)));
END $$;
REVOKE ALL ON FUNCTION public.set_agency_role_permissions(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_agency_role_permissions(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_agency_meeting(p_agency_id uuid, p_meeting jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE result public.meetings; participant jsonb; participant_user uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_agency_permission(p_agency_id, 'meetings.create') THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  IF NULLIF(btrim(p_meeting->>'title'), '') IS NULL THEN RAISE EXCEPTION 'Title required'; END IF;
  IF NULLIF(p_meeting->>'client_id', '') IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.clients WHERE id = (p_meeting->>'client_id')::uuid AND agency_id = p_agency_id
  ) THEN RAISE EXCEPTION 'Invalid client'; END IF;
  IF NULLIF(p_meeting->>'project_id', '') IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.projects WHERE id = (p_meeting->>'project_id')::uuid AND agency_id = p_agency_id AND public.can_access_project(id)
  ) THEN RAISE EXCEPTION 'Invalid project'; END IF;
  INSERT INTO public.meetings(agency_id, client_id, project_id, title, description, meeting_type,
    starts_at, ends_at, timezone, location_type, location_text, meeting_url, organizer_id, created_by)
  VALUES(p_agency_id, NULLIF(p_meeting->>'client_id','')::uuid, NULLIF(p_meeting->>'project_id','')::uuid,
    btrim(p_meeting->>'title'), p_meeting->>'description', p_meeting->>'meeting_type',
    (p_meeting->>'starts_at')::timestamptz, (p_meeting->>'ends_at')::timestamptz,
    COALESCE(p_meeting->>'timezone','UTC'), p_meeting->>'location_type', p_meeting->>'location_text',
    NULLIF(p_meeting->>'meeting_url',''), auth.uid(), auth.uid()) RETURNING * INTO result;
  FOR participant IN SELECT value FROM jsonb_array_elements(COALESCE(p_meeting->'participants', '[]'::jsonb)) LOOP
    participant_user := NULLIF(participant->>'user_id','')::uuid;
    IF participant->>'participant_type' = 'internal' AND NOT EXISTS(
      SELECT 1 FROM public.agency_members WHERE user_id = participant_user AND agency_id = p_agency_id AND status = 'active'
    ) THEN RAISE EXCEPTION 'Invalid participant'; END IF;
    INSERT INTO public.meeting_participants(agency_id, meeting_id, user_id, external_name, external_email, participant_type)
      VALUES(p_agency_id, result.id, participant_user, participant->>'external_name', participant->>'external_email', participant->>'participant_type');
  END LOOP;
  INSERT INTO public.meeting_activity(agency_id, meeting_id, actor_user_id, action)
    VALUES(p_agency_id, result.id, auth.uid(), 'meeting.created');
  RETURN to_jsonb(result);
END $$;
REVOKE ALL ON FUNCTION public.create_agency_meeting(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_agency_meeting(uuid,jsonb) TO authenticated;

-- Correct the known task contract mismatch; requires schema/history reconciliation first.
CREATE OR REPLACE FUNCTION public.convert_action_item_to_task(
  p_action_item_id uuid, p_project_id uuid, p_assigned_to uuid DEFAULT NULL, p_due_at timestamptz DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE item public.meeting_action_items; board_id_value uuid; column_id_value uuid; task_id_value uuid;
BEGIN
  SELECT * INTO item FROM public.meeting_action_items WHERE id = p_action_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Action item unavailable'; END IF;
  IF auth.uid() IS NULL OR NOT public.has_agency_permission(item.agency_id, 'meetings.edit')
    OR NOT public.has_agency_permission(item.agency_id, 'tasks.create')
    OR NOT EXISTS(SELECT 1 FROM public.projects WHERE id = p_project_id AND agency_id = item.agency_id AND public.can_access_project(id))
    THEN RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501'; END IF;
  IF item.status = 'converted' AND item.task_id IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM public.tasks WHERE id = item.task_id AND project_id = p_project_id) THEN RAISE EXCEPTION 'Action already converted to another project'; END IF;
    RETURN item.task_id;
  END IF;
  IF item.status <> 'pending' THEN RAISE EXCEPTION 'Action item cannot be converted'; END IF;
  SELECT b.id, c.id INTO board_id_value, column_id_value FROM public.project_boards b
    JOIN public.board_columns c ON c.board_id = b.id AND c.agency_id = b.agency_id
    WHERE b.project_id = p_project_id AND b.agency_id = item.agency_id AND c.category = 'backlog'
    ORDER BY b.created_at, c.position, c.id LIMIT 1;
  IF board_id_value IS NULL OR column_id_value IS NULL THEN RAISE EXCEPTION 'Project backlog unavailable'; END IF;
  IF p_assigned_to IS NOT NULL AND (NOT public.has_agency_permission(item.agency_id, 'tasks.assign') OR NOT EXISTS(
    SELECT 1 FROM public.agency_members WHERE agency_id = item.agency_id AND user_id = p_assigned_to AND status = 'active'
  )) THEN RAISE EXCEPTION 'Assignee unavailable' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.tasks(agency_id, project_id, board_id, column_id, title, description, status, priority, due_date, created_by)
    VALUES(item.agency_id, p_project_id, board_id_value, column_id_value, item.title, item.description,
      'open', 'normal', (COALESCE(p_due_at,item.due_at) AT TIME ZONE 'UTC')::date, auth.uid()) RETURNING id INTO task_id_value;
  IF p_assigned_to IS NOT NULL THEN
    INSERT INTO public.task_assignees(agency_id, task_id, user_id) VALUES(item.agency_id, task_id_value, p_assigned_to);
  END IF;
  UPDATE public.meeting_action_items SET task_id = task_id_value, status = 'converted', updated_at = now() WHERE id = item.id;
  INSERT INTO public.meeting_activity(agency_id, meeting_id, actor_user_id, action, metadata)
    VALUES(item.agency_id, item.meeting_id, auth.uid(), 'action.converted', jsonb_build_object('task_id',task_id_value));
  RETURN task_id_value;
END $$;
REVOKE ALL ON FUNCTION public.convert_action_item_to_task(uuid,uuid,uuid,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_action_item_to_task(uuid,uuid,uuid,timestamptz) TO authenticated;
COMMIT;
