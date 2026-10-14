-- Initialize system defaults only where records are missing; never overwrite saved settings.
INSERT INTO public.agency_preferences(agency_id) SELECT id FROM public.agencies WHERE status='active' ON CONFLICT(agency_id) DO NOTHING;
INSERT INTO public.agency_document_settings(agency_id,footer_text,show_watermark) SELECT id,'',false FROM public.agencies WHERE status='active' ON CONFLICT(agency_id) DO NOTHING;
INSERT INTO public.agency_portal_settings(agency_id,portal_title,welcome_message,footer_text,contact_email,website_url) SELECT id,'Portal do cliente','','','','' FROM public.agencies WHERE status='active' ON CONFLICT(agency_id) DO NOTHING;
