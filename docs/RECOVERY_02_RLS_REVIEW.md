# Recovery 02 — revisão estática de RLS

Data: 11/10/2026. Status: revisão local PASS; isolamento real BLOCKED. Nenhuma policy remota alterada, RLS desativada ou migration aplicada.

## Evidências e riscos

| Local | Achado | Risco/ação necessária |
|---|---|---|
| migration 01, helpers linhas 248–305 | is_agency_member/is_agency_owner/has_agency_permission usam EXISTS por agency_id + auth.uid + status active | Suportam várias memberships no contrato local; confirmar definição, owner, EXECUTE e comportamento reais |
| migration 01, agency_members_update | Autoriza members.edit e não limita papel de destino/último OWNER em UPDATE | Possível promoção de privilégio/rebaixamento do último OWNER; exigir RPC administrativa transacional e constraints |
| migration 01, agency_members_delete | Subquery de contagem em agency_members sob policy | Verificar recursão e corrida entre remoções concorrentes; lock transacional necessário |
| migration 01, roles/role_permissions | Administradores permissions.manage podem modificar papéis; owner é especial pelo nome | Proteger papéis sistema/OWNER no servidor, não apenas checkbox |
| migration 08, linhas 305–354 | Policies de reuniões/chat usam agency_id = SELECT agency_id FROM profiles | Contrato incompatível: profiles não tem agency_id na migration inicial; nega ou falha/mapeia somente uma agência se remoto divergente |
| migrations 06/07 | FOR ALL por is_agency_member | Isolamento de agência não é autorização por ação; membro viewer não deve ganhar UPDATE/DELETE administrativos |
| RPCs SECURITY DEFINER posteriores | Nem todas fixam search_path ou revogam EXECUTE PUBLIC | Revisar cada assinatura, qualificação de objetos, auth.uid, acesso ao tenant e exposição anon |
| Storage | Policies de buckets privados não demonstradas pelo conjunto local | Testar uploads/downloads/URLs assinadas cruzadas por agência e expiração |
| Realtime | Subscriptions frontend existem; autorização efetiva não homologada | Testar A/B sem receber eventos privados de outro tenant; remover canais na troca/logout |
| Rotas públicas | Tokens próprios, independentes do login | Testar válido/expirado/revogado, status publicado, minimização do payload; RPC que grava evento é escrita, não leitura |

## Matriz integrada obrigatória em staging

Criar apenas com autorização contas descartáveis A (agência A), B (B), C (A+B), sem vínculo e vínculo suspenso. Para cada relação privada, testar SELECT/INSERT/UPDATE/DELETE como A em A (permitido conforme papel), A em B (negado), B em A (negado), C em ambos (conforme papéis), usuário sem vínculo/inativo (negado). Testar também role externo, mudança de agency_id/role_id, elevação a OWNER, remoção/rebaixamento concorrente do último OWNER, RPCs administrativas sem permissão, Storage e Realtime.

Resultados atuais desses testes: BLOCKED — não há staging isolado e contas autorizadas. Respostas simuladas do Playwright verificam o cliente; não homologam políticas do PostgreSQL. Exportar pg_policies, pg_proc/privilégios, constraints, triggers, buckets e histórico de migrations sem dados privados. Não executar db push/reset no projeto pvkhlobsiszrjtblpruu.
