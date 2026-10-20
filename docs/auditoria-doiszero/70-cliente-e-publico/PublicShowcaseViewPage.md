# PublicShowcaseViewPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/showcase/:publicToken`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:66-66`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/public/PublicShowcaseViewPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/public/PublicShowcaseViewPage.tsx:25-25` — `const {data:review,error:reviewError}=await supabase.rpc('submit_showcase_material_review',{p_token:publicToken,p_asset:assetId,p_decision:decision,p_note:note});`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/public/PublicShowcaseViewPage.tsx:49-49` — `const { data: showcaseResult, error: rpcError } = await supabase.rpc('get_public_showcase', {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/public/PublicShowcaseViewPage.tsx:62-62` — `const history=await supabase.rpc('get_showcase_material_reviews',{p_token:publicToken});`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/hooks/usePresentationReviews.ts:7-7` — `const agency=useAgencyId(),userId=useAuth().user?.id;`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/hooks/usePresentationReviews.ts:10-10` — `const {data,error}=await supabase.from('presentation_material_reviews').select('id,asset_id,decision,note,created_at').eq('agency_id',agency).eq('presentation_id',presentationId!).order('created_at',{ascending:false});`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/lib/supabase/client.ts:43-43` — `supabase.from('agencies').select('id', { head: true }).limit(1),`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
