# Auditoria de retomada — 13/10/2026

## Estado encontrado

- HEAD `47a7119` (ANTIGRAVITY): alterações em exportação PDF, transformação do modelo PDF e configuração Vite.
- Commit `7b04e79` (MANUS): adicionou um backup de clientes e saídas locais de ferramentas ao Git; alteração funcional pequena em teste editorial. O backup e as saídas foram preservados em diretório privado fora do repositório e removidos do próximo commit; o histórico anterior não foi reescrito.
- Supabase remoto confirmou 29 clientes, 23 briefings nativos e 577 versões nesta agência. Nenhuma nova importação foi executada nesta retomada.
- A migration `20261012050000_presentation_public_links_rpc` já consta no histórico remoto e a RPC `create_presentation_public_link(uuid,uuid)` existe. A pendência descrita no relatório de 12/10 estava desatualizada.

## Correções desta retomada

- Seletor de participantes do chat com identificadores explícitos, estado controlado e validação.
- Remoção da busca de briefings no Drive das telas de briefing, cliente e geração editorial; briefings nativos mantidos.
- Apresentações: corrigidos criação, exportação, referências do Drive e leitura de link público; removido fallback fictício.
- Teste de aniversário alinhado ao UTC usado pelo fallback da função, evitando divergência de data do ambiente após meia-noite. A regra de aniversário local possui teste independente.

## Validação

Suite completa: 73 arquivos e 302 testes passaram com um worker; typecheck, lint (avisos existentes) e build passaram. O teste inicial de aniversário falhou por divergência do fuso do fixture e foi corrigido sem mudar a regra de negócio. Não interpretar HTTP 200 de SPA como prova de operações autenticadas. Sem autenticação real de usuário no navegador, os testes de interface usam respostas controladas; validações SQL são registradas separadamente.

## Publicação

Gates concluídos; push e deploy autorizados em execução. Dados privados não entram no novo pacote ou commit. A retirada do Git atual não remove cópias do histórico anterior.

## Banco remoto

- Migrations de referências do Drive, permissões de criação de links e ponte anônima aplicadas.
- Token válido de apresentação publicada funcionou sob papel `anon`; token inválido foi rejeitado. Teste em transação com ROLLBACK, sem persistir apresentação fictícia.
- `anon` não pode criar links; `authenticated` pode. Consulta pública mantém validação por hash de token, publicação e agência; wrapper estreito SECURITY DEFINER evita conceder acesso geral ao schema privado.
- Lovable não foi alterado.

- QA de interface: 12 rotas desktop com sessão/API controladas passaram após abrir e recarregar; não substituem testes autenticados reais.
- Backup privado e saídas Manus ausentes do índice atual e do pacote `dist`; `manus-routes.json` é apenas o manifesto público de rotas.
