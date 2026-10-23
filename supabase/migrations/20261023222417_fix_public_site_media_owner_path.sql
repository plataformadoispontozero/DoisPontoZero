-- Existing policy bound `name` to agencies.name inside the subquery, so legitimate
-- UUID-prefixed uploads were refused. Keep the bucket and owner-only scope.
ALTER POLICY site_media_owner_insert ON storage.objects
WITH CHECK (
  bucket_id = 'agency-site-media'
  AND EXISTS (
    SELECT 1 FROM public.agencies AS agency
    WHERE agency.id::text = (storage.foldername(storage.objects.name))[1]
      AND private.can_manage_public_site(agency.id)
  )
);
-- Source images up to 50 MiB are resized/converted in the browser. Stored WebP
-- files stay within the existing 2 MiB bucket limit. No limits or roles widened.
