# Briefings: remoção recuperável — 22/10/2026

Perfil aplicado: Agency Agents / Frontend Developer (`.codex/agents/engineering-frontend-developer.toml`), com orientações Supabase.

## Entrega
- Lista separada em Ativos e Arquivados, com contagem e busca.
- Remover / arquivar exige confirmação; restauração explicita retorno como rascunho.
- Briefings sem cliente continuam acessíveis, identificados e com possibilidade de arquivamento; nenhum link para cliente inexistente.
- RPC `set_briefing_archived` usa agência, identificador e autorização `briefings.edit`; não há sucesso local quando conexão/backend falham.
- Transação revoga links públicos ao arquivar, registra atividade e preserva respostas, histórico, anexos e modelos. Restaurar não reativa os links antigos.
- Se houver links ativos, exige também `briefings.manage_public_links`, respeitando a política existente. Quem não possui a permissão recebe erro sem arquivamento parcial.
- Migration `20261022173646_briefing_recoverable_archive.sql` criada com CLI. SECURITY INVOKER aproveita RLS e não amplia permissões de tabela. EXECUTE negado a PUBLIC/anon e concedido apenas a authenticated.

## Evidências
- 7 testes direcionados aprovados (2 arquivos): UI confirmação, sem cliente, restauração, permissão e falha; PGlite transação, dados preservados, revogação, agência, direitos e anon.
- Typecheck inicial após implementação passou. Nova execução durante trabalho paralelo encontrou apenas erros externos em `editorialPlanning.ts:5` (`seasonalDates` ausente em `EditorialContext`); nenhum erro na área de briefing. A integração final deve repetir o typecheck após as outras frentes.
- Sem exclusão física ou alteração de registros reais nesta entrega. Nenhuma migration remota aplicada pelo agente.

## Limites / integração
- Aplicar migration antes de publicar UI/hook. Sem migration o erro do backend permanece visível, sem falsa remoção.
- Não foi feita homologação visual em navegador nem operação real em briefing de cliente.
- Briefings gerais e de cliente excluído têm o mesmo `client_id NULL` no esquema atual; texto não inventa qual motivo ocorreu.
- Os seis modelos oficiais e os históricos reais permanecem preservados.
