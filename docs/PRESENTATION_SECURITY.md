# DOIS.ZERO — Presentation Security & Public Link Access Control

Especificação de segurança e isolamento RLS para apresentações e links de visualização pública no **Dois.Zero Creative Agency OS**.

---

## 1. Políticas de Row Level Security (RLS)

Todas as tabelas da Fase 09 utilizam RLS rigoroso baseado em `agency_id`:

```sql
-- Exemplo de política de leitura restrita à agência
CREATE POLICY "Admins e Membros da Agência podem ver apresentações"
ON presentations FOR SELECT
TO authenticated
USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));
```

---

## 2. Acesso Público via Links Tokenizados (`public_token`)

Para permitir que clientes finais visualizem showcases e relatórios mensais sem precisar criar uma conta de usuário no Supabase Auth:

1. É gerado um `public_token` único de alta entropia (ex: `showcase_acme_2026_secure`).
2. A política RLS permite leitura pública da apresentação **APENAS** através da função segura RPC `get_public_showcase(p_token)`:

```sql
CREATE OR REPLACE FUNCTION get_public_showcase(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pres record;
  v_sections jsonb;
  v_assets jsonb;
BEGIN
  SELECT * INTO v_pres FROM presentations WHERE public_token = p_token AND status = 'published';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Presentation not found or not published');
  END IF;

  SELECT jsonb_agg(s ORDER BY s.position) INTO v_sections FROM presentation_sections s WHERE s.presentation_id = v_pres.id;
  SELECT jsonb_agg(a ORDER BY a.position) INTO v_assets FROM presentation_assets a WHERE a.presentation_id = v_pres.id;

  -- Registra log de visualização
  INSERT INTO presentation_views (agency_id, presentation_id, viewer_ip, user_agent)
  VALUES (v_pres.agency_id, v_pres.id, current_setting('request.headers', true)::json->>'x-forwarded-for', current_setting('request.headers', true)::json->>'user-agent');

  RETURN jsonb_build_object('presentation', to_jsonb(v_pres), 'sections', COALESCE(v_sections, '[]'::jsonb), 'assets', COALESCE(v_assets, '[]'::jsonb));
END;
$$;
$$;
```

---

## 3. Log Auditável de Acessos (`presentation_views` & `presentation_activity`)

- **`presentation_views`**: Registra data/hora, IP e User-Agent de cada visualização pública do cliente.
- **`presentation_activity`**: Registra criações, alterações de seções, reordenações, publicações e exportações de PDF.
