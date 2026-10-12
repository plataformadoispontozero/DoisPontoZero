# Recuperação dos seletores do chat
Status: Ready for Review
Responsabilidade: @po → @dev → revisão @qa pela auditoria principal.
Pedido: corrigir o seletor na área de chat.
## Critérios
- [x] Seletores com contraste consistente e nomes acessíveis.
- [x] Mensagem direta distingue carregamento, vazio e erro e permite nova tentativa.
- [x] Participantes privados não vazam para canal público ou nova criação.
- [x] Testes de regressão e gates executados.
## Arquivos
- src/features/chat/ChatPage.tsx
- src/features/chat/chat.selectors.test.tsx
- docs/stories/chat-selector-recovery.md

## Evidência
- Antes: os três testes de regressão falharam. Depois: 5/5 testes de chat passaram.
- `npm run typecheck`: passou. `npm run lint`: passou com avisos preexistentes.
- Suite completa, build e QA visual ficam na auditoria principal antes de publicar. CodeRabbit não executado.

## Gates da retomada

- Suite completa: 73 arquivos, 302 testes passaram com um worker.
- Typecheck, lint e build passaram; avisos preexistentes de lint e tamanho de chunk permanecem.
- Testes SQL públicos adicionais e validação remota registrados em docs/AUDIT_RESUME_2026-10-13.md.
