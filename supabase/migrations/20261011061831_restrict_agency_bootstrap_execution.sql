-- APLICADO via MCP no projeto pvkhlobsiszrjtblpruu.
-- Histórico remoto: 20261011061831 restrict_agency_bootstrap_execution.
-- Espelho SQL para revisão; não reaplicar via db push.
REVOKE EXECUTE ON FUNCTION public.bootstrap_agency(text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_agency(text, text, uuid)
  TO service_role;
