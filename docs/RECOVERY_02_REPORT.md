# Recovery 02 — recuperação da base de autenticação

Data: 11/10/2026. Trabalho local em `/Users/designer/Documents/DoisPontoZero`, branch `codex/master-audit-15-1`, base `1120f9088a159705e550097fd42c58683babc7dd`. Não houve troca de branch, commit, push, merge, deploy, DNS, criação de usuários ou escrita remota. O pedido Recovery 02 passou a delimitar o escopo; ajustes operacionais anteriores foram preservados, sem avançar automaticamente para Recovery 03.

## Diagnóstico e correções

A auditoria anterior encontrou sessão demonstrativa, ausência de provider/guard e contexto fixo de agência. Agora existe AuthProvider que reutiliza o cliente Supabase existente: getSession na inicialização, onAuthStateChange, validação getUser no servidor, memberships ativas, nome do perfil e concessões do papel. Callbacks Auth não executam consultas de banco dentro do listener. Cancelamento/generation evita hidratação atrasada após logout/troca de agência.

Estados explícitos: INITIALIZING, UNAUTHENTICATED, AUTHENTICATED, NO_ACTIVE_MEMBERSHIP, AUTH_ERROR e BACKEND_UNAVAILABLE. Login usa signInWithPassword; logout signOut; recuperação usa resetPasswordForEmail e updateUser. Falhas não geram conta administrativa alternativa. Recuperação completa por e-mail/OAuth não foi testada remotamente.

ProtectedWorkspace guarda o layout privado, valida permissões de rota e mantém deep links com destino interno seguro. Acesso sem sessão vai a /login; sem vínculo ou com sessão inválida mostra bloqueio; viewer não entra em /settings/permissions. Rotas públicas continuam fora do guard e dependem de seus próprios tokens. Propostas públicas sem contrato validado mostram indisponibilidade, nunca a proposta Acme em ambiente real.

A demonstração exige flag explícita, ausência de Supabase e hostname loopback. Um domínio público não ativa privilégios demo mesmo com a flag. Com backend configurado não existe fallback de erro para Admin Demo. SDK gerencia sessão/refresh; localStorage próprio contém somente preferência de agência validada contra memberships.

QueryClient e providers dependem do usuário/agência. Troca limpa cache anterior e revalida vínculo/permissões. Shell mostra nome e agência reais; páginas/hooks deixam de confiar em agency-001/user-1 para o contexto. Filtros client-side são defesa de interface, não autorização de servidor. Nenhuma alteração de RLS foi aplicada.

Permission Studio lê roles, permissions e role_permissions reais, preserva OWNER na UI e não simula sucesso. Salvamento está bloqueado até validar a RPC administrativa em staging. O rascunho SQL permanece fora de migrations e NÃO foi executado/compilado em PostgreSQL.

## Status separados

| Gate | Resultado |
|---|---|
| FRONTEND_AUTH_STATUS | FRONTEND_AUTH_READY para os cenários locais comprovados; integração real de login ainda requer conta autorizada |
| BACKEND_AUTH_STATUS | BLOCKED — sem staging/contas A/B/C e sem reconciliação administrativa do schema remoto |
| TENANT_ISOLATION_STATUS | Frontend PASS em API controlada; RLS/Storage/Realtime reais BLOCKED |
| PERMISSION_STUDIO_STATUS | Leitura implementada; UI protegida; persistência BLOCKED explicitamente |
| REMOTE_SCHEMA_STATUS | BLOCKED — existência histórica de 89 relações não comprova histórico/policies/functions/constraints |
| Produção | NO-GO |

## Rotas e preservação

/login, /forgot-password e /reset-password acrescentadas. /agenda permanece alias de /calendar. Rotas CRM /clients/new, /clients/:clientId e /clients/:clientId/edit recuperadas antes da delimitação deste pedido, reutilizando formulário/Sheet existentes. Páginas carregam sob demanda; PDF continua separado e grande. Não houve alteração visual do Design System.

## Riscos restantes e próxima etapa

A migration histórica 08 usa profiles.agency_id ausente na migration 01; policies amplas e regras de alteração de OWNER precisam de revisão transacional. Roles externos à agência devem ser impossíveis também no servidor. API de permissões, convite seguro, bootstrap administrativo, sessão/revogação em produção, recuperação por e-mail, tokens públicos, Storage e Realtime não estão homologados. Correções de interface não transformam esses itens em PASS.

Antes do Recovery 03: disponibilizar staging Supabase separado sem dados de produção; exportar histórico/schema/policies/functions/constraints somente leitura; revisar migrations incrementais e rascunhos; obter autorização específica para aplicar somente em staging; criar contas descartáveis A/B/C/sem vínculo/inativas; executar matriz negativa e administrativa real. O projeto pvkhlobsiszrjtblpruu permanece intacto. Não há solicitação para desativar RLS ou publicar.

## Evidências

- RECOVERY_02_CONTRACTS.md: contratos e divergências.
- RECOVERY_02_RLS_REVIEW.md: achados estáticos e cenários reais bloqueados.
- RECOVERY_02_TESTS.md: execução e classificação PASS/FAIL/BLOCKED/NOT_RUN.
- evidence/agency-recovery/: saídas dos comandos e resultados JSON locais.
- evidence/agency-recovery/modified-files.txt: arquivos modificados/não versionados; não inclui conteúdo de configuração privada.

Os documentos CODEX anteriores são fotografia histórica da auditoria 15.1. Este relatório registra o estado posterior; alegações históricas de fases concluídas continuam sem homologação de backend.
