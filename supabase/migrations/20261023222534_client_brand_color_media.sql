-- Optional client-level brand accent; no profile JSON rewrite or role changes.
ALTER TABLE public.clients ADD COLUMN brand_color text;
ALTER TABLE public.clients ADD CONSTRAINT clients_brand_color_hex6 CHECK(brand_color IS NULL OR brand_color ~ '^#[0-9A-Fa-f]{6}$');

-- Only authorized, intentionally public logos belong in this bucket.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('client-brand-media','client-brand-media',true,5242880,ARRAY['image/png','image/jpeg','image/webp']);

CREATE POLICY client_brand_media_public_read ON storage.objects FOR SELECT TO anon,authenticated
USING(bucket_id='client-brand-media');

CREATE POLICY client_brand_media_editor_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK(
 bucket_id='client-brand-media'
 AND name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(png|jpg|jpeg|webp)$'
 AND EXISTS(SELECT 1 FROM public.clients c WHERE c.agency_id::text=split_part(storage.objects.name,'/',1) AND c.id::text=split_part(storage.objects.name,'/',2) AND private.can_editorial(c.agency_id,'clients.edit'))
);

CREATE POLICY client_brand_media_editor_delete ON storage.objects FOR DELETE TO authenticated
USING(
 bucket_id='client-brand-media'
 AND EXISTS(SELECT 1 FROM public.clients c WHERE c.agency_id::text=split_part(storage.objects.name,'/',1) AND c.id::text=split_part(storage.objects.name,'/',2) AND private.can_editorial(c.agency_id,'clients.edit'))
);
-- No UPDATE policy: replacement uses a fresh UUID and upload({upsert:false}).

-- Official agency logo/icon assets are public brand images, never private documents.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('agency-brand-media','agency-brand-media',true,2097152,ARRAY['image/png','image/jpeg','image/webp']);

CREATE POLICY agency_brand_media_public_read ON storage.objects FOR SELECT TO anon,authenticated
USING(bucket_id='agency-brand-media');

CREATE POLICY agency_brand_media_editor_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK(
 bucket_id='agency-brand-media'
 AND name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(png|jpg|jpeg|webp)$'
 AND EXISTS(SELECT 1 FROM public.agencies a WHERE a.id::text=split_part(storage.objects.name,'/',1) AND private.can_editorial(a.id,'branding.edit'))
);
-- No UPDATE/DELETE policy: replacements use a fresh UUID; no remote asset is removed here.
