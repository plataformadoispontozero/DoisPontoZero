ALTER TABLE public.agency_branding ADD COLUMN contact_email text NOT NULL DEFAULT '', ADD COLUMN contact_phone text NOT NULL DEFAULT '', ADD COLUMN website_url text NOT NULL DEFAULT '', ADD COLUMN business_hours text NOT NULL DEFAULT '';
CREATE FUNCTION private.save_agency_identity(a uuid,b jsonb,p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE brand public.agency_branding; prefs public.agency_preferences;
BEGIN
 IF NOT private.can_editorial(a,'settings.edit') OR NOT private.can_editorial(a,'branding.edit') THEN RAISE EXCEPTION 'Sem permissão para editar a agência' USING errcode='42501'; END IF;
 IF b IS NULL OR p IS NULL OR jsonb_typeof(b)<>'object' OR jsonb_typeof(p)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(b))<>7 OR (SELECT count(*) FROM jsonb_object_keys(p))<>4 OR EXISTS(SELECT 1 FROM jsonb_object_keys(b) k WHERE k NOT IN ('display_name','legal_name','tagline','contact_email','contact_phone','website_url','business_hours')) OR EXISTS(SELECT 1 FROM jsonb_object_keys(p) k WHERE k NOT IN ('language','timezone','currency','date_format')) THEN RAISE EXCEPTION 'Campos inválidos';END IF;
 IF length(btrim(coalesce(b->>'display_name',''))) NOT BETWEEN 1 AND 200 OR length(btrim(coalesce(b->>'legal_name',''))) NOT BETWEEN 1 AND 300 OR length(coalesce(b->>'tagline',''))>500 OR length(coalesce(b->>'contact_phone',''))>80 OR length(coalesce(b->>'contact_email',''))>254 OR length(coalesce(b->>'business_hours',''))>500 OR length(coalesce(b->>'website_url',''))>2048 OR (coalesce(b->>'website_url','')<>'' AND b->>'website_url' !~ '^https?://[^[:space:]]+$') THEN RAISE EXCEPTION 'Dados institucionais inválidos';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name=p->>'timezone') OR p->>'language' NOT IN ('pt-BR','en-US','es-ES') OR p->>'currency' NOT IN ('BRL','USD','EUR') OR p->>'date_format' NOT IN ('DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD') THEN RAISE EXCEPTION 'Preferências inválidas';END IF;
 UPDATE public.agency_branding SET display_name=b->>'display_name',legal_name=b->>'legal_name',tagline=b->>'tagline',contact_email=b->>'contact_email',contact_phone=b->>'contact_phone',website_url=b->>'website_url',business_hours=b->>'business_hours' WHERE agency_id=a RETURNING * INTO brand;
 IF NOT FOUND THEN RAISE EXCEPTION 'Configurações da agência não encontradas';END IF;
 UPDATE public.agency_preferences SET language=p->>'language',timezone=p->>'timezone',currency=p->>'currency',date_format=p->>'date_format' WHERE agency_id=a RETURNING * INTO prefs;
 IF NOT FOUND THEN RAISE EXCEPTION 'Preferências da agência não encontradas';END IF;
 RETURN jsonb_build_object('branding',to_jsonb(brand),'preferences',to_jsonb(prefs));
END;$$;
CREATE FUNCTION public.save_agency_identity(p_agency uuid,p_branding jsonb,p_preferences jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.save_agency_identity(p_agency,p_branding,p_preferences)$$;
REVOKE ALL ON FUNCTION private.save_agency_identity(uuid,jsonb,jsonb),public.save_agency_identity(uuid,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.save_agency_identity(uuid,jsonb,jsonb),public.save_agency_identity(uuid,jsonb,jsonb) TO authenticated;
