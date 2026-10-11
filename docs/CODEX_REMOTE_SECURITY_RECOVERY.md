# Recuperação remota — 11/10/2026

Usuário escolheu o projeto existente pvkhlobsiszrjtblpruu e autorizou correções de schema/RLS após apresentação do SQL. Staging separado não foi criado. Nenhum push, deploy, merge ou DNS executado nesta etapa.

## Evidência remota

As nove migrations históricas constam com os mesmos nomes/versões locais. Isso confirma o registro, não a identidade dos arquivos SQL nem ausência de alterações manuais.

Advisor retornou 11 funções com search_path mutável, 23 SECURITY DEFINER executáveis por anon e 23 por authenticated, além de proteção contra senhas vazadas desativada. Alguns endpoints públicos são intencionais e exigem análise individual; não revogar em massa.

Função bootstrap_agency: definição remota insere agência, papéis, permissões, membership OWNER e audit log sem validação auth.uid. Antes da correção, execução anônima era permitida.

SQL apresentado e aplicado via apply_migration: restrict_agency_bootstrap_execution, versão remota 20261011061831. Revoga EXECUTE de PUBLIC/anon/authenticated e mantém service_role. Espelho em supabase/pending/restrict_agency_bootstrap_execution.sql, não reaplicar como migration nova. Alterações locais posteriores devem gerar/reconciliar arquivo de migration com CLI conforme workflow; não inventar uma versão local diferente.

Verificação executada no catálogo real: anon_allowed=false, authenticated_allowed=false, service_allowed=true. Não foram apagados ou criados registros de agência/usuário. Não foi chamada a função de bootstrap para testar, pois cria dados.

## Pendências

- Meetings isolation policy: expressão remota correlaciona meetings.agency_id ao SELECT de profiles, em vez de validar membership ativa. Revisar as demais policies da fase 10 antes de mudança transacional.
- agency_members UPDATE/INSERT permite alteração de papel sem proteção granular de OWNER no contrato remoto. Alteração de papéis continua bloqueada no frontend local.
- content_strategies permite escrita por qualquer membro; revisar autorização granular.
- tasks INSERT contém comparação pt.id = pt.parent_task_id na verificação de subtarefa; revisar referências externas e integridade tenant/projeto/board.
- Fixar search_path somente após verificar bodies/objetos; revisar RPCs privilegiadas, funções públicas por token, privilégios e policies de Storage.
- Não homologados: testes reais A/B, isolamento, concorrência, persistência completa dos módulos e Meta.

Gate permanece NO_GO para operação completa. Próximo passo: export completo de metadados, backup/rollback planejado, revisão de policies/RPCs por grupo e testes transacionais reversíveis sem posts/campanhas reais.

Referências de remediação fornecidas pelo advisor: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable e https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable .
