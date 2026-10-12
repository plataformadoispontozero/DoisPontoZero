CREATE OR REPLACE FUNCTION public.create_team_invitation(p_agency uuid,p_email text,p_role uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_email text:=lower(trim(p_email)); v_role text;
BEGIN
 IF NOT private.can_editorial(p_agency,'members.invite') THEN RAISE EXCEPTION 'Sem permissão para convidar.' USING ERRCODE='42501'; END IF;
 SELECT name INTO v_role FROM public.roles WHERE id=p_role AND agency_id=p_agency;
 IF v_role IS NULL OR v_role='OWNER' THEN RAISE EXCEPTION 'Papel inválido para esta agência.'; END IF;
 IF v_role='ADMIN' AND NOT public.is_agency_owner(p_agency) THEN RAISE EXCEPTION 'Somente o proprietário pode atribuir Administrador.'; END IF;
 IF v_email IS NULL OR length(v_email)>254 OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'E-mail inválido.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_agency::text||v_email,0));
 IF EXISTS(SELECT 1 FROM public.agency_members m JOIN auth.users u ON u.id=m.user_id WHERE m.agency_id=p_agency AND lower(u.email)=v_email) THEN RAISE EXCEPTION 'Este usuário já possui vínculo com a agência.'; END IF;
 IF (SELECT count(*) FROM public.agency_invitations WHERE agency_id=p_agency AND created_at>now()-interval '1 hour')>=30 THEN RAISE EXCEPTION 'Limite de convites atingido. Tente mais tarde.'; END IF;
 UPDATE public.agency_invitations SET revoked_at=now() WHERE agency_id=p_agency AND lower(email)=v_email AND accepted_at IS NULL AND revoked_at IS NULL;
 INSERT INTO public.agency_invitations(agency_id,email,role_id,invited_by,token_hash,expires_at) VALUES(p_agency,v_email,p_role,auth.uid(),encode(sha256(convert_to(gen_random_uuid()::text||gen_random_uuid()::text,'UTF8')),'hex'),now()+interval '1 hour') RETURNING id INTO v_id;
 RETURN v_id;
END; $$;
CREATE OR REPLACE FUNCTION public.team_invitation_auth_target(p_email text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('id',id,'confirmed',email_confirmed_at IS NOT NULL,'invited',invited_at IS NOT NULL) FROM auth.users WHERE lower(email)=lower(trim(p_email)) LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE i public.agency_invitations; v_email text; v_existing public.agency_members;
BEGIN
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF auth.uid() IS NULL OR v_email IS NULL THEN RAISE EXCEPTION 'Entre com a conta confirmada do convidado.' USING ERRCODE='42501'; END IF;
 SELECT * INTO i FROM public.agency_invitations WHERE id=p_id AND lower(email)=v_email FOR UPDATE;
 IF i.id IS NULL OR i.revoked_at IS NOT NULL OR i.expires_at<=now() THEN RAISE EXCEPTION 'Convite expirado, revogado ou destinado a outro e-mail.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.roles r JOIN public.agencies a ON a.id=r.agency_id WHERE r.id=i.role_id AND r.agency_id=i.agency_id AND r.name<>'OWNER' AND a.status='active') THEN RAISE EXCEPTION 'Agência ou papel indisponível.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(i.agency_id::text||auth.uid()::text,1));
 SELECT * INTO v_existing FROM public.agency_members WHERE agency_id=i.agency_id AND user_id=auth.uid();
 IF v_existing.id IS NOT NULL AND (v_existing.status<>'active' OR i.accepted_at IS NULL) THEN RAISE EXCEPTION 'Vínculo já existente; solicite revisão ao administrador.'; END IF;
 IF v_existing.id IS NULL THEN
  INSERT INTO public.profiles(id,full_name) VALUES(auth.uid(),split_part(v_email,'@',1)) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.agency_members(agency_id,user_id,role_id,status) VALUES(i.agency_id,auth.uid(),i.role_id,'active');
 END IF;
 UPDATE public.agency_invitations SET accepted_at=coalesce(accepted_at,now()) WHERE id=i.id;
 RETURN i.agency_id;
END; $$;
CREATE OR REPLACE FUNCTION public.revoke_team_invitation(p_id uuid,p_agency uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT private.can_editorial(p_agency,'members.invite') AND NOT private.can_editorial(p_agency,'members.edit') THEN RAISE EXCEPTION 'Sem permissão.' USING ERRCODE='42501'; END IF;
 UPDATE public.agency_invitations SET revoked_at=now() WHERE id=p_id AND agency_id=p_agency AND accepted_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Convite não encontrado ou já aceito.'; END IF;
 RETURN p_id;
END; $$;
CREATE OR REPLACE FUNCTION public.update_team_member_role(p_id uuid,p_agency uuid,p_role uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_role text; old_role text;
BEGIN
 IF NOT private.can_editorial(p_agency,'members.edit') THEN RAISE EXCEPTION 'Sem permissão.' USING ERRCODE='42501'; END IF;
 SELECT name INTO v_role FROM public.roles WHERE id=p_role AND agency_id=p_agency;
 SELECT r.name INTO old_role FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id WHERE m.id=p_id AND m.agency_id=p_agency FOR UPDATE OF m;
 IF v_role IS NULL OR old_role IS NULL OR v_role='OWNER' OR old_role='OWNER' THEN RAISE EXCEPTION 'Papel inválido ou proprietário protegido.'; END IF;
 IF (v_role='ADMIN' OR old_role='ADMIN') AND NOT public.is_agency_owner(p_agency) THEN RAISE EXCEPTION 'Somente o proprietário administra este papel.'; END IF;
 UPDATE public.agency_members SET role_id=p_role WHERE id=p_id AND agency_id=p_agency;
 RETURN true;
END; $$;
REVOKE INSERT,UPDATE,DELETE ON public.agency_invitations,public.agency_members FROM authenticated,anon;
REVOKE ALL ON FUNCTION public.create_team_invitation(uuid,text,uuid),public.accept_team_invitation(uuid),public.revoke_team_invitation(uuid,uuid),public.update_team_member_role(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_team_invitation(uuid,text,uuid),public.accept_team_invitation(uuid),public.revoke_team_invitation(uuid,uuid),public.update_team_member_role(uuid,uuid,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.team_invitation_auth_target(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.team_invitation_auth_target(text) TO service_role;
DROP POLICY IF EXISTS agency_invitations_select ON public.agency_invitations;
CREATE POLICY agency_invitations_select ON public.agency_invitations FOR SELECT TO authenticated USING(private.can_editorial(agency_id,'members.view') OR private.can_editorial(agency_id,'members.invite'));
CREATE INDEX IF NOT EXISTS agency_invites_agency_time ON public.agency_invitations(agency_id,created_at);
