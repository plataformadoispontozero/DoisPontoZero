# Exclusão definitiva de calendário e operação ativa

## Contrato

`delete_editorial_campaign_permanently(p_agency uuid,p_campaign uuid,p_confirmation text) -> boolean`.

- Autenticação e permissão existente `strategy.delete` obrigatórias; escopo exato agência/calendário.
- Confirmação digitada exata: `Nome do cliente · MM/YYYY`, conferida novamente no servidor.
- Bloqueia `project_id` preenchido ou status `production`; não exclui projetos, demandas, briefing, cliente ou arquivos Drive/Storage.
- Remove definitivamente os registros pertencentes ao calendário: avaliações, links, registro de ideias e versões, depois calendário. Operação transacional e auditoria global `editorial.permanently_deleted` preservada sem conteúdo privado completo.
- Não exige arquivamento prévio. Cancelar ou errar confirmação não chama exclusão.
- Outras relações/FKs desconhecidas bloqueiam a transação; não são removidas silenciosamente.

## Interface e listas

- Arquivar continua recuperável e recebeu rótulo explícito `Arquivar calendário`; não é exclusão.
- Exclusão é uma ação separada `Excluir definitivamente`, exige `strategy.delete` e confirmação digitada.
- Calendários em produção exibem bloqueio; o servidor é a autoridade final.
- Calendário consulta Ativos/Arquivados no servidor antes do limite de 50 registros; tags deixam o estado explícito.
- Social Media consulta somente `archived_at IS NULL` antes do limite de 100 registros e ainda filtra em memória. Indicadores e colunas usam a mesma coleção ativa; atualização a cada 15 segundos em primeiro plano.
- Arquivar/excluir invalida o cache da operação Social Media; exclusão também invalida histórico de campanhas e remove caches de avaliação do calendário apagado.

## Evidência de leitura de esquema · 24/10/2026

Catálogo remoto confirmou `strategy.delete` e quatro referências diretas ao calendário: `monthly_editorial_shares` e `monthly_editorial_feedback` com CASCADE; `editorial_campaign_versions` e `editorial_idea_registry` sem CASCADE. Não existem referências adicionais aos dois últimos registros. `monthly_editorial_feedback.share_id` é FK simples para shares; por isso feedback é removido antes de shares.

Migração `20261023222243_editorial_campaign_permanent_delete.sql` gerada pelo CLI (timestamp UTC). Nenhuma exclusão real, teste ou deploy foi executado. Typecheck concluído sem erros em `/private/tmp/editorial-permanent-delete-typecheck.log`.
