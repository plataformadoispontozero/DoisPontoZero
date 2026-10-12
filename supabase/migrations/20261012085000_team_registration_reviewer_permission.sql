-- Review registrations independently from generic membership editing.
INSERT INTO public.permissions(permission_key,module,description)
VALUES('members.registration.review','members','Revisar solicitações de cadastro da equipe')
ON CONFLICT(permission_key) DO NOTHING;
INSERT INTO public.role_permissions(role_id,permission_id,allowed)
SELECT r.id,p.id,true FROM public.roles r JOIN public.agencies a ON a.id=r.agency_id CROSS JOIN public.permissions p
WHERE r.name IN('ADMIN','MANAGER') AND a.status='active' AND p.permission_key='members.registration.review'
ON CONFLICT(role_id,permission_id) DO UPDATE SET allowed=true;
CREATE OR REPLACE FUNCTION private.can_review_registration(p_agency uuid,p_actor uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_actor IS NOT NULL AND EXISTS(
 SELECT 1 FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id
 JOIN public.agencies a ON a.id=m.agency_id
 WHERE m.agency_id=p_agency AND m.user_id=p_actor AND m.status='active' AND a.status='active'
 AND r.name IN('OWNER','ADMIN','MANAGER')
 AND (r.name='OWNER' OR EXISTS(SELECT 1 FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE rp.role_id=r.id AND rp.allowed AND p.permission_key='members.registration.review')));
$$;
REVOKE ALL ON FUNCTION private.can_review_registration(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.can_review_registration(uuid,uuid) TO authenticated,service_role;
