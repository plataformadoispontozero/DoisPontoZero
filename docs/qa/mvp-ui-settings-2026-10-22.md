# MVP — UI/UX de configurações — 22/10/2026

## Escopo

Perfis Agency Agents consultados: UI Designer e UX Architect em `.codex/agents`. Correções limitadas a `src/features/settings`; sem alteração de navegação principal, banco, manifests, build, deploy ou commit. Os componentes reais do menu principal estão em `src/components/navigation`, não em `src/components/layout`.

## Bugs corrigidos

1. **Preferência visual inicializada antes da consulta:** `AppearanceSettingsPage` usava o fallback escuro no primeiro render e não atualizava o estado ao receber o registro remoto. Agora o formulário aguarda a consulta, oferece retry em erro e remonta por agência para não carregar seleção da agência anterior.
2. **Ações de tema sem efeito na plataforma:** a busca em `src` constatou que `theme_mode` só era consumido pelo próprio formulário; os cartões prometiam modo claro/sistema sem aplicação na interface. Esses modos estão explicitamente indisponíveis no MVP, com seleção e salvamento impedidos; o escuro permanece disponível. Isso não implementa temas globais.
3. **Seleção de tema inacessível pelo teclado:** cartões com `div onClick` foram substituídos por botões nativos com `aria-pressed` e foco visível.
4. **Identidade visual inacessível pela central:** a rota `/settings/branding` existia, mas estava ausente da lista compartilhada de abas/cards. Incluído item “Identidade visual”.
5. **Foco ausente nos cards e contexto da navegação:** cards tinham `focus:outline-none` sem substituição. Agora têm anel de foco; a navegação possui nome acessível e links de no mínimo 44px. Destaque do título no hover usa laranja claro em vez do tom escuro sobre fundo escuro. “Client Portals” foi traduzido para “Portais do cliente”.

## Evidências

- Novos testes: carregamento antes de edição, estado remoto, erro/retry, seleção nativa e indisponibilidade de modos sem efeito, salvamento do escuro, troca de agência e acesso à identidade visual por abas/cards.
- `npm test -- src/features/settings/AppearanceSettingsPage.test.tsx src/features/settings/SettingsNavigation.test.tsx --maxWorkers=1`: 6 aprovados.
- `npx tsc -b --pretty false`: aprovado.
- Regressão direcionada adicionando `settings.test.tsx`: 12 testes em 3 arquivos aprovados.
- `git diff --check`: sem erros no momento da revisão.

## Pendências e limites

- Tema claro e sistema exigem implementação global antes de serem habilitados. Não há alegação de tema claro concluído.
- Idiomas de interface adicionais exigem implementação de localização antes de serem oferecidos. O MVP só oferece pt-BR; valores antigos de outro idioma permanecem registrados até escolha explícita de português.
- Não foi executado teste visual em navegador, leitor de tela, dispositivo móvel físico ou persistência real com duas contas. Os testes de componente não comprovam WCAG AA de toda a plataforma.
- Identidade visual, permissões, SMTP, Google/Meta e dados reais continuam sujeitos às validações operacionais dos respectivos fluxos.

## Complemento — idioma da interface

- Campo compartilhado entre Preferências e Dados da agência oferece apenas português (Brasil), com explicação curta de indisponibilidade de inglês/espanhol.
- Se o registro remoto já possui outro idioma, ele continua selecionado como preferência anterior indisponível; abrir a tela e salvar outros parâmetros preservam esse valor. Somente selecionar português altera o idioma enviado. Nenhuma conversão automática foi executada.
- Confirmado que ambas as páginas já aguardam a consulta antes de montar o formulário e usam chave por agência. Incluídos testes de carregamento, preferência remota, troca de agência, retry, preservação em salvamento e alteração explícita.
- Regressão direcionada final: 16 testes aprovados em 4 arquivos.
