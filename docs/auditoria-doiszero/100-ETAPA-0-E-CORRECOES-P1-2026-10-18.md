# Execução da Etapa 0 e correções prioritárias

Data: 18/10/2026. Esta atualização registra a execução autorizada pelo responsável após a auditoria técnica anexada.

## Base de trabalho

| Item | Evidência local |
|---|---|
| Branch de origem | `feat/escritorio-digital` |
| HEAD de origem | `88c4a32739cc95340ac179b9041eeffe595d10a1` |
| Candidata de estabilização | `codex/estabilizacao-auditoria-2026-10-18` |
| HEAD inicial da estabilização | `88c4a32739cc95340ac179b9041eeffe595d10a1` |
| Branch de auditoria | `codex/master-audit-15-1` |
| Relação Git | `codex/master-audit-15-1` é ancestral direta; 27 commits atrás da candidata |
| Remote observado | `origin/feat/escritorio-digital` aponta para o mesmo HEAD inicial |
| Tags locais | Nenhuma |

O workspace já tinha alterações não commitadas e arquivos não rastreados antes desta execução. Foram preservados; não foram copiados por cima, descartados ou incluídos em commit. A branch local de estabilização foi criada a partir do HEAD candidato e conserva esse estado de trabalho.

Os 127 caminhos diferentes entre as branches de auditoria e Escritório correspondem ao diff de conteúdo da comparação local: 86 arquivos adicionados e 41 alterados, sem arquivos removidos. A relação de ancestralidade foi verificada separadamente com Git; o diff de arquivos sozinho não prova histórico.

## Etapa 1 — correções A02–A04 e A06

| Achado | Mudança nesta execução | Evidência de teste |
|---|---|---|
| A02 — filtro do Kanban | O quadro de produção agora recebe diretamente o conjunto filtrado que já alimenta a lista. O movimento em grupo só pode receber os IDs que passaram pelos filtros. | E2E adicionada: Kanban e lista conservam os mesmos IDs ao filtrar por responsável; passou em desktop, tablet e celular (3/3). |
| A03 — projetos nos seletores | `useProjects()` sem argumento usa a agência ativa; um escopo explícito continua sendo respeitado. A conversão de ação em tarefa usa o primeiro projeto carregado quando nenhum projeto válido foi escolhido. | Dois testes de contrato do hook; ambos passaram. |
| A04 — gravação parcial ao criar tarefa | Migração aditiva cria RPC transacional para validar escopo e gravar tarefa, responsáveis e atividade em uma transação. IDs de responsáveis são deduplicados e atribuições automáticas coincidentes usam `ON CONFLICT DO NOTHING`. Chave de solicitação persistida evita criar duplicata ao repetir a mesma chamada após incerteza de rede. | Testes do RPC cliente e banco PGlite cobrem erro sem sucesso falso, atomicidade, deduplicação, idempotência e execução autenticada; passaram (4 testes). |
| A06 — botão de nova tarefa abre novo projeto | A ação agora exige `tasks.create`, pede a escolha de um projeto existente e carrega o quadro/colunas desse projeto antes de abrir o formulário. Quem não pode criar projetos não recebe esse fluxo por engano. | E2E com usuário que tem `tasks.create` e não recebe `projects.create`; passou em desktop, tablet e celular (3/3). |

## Validação local desta execução

- TypeScript: `npm run typecheck` aprovado.
- Lint: código zero; há avisos existentes no repositório.
- Build de produção: `npm run build` aprovado. O bundle usado pelo Playwright foi reconstruído separadamente com URL/chave Supabase fictícias e Office habilitado.
- Testes unitários: 136 arquivos, 495 testes aprovados.
- Testes E2E A02 e A06: 6/6 aprovados em desktop, tablet e celular.
- `git diff --check`: aprovado.
- Primeiro E2E A02: falhou porque a fixture mantinha os grupos de cliente recolhidos; o teste foi ajustado para expandir o grupo antes de contar os cartões e passou. Nenhum defeito do produto foi inferido dessa falha inicial.

## Limites operacionais

Esta execução não conectou a produção, não leu o schema remoto, não aplicou migração remota e não publicou frontend. A migração `20261018120000_atomic_task_creation.sql` precisa ser aplicada e verificada no ambiente de homologação conforme o processo do projeto antes de disponibilizar o novo fluxo. A execução local em PGlite verifica a transação e isolamento de fixtures; não substitui validação de permissões e migrações no banco remoto completo.

O commit de origem, as flags de build e as referências locais foram registradas. Ainda não há backup/restauração de produção nem plano de rollback de migração comprovado; a RPC é aditiva e o frontend passa a depender dela após o deploy.
