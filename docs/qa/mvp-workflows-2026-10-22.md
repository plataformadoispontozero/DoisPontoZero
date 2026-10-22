# MVP operacional: clientes e criação de projeto — 22/10/2026

## Falhas constatadas

1. `useClients.ts` substituía indisponibilidade de backend por cinco clientes fictícios e mantinha criação, edição e arquivamento em memória. A operação podia mostrar sucesso sem nenhuma persistência real.
2. `ClientsPage.tsx` não distinguia erro da consulta de uma lista vazia; em falha mostrava “Nenhum cliente localizado” e convidava a cadastrar outra conta.
3. `NewProjectPage.tsx` enviava sempre `client_id: null`: não havia campo para selecionar cliente apesar de a RPC e o formulário de domínio aceitarem esse vínculo. A área também informava conexão Supabase ainda futura, mesmo com a aplicação integrada.

## Correções

- Removido cache demo dos hooks de CRM. Backend indisponível resulta em erro de leitura e rejeição explícita de mutação; não há sucesso simulado.
- Agência ativa usada como padrão da consulta, em vez do literal `demo-agency`.
- Arquivamento mantém filtro explícito de agência além do ID.
- CRM mostra erro recuperável com botão para tentar novamente, separado do estado vazio.
- Criação de projeto permite cliente ativo real da agência ou projeto interno; encaminha o ID selecionado à RPC existente.
- Criação bloqueada enquanto a lista de clientes carrega ou está em erro; há opção de nova tentativa.
- Label do nome do projeto associado ao campo. Texto de equipe informa o fluxo real de atribuição na produção.

## Evidência

`npm test -- src/features/clients/hooks/useClientsAvailability.test.tsx src/features/projects/NewProjectPage.test.tsx --maxWorkers=1`

Resultado: **6 testes aprovados / 2 arquivos**. Cobertura de falha de lista/detalhe, rejeição de criação/edição/arquivo sem backend, erro recuperável na tela, cliente e agência no payload de projeto e bloqueio/retry ao falhar a lista.

`git diff --check`: aprovado.

## Limites

Não foram criados/editados/excluídos dados remotos. Remoção de fixtures em memória não apaga os registros de teste do Supabase. Sem suíte integral, build, deploy, commit, CRUD com sessão real, teste de Drive, leitura de tela ou medição de performance nesta frente. A equipe real e a jornada completa cliente → produção → aprovação continuam sujeitas à validação operacional.

## Limpeza adicional: detalhe da demanda

O componente atual `TaskDetailPanel` ainda mantinha fixture de tarefa quando `isSupabaseConfigured` era falso. Em produção configurada o guard anterior já evitava essa substituição; portanto isto não foi apresentado como bug reproduzido no build público atual. O fixture foi removido preventivamente para que nenhum runtime sem configuração apresente título, descrição e coluna inventados. O estado sem tarefa agora distingue carregamento, indisponibilidade, erro com nova tentativa e ausência/sem acesso.

Quatro testes direcionados preparados em `TaskDetailPanelAvailability.test.tsx`; aguardando a suíte integral do coordenador terminar antes da execução, para evitar concorrência.
