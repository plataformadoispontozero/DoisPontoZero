-- DRAFT / NOT_RUN: aplicar somente em staging após reconciliação e autorização.
-- Não está em migrations: não será aplicado por db push.
-- Contrato local: agencies.id, agency_members.{id,agency_id,user_id,role_id,status},
-- roles.{id,agency_id,name}, is_agency_owner(uuid).
-- Restrição intencional: apenas OWNER muda papel de membro não-OWNER.
-- Transferência/remoção de OWNER exige operação separada e não é oferecida aqui.
BEGIN;
CREATE OR REPLACE FUNCTION public.manage_agency_member_role(
  p_agency_id uuid, p_member_id uuid, p_role_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE v_current_role text; v_new_role text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_agency_owner(p_agency_id) THEN
    RAISE EXCEPTION 'Operação não autorizada' USING ERRCODE = '42501';
  END IF;
  -- Serializa alterações de papéis pela agência. Todos os caminhos de escrita
  -- deverão usar o mesmo lock; políticas atuais ainda precisam ser reconciliadas.
  PERFORM 1 FROM public.agencies WHERE id = p_agency_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Agência não encontrada'; END IF;
  IF NOT public.is_agency_owner(p_agency_id) THEN
    RAISE EXCEPTION 'Operação não autorizada' USING ERRCODE = '42501';
  END IF;
  SELECT r.name INTO v_current_role
    FROM public.agency_members m JOIN public.roles r ON r.id = m.role_id AND r.agency_id = m.agency_id
    WHERE m.id = p_member_id AND m.agency_id = p_agency_id AND m.status = 'active'
    FOR UPDATE OF m;
  IF NOT FOUND THEN RAISE EXCEPTION 'Membro ativo não encontrado'; END IF;
  IF v_current_role = 'OWNER' THEN RAISE EXCEPTION 'OWNER requer operação específica'; END IF;
  SELECT name INTO v_new_role FROM public.roles
    WHERE id = p_role_id AND agency_id = p_agency_id FOR SHARE;
  IF NOT FOUND OR v_new_role = 'OWNER' THEN RAISE EXCEPTION 'Papel não permitido'; END IF;
  UPDATE public.agency_members SET role_id = p_role_id
    WHERE id = p_member_id AND agency_id = p_agency_id;
  RETURN p_member_id;
END;
$$;
REVOKE ALL ON FUNCTION public.manage_agency_member_role(uuid,uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_agency_member_role(uuid,uuid,uuid) TO authenticated;
COMMIT;
-- Gate ainda obrigatório: bloquear UPDATE direto em role_id para impedir bypass,
-- auditar owner da função, políticas/roles/helpers e registrar eventos sem credenciais.
-- Este rascunho sozinho NÃO torna a administração de membros operacional.
