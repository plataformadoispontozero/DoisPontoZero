-- Public agency site: additive structure approved for activation.
-- Additive: no changes to existing agency/auth/client/project records.
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.can_manage_public_site(p_agency_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agency_members m
    JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id
    JOIN public.agencies a ON a.id=m.agency_id
    WHERE m.user_id=auth.uid() AND m.agency_id=p_agency_id
      AND m.status='active' AND r.name='OWNER' AND a.status='active'
  );
$$;
REVOKE ALL ON FUNCTION private.can_manage_public_site(uuid) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_public_site(uuid) TO authenticated;

CREATE TABLE public.agency_public_sites (
  agency_id uuid PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  content jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(content)='object' AND octet_length(content::text)<=100000),
  published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_public_sites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_public_sites FROM anon, authenticated;
GRANT SELECT (slug,content,published) ON public.agency_public_sites TO anon;
GRANT SELECT, INSERT, UPDATE ON public.agency_public_sites TO authenticated;
GRANT ALL ON public.agency_public_sites TO service_role;
CREATE POLICY site_public_read ON public.agency_public_sites FOR SELECT TO anon USING (published);
CREATE POLICY site_authenticated_read ON public.agency_public_sites FOR SELECT TO authenticated
 USING (published OR private.can_manage_public_site(agency_id));
CREATE POLICY site_owner_insert ON public.agency_public_sites FOR INSERT TO authenticated
 WITH CHECK (private.can_manage_public_site(agency_id));
CREATE POLICY site_owner_update ON public.agency_public_sites FOR UPDATE TO authenticated
 USING (private.can_manage_public_site(agency_id)) WITH CHECK (private.can_manage_public_site(agency_id));

CREATE TABLE public.agency_site_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  phone text NOT NULL CHECK (length(phone) BETWEEN 10 AND 30),
  company text NOT NULL DEFAULT '' CHECK (length(company)<=160),
  services text[] NOT NULL CHECK (cardinality(services) BETWEEN 1 AND 5),
  objective text NOT NULL CHECK (length(objective) BETWEEN 15 AND 3000),
  budget text NOT NULL DEFAULT '' CHECK (length(budget)<=100),
  consent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id,request_id)
);
CREATE INDEX agency_site_leads_agency_created ON public.agency_site_leads(agency_id,created_at DESC);
CREATE INDEX agency_site_leads_email_created ON public.agency_site_leads(agency_id,lower(email),created_at DESC);
ALTER TABLE public.agency_site_leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_site_leads FROM anon, authenticated;
GRANT SELECT ON public.agency_site_leads TO authenticated;
GRANT ALL ON public.agency_site_leads TO service_role;
CREATE POLICY site_leads_owner_read ON public.agency_site_leads FOR SELECT TO authenticated
 USING (private.can_manage_public_site(agency_id));
-- No public direct inserts, updates or selects. Edge Function only, after CAPTCHA.
CREATE OR REPLACE FUNCTION public.receive_agency_site_lead(p_slug text,p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_agency_id uuid; v_id uuid; v_email text; v_request uuid;
BEGIN
  IF current_user <> 'service_role' THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF p_payload->>'consent' IS DISTINCT FROM 'true' OR coalesce(p_payload->>'website','')<>''
    OR jsonb_typeof(p_payload->'services') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid request' USING ERRCODE='22023';
  END IF;
  SELECT agency_id INTO v_agency_id FROM public.agency_public_sites WHERE slug=p_slug AND published FOR UPDATE;
  IF v_agency_id IS NULL THEN RAISE EXCEPTION 'Site unavailable' USING ERRCODE='22023'; END IF;
  v_email := lower(trim(p_payload->>'email')); v_request := (p_payload->>'requestId')::uuid;
  SELECT id INTO v_id FROM public.agency_site_leads WHERE agency_id=v_agency_id AND request_id=v_request;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  IF (SELECT count(*) FROM public.agency_site_leads WHERE agency_id=v_agency_id AND lower(email)=v_email AND created_at>now()-interval '1 hour')>=3
    OR (SELECT count(*) FROM public.agency_site_leads WHERE agency_id=v_agency_id AND created_at>now()-interval '1 hour')>=100 THEN
    RAISE EXCEPTION 'Rate limit reached' USING ERRCODE='P0001';
  END IF;
  INSERT INTO public.agency_site_leads(agency_id,request_id,name,email,phone,company,services,objective,budget)
  VALUES(v_agency_id,v_request,trim(p_payload->>'name'),v_email,trim(p_payload->>'phone'),coalesce(trim(p_payload->>'company'),''),
    ARRAY(SELECT jsonb_array_elements_text(p_payload->'services')),trim(p_payload->>'objective'),coalesce(p_payload->>'budget','')) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.receive_agency_site_lead(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_agency_site_lead(text,jsonb) TO service_role;

-- Separate public assets; never reuse private briefing/chat storage.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('agency-site-media','agency-site-media',true,2097152,ARRAY['image/jpeg','image/png','image/webp']);
CREATE POLICY site_media_owner_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='agency-site-media' AND EXISTS (
  SELECT 1 FROM public.agencies a WHERE a.id::text=(storage.foldername(name))[1] AND private.can_manage_public_site(a.id)
));
-- Public bucket serves only deliberately published media. No overwrite/delete granted.
-- Use unique paths. Retention and cleanup must be reviewed separately.
