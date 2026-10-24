-- Lists only need metadata and counts; keep copies/context out of repeated responses.
-- Invoker security preserves the underlying campaign RLS and tenant permissions.
CREATE VIEW public.editorial_campaign_summaries WITH (security_invoker=true) AS
SELECT id,agency_id,client_id,month,status,project_id,archived_at,created_at,
 CASE WHEN jsonb_typeof(items)='array' THEN jsonb_array_length(items) ELSE 0 END AS item_count
FROM public.monthly_editorial_campaigns;
REVOKE ALL ON public.editorial_campaign_summaries FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.editorial_campaign_summaries TO authenticated;
COMMENT ON VIEW public.editorial_campaign_summaries IS 'RLS-preserving editorial list metadata; full copies fetched only on demand.';
