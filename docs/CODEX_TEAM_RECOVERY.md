# Prompt 17 — TEAM RECOVERY

Data: 11/10/2026. Status: **PARTIAL**. Execução exclusivamente local.

Rotas: /team, /team/new, /team/:memberId e /settings/team.

## Implementação e inventário

Leitura de memberships/profiles/roles existentes; busca por nome e detalhe do vínculo; menu e rota protegidos. Nenhuma nova tabela ou usuário Auth.

## Banco, permissões e bloqueios

Especialidades, competências, disponibilidade, vínculos detalhados com squads/projetos e carga operacional não implementados. Convites e mudança de papel bloqueados no frontend/backend client até RPC administrativa segura e entrega/aceite homologados. Revogação só confirma após SELECT id e resposta sem erro.

Nenhuma migration remota, SQL remoto, deploy, push, merge, DNS ou operação Meta realizada. Contrato remoto completo e histórico de migrations ainda não reconciliados. Não declarar COMPLETED.

## Testes, evidências e próxima ação

Consultar CODEX_OPERATIONAL_TESTS.md, PROMPT_17_INVENTORY.json e a story docs/stories/prompt-17-operational-recovery.md. Mocks comprovam somente frontend; teste real de integração desta capacidade: NOT_RUN. Preparação do staging em staging/README.md; homologar base antes da fase dependente.

Rascunho SQL: supabase/pending/prompt17_member_role.sql, fora de migrations. RPC restringe alteração a OWNER, valida membro/papel na mesma agência e impede concessão/rebaixamento de OWNER. NOT_RUN; bloqueio de UPDATE direto, auditoria, helper e testes reais ainda necessários. Interface permanece bloqueada e não chama esta função.
