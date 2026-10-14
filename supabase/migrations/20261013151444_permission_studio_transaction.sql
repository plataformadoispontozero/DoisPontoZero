CREATE FUNCTION private.set_agency_role_permissions(p_agency_id uuid,p_changes jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item jsonb;
BEGIN
 IF NOT private.can_editorial(p_agency_id,'permissions.manage') THEN RAISE EXCEPTION 'Permissão administrativa necessária' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_changes) IS DISTINCT FROM 'array' OR jsonb_array_length(p_changes) NOT BETWEEN 1 AND 10000 OR octet_length(p_changes::text)>1000000 THEN RAISE EXCEPTION 'Matriz inválida';END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_changes) LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR jsonb_typeof(item->'allowed') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Matriz inválida'; END IF;
 END LOOP;
 -- UUIDs are case-insensitive: validate duplicate identities after canonical casting.
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_changes) e GROUP BY (e->>'role_id')::uuid,(e->>'permission_id')::uuid HAVING count(*)>1) THEN RAISE EXCEPTION 'Permissão duplicada'; END IF;
 PERFORM 1 FROM public.agencies WHERE id=p_agency_id FOR UPDATE;
 -- A permission may have been revoked while this transaction waited for the agency lock.
 IF NOT private.can_editorial(p_agency_id,'permissions.manage') THEN RAISE EXCEPTION 'Permissão administrativa necessária' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.roles r WHERE r.agency_id=p_agency_id AND r.id IN(SELECT (e->>'role_id')::uuid FROM jsonb_array_elements(p_changes) e) ORDER BY r.id FOR UPDATE;
 -- Validate tenant and OWNER while the actual role rows are locked.
 FOR item IN SELECT value FROM jsonb_array_elements(p_changes) LOOP
  IF NOT EXISTS(SELECT 1 FROM public.roles r WHERE r.id=(item->>'role_id')::uuid AND r.agency_id=p_agency_id AND r.name<>'OWNER')
   OR NOT EXISTS(SELECT 1 FROM public.permissions p WHERE p.id=(item->>'permission_id')::uuid) THEN RAISE EXCEPTION 'Papel ou permissão inválida; OWNER protegido'; END IF;
 END LOOP;
 INSERT INTO public.role_permissions(role_id,permission_id,allowed)
 SELECT (e->>'role_id')::uuid,(e->>'permission_id')::uuid,(e->>'allowed')::boolean FROM jsonb_array_elements(p_changes) e
 ON CONFLICT(role_id,permission_id) DO UPDATE SET allowed=excluded.allowed;
END $$;
REVOKE ALL ON FUNCTION private.set_agency_role_permissions(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.set_agency_role_permissions(uuid,jsonb) TO authenticated;
CREATE FUNCTION public.set_agency_role_permissions(p_agency_id uuid,p_changes jsonb) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.set_agency_role_permissions(p_agency_id,p_changes);$$;
REVOKE ALL ON FUNCTION public.set_agency_role_permissions(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_agency_role_permissions(uuid,jsonb) TO authenticated;
