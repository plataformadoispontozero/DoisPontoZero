# Correção da lista de papéis — 11/10/2026

Consulta somente leitura no projeto pvkhlobsiszrjtblpruu confirmou OWNER, ADMIN, MANAGER, MEMBER e VIEWER na agência Dois.Zero. Não foram inseridos papéis nem alteradas memberships.

A consulta agencyRoles usava initialData=[] no backend configurado; isso fazia a lista inicial vazia parecer carregada e podia postergar a busca conforme staleTime. Removido esse initialData em modo real e exigido agencyId válido. Formulário agora mostra seleção explícita, carregamento/erro/ausência e nomes em português, preserva IDs reais e não inclui OWNER entre opções de convite. Painel lista os papéis disponíveis mesmo com convites bloqueados.

Envio exige papel existente; não usa role-member fictício. Especialidades não viram privilégios. Convites e mudanças de papel continuam bloqueados em modo real até homologação do serviço seguro.

Checks: 99 testes unitários PASS, typecheck/build/lint/diff PASS (lint mantém avisos). Três novos testes verificam IDs reais, exclusão de OWNER, lista vazia sem invenção e papéis personalizados. Não foi feita homologação autenticada do dropdown remoto. Alteração permanece local, sem push/deploy.

Arquivos: src/features/settings/hooks/useAgencySettings.ts; src/features/settings/TeamManagementPage.tsx; src/features/team/memberRoleOptions.ts; src/features/team/memberRoleOptions.test.ts; este relatório.
