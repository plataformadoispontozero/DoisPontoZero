# Agency Agents — primeira entrega coordenada — 22/10/2026

## Equipe aplicada

Perfis instalados em `.codex/agents`: Frontend Developer, Backend Architect, Reality Checker e Test Results Analyzer. Coordenação principal integra alterações e valida publicação. A instalação local dos perfis permanece fora deste commit.

## Correções desta rodada

- Frontend: criação manual de seção bloqueia duplicação, preserva título em erro e associa labels aos campos; carrossel não intercepta teclado de vídeo, áudio, modal ou edição. E2E de avaliação atualizado estaticamente para posts em grade.
- Componente Dialog: bloqueio de rolagem compartilhado entre janelas; Escape fecha somente a janela superior. Testes cobrem restauração do estilo anterior e múltiplos diálogos.
- Google Workspace: orçamento de 15s para chamadas sem limite anterior, preservação de cancelamento, erro GOOGLE_TIMEOUT e nenhum retry implícito de gravação. Limites próprios de streaming preservados.
- Tarefas: catálogo remoto confirmou apenas RPC legado de oito argumentos. Migration nova restaura contrato de treze argumentos, mantém overload legado e usa ledger v2 por agência/usuário/solicitação. Não reaplica migration antiga. Responsáveis precisam de vínculo ativo e associação ao projeto. Retry revalida acesso à tarefa.
- CI: cobre branches feat/codex/main/principal/release e PRs; Node22.12; lint sem ignorar falhas; testes com limite de workers; valida configuração pública; flags explícitas; dry-run Wrangler; artefato com SHA. Variáveis públicas Supabase devem estar cadastradas nas Actions variables. Execução hospedada do workflow ainda não observada.

## Evidências

- Backend: 27 testes direcionados aprovados; typecheck aprovado pelo agente.
- Frontend/diálogos alterados: 18 testes em três arquivos aprovados na integração.
- PGlite isolado: showcase.database 3/3 aprovado.
- Lint: 483 avisos, nenhum erro na inspeção inicial.
- Regressão completa: inconclusiva. Rodadas padrão, dois workers e serial foram interrompidas sem conclusão; não equivalem a aprovação global.
- Supabase: criação com treze argumentos, responsável sem duplicação, idempotência e rejeições de coluna/projeto/sessão inválidos passaram em transação com rollback. Não foram mantidos registros de QA.
- Advisor: nova tabela privada tem RLS sem policies (nega acesso direto), esperado para ledger exclusivo da função; grants de tabela revogados de public/anon/authenticated. Alertas históricos de outras funções e proteção de senhas continuam separados da correção.
- Google remoto v19 foi comparado ao HEAD antes da mudança: todos os 12 arquivos existentes eram iguais. Timeout publicado como google-workspace v20.

## Plano de conclusão restante

1. Resolver execução integral estável e atualizar cenários E2E antigos antes da certificação global.
2. Cadastro: remover gargalo do bucket global com desafio validado e origem confiável; validar em backend isolado.
3. Inventário/checksums das migrations e contratos remotos restantes; nenhuma execução ampla de db push.
4. Jornada por perfil/cliente: briefing → editorial → produção/Drive → apresentação → ajuste → nova aprovação; negar acesso cruzado entre agências.
5. Testes operacionais reais: SMTP, Google/Meta, voz/vídeo/tela entre duas contas, desktop e restauração. Registrar cada critério e evidência; não homologar por herança.

Parecer global permanece NEEDS WORK até esses critérios serem observados. Ver matriz detalhada em agency-agents-readiness-2026-10-22.md.

## Publicação e smoke desta rodada

- Build e typecheck integrados aprovados, produção e homologação.
- Wrangler dry-run aprovado sem publicação.
- Produção Worker: f7fdc6d6-f54e-4013-9788-83b0b1d8939c.
- Homologação Worker: 40901603-1df9-4bda-a516-2a090f35a97f.
- Supabase google-workspace: v20; migration reconcile_task_creation_contract aplicada.
- CUA autenticado: editor carregou e modal de criação mostrou somente Post/Carrossel/Reels; cancelado sem gravar dados.
- CUA link público: carrossel de seis lâminas em sequência numérica. Seta avançou início visível de lâmina1 para2; arraste avançou de2 para3 sem abrir modal. Evidência: /tmp/dois-agency-carousel-20261022.png.
- A navegação entre artes dentro da imagem ampliada ainda não foi implementada; o carrossel navega na faixa da seção.
