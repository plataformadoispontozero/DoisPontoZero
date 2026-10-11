# Projetos, Briefings e Estratégia — correção de 11/10/2026

Os prints são estados vazios de uma agência sem registros. Os três CTAs já navegam para os formulários de criação. Isso não comprova persistência ou permissões remotas.

## Correções

- Briefing consulta clientes do CRM diretamente, inclusive clientes sem projetos. Removidos os clientes fictícios usados quando a agência estava vazia.
- A consulta de modelos não substitui uma resposta vazia do Supabase por modelos locais com IDs inexistentes. Formulário mostra como cadastrar clientes/modelos e bloqueia avanço em falhas de carregamento ou seleção inválida.
- Criação de briefing confirma o modelo na agência e interrompe a operação se a consulta falhar, em vez de assumir versão 1.
- Projetos e Estratégia normalizam o nome e impedem reenvio enquanto a criação está pendente. Estratégia valida a ordem das datas.

## Verificação

Typecheck, build, lint e diff check passaram. Lint mantém avisos existentes. Vitest: 87 testes em 20 arquivos passaram, incluindo três regressões de pré-requisitos de briefing com consultas simuladas.

## Limites e próximo passo

Não foram aplicadas migrations, nem criados registros remotos de teste. A persistência autenticada, RLS, RPC create_project_with_board e criação completa de modelos precisam de homologação no banco. Criação de modelos faz múltiplas gravações e ainda requer transação segura para evitar registros parciais. A agência vazia precisa de clientes e modelos reais; esconder essa condição com demonstração não resolve o fluxo.

Arquivos: NewProjectPage.tsx, NewBriefingPage.tsx, NewBriefingPage.test.tsx, useBriefings.ts, NewStrategyPage.tsx e este relatório.
