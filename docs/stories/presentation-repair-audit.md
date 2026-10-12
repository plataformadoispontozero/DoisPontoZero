# Apresentações: auditoria e recuperação

Status: Ready for Review
Responsável: @dev; story preparada como @po.

## Objetivo
Corrigir as falhas relatadas na área de apresentações, preservando as alterações úteis do Antigravity e sem simular arquivos de clientes quando a integração falha.

## Critérios
- [x] Cadastro de apresentação mostra erro real para o usuário.
- [x] Arquivos reais permanecem vinculados após recarregar.
- [x] Banco vazio retorna vazio; erro de persistência não informa sucesso.
- [x] Showcase público inclui somente referências vinculadas à apresentação e agência do token válido.
- [x] Exportação distingue erro, inexistência e carregamento.
- [x] Testes de regressão executados; limitações registradas.

## Achados
Commit 47a7119 (ANTIGRAVITY): melhorias de importação dinâmica do PDF preservadas.
Commit 53795e7: fallback de arquivos fictícios em produção e falhas de inserção silenciosamente ignoradas. As consultas de apresentações não carregavam as referências do Drive. A RPC pública também omitia URLs de mídia.

## File list
- src/features/drive/hooks/useDrive.ts
- src/features/drive/DriveBrowserPage.tsx
- src/features/presentations/hooks/usePresentations.ts
- src/features/presentations/NewPresentationPage.tsx
- src/features/presentations/PresentationWorkspacePage.tsx
- src/features/presentations/PresentationExportPage.tsx
- src/features/presentations/public/PublicShowcaseViewPage.tsx
- src/features/presentations/showcase.database.test.ts
- src/features/presentations/driveReferences.test.tsx
- supabase/migrations/20261012233624_showcase_drive_references.sql
- supabase/migrations/20261012234001_showcase_anonymous_bridge.sql

## Validação
8 testes em 3 arquivos passaram (incluindo ausência de USAGE do schema private para anon) (PGlite, hooks, renderização existente); typecheck passou. Gates globais e aplicação da migration delegados a @devops. RPC de criação de links existe no banco remoto; documentação anterior estava desatualizada.

O wrapper público SECURITY DEFINER possui caminho de busca vazio, execução limitada a anon/authenticated e delega somente à validação do token privado. Esta ponte evita ampliar USAGE do schema private para anon. O digest nos testes locais é um stub determinístico; criptografia real exige validação remota de pgcrypto.

## Limitações
A visualização utiliza metadados e links persistidos; não foi realizado upload real de binários no Google Drive nem abertura autenticada de um arquivo privado por cliente. Compartilhamento de arquivos no Google continua dependendo das permissões do Drive. O fluxo legado de salvar seções e assets ainda executa múltiplas requisições; esta correção não transforma esse fluxo em uma transação única. CodeRabbit não executado neste ambiente.


## Gates da retomada

- Suite completa: 73 arquivos, 302 testes passaram com um worker.
- Typecheck, lint e build passaram; avisos preexistentes de lint e tamanho de chunk permanecem.
- Testes SQL públicos adicionais e validação remota registrados em docs/AUDIT_RESUME_2026-10-13.md.
