# Recovery 02 — execução e limites dos testes

Executado em 11/10/2026, checkout DoisPontoZero, branch codex/master-audit-15-1. Sem escrita remota. Os resultados históricos da Master Audit são mantidos separados.

| Verificação | Resultado | Evidência |
|---|---|---|
| npm run test | PASS: 81/81, 18 arquivos | evidence/agency-recovery/unit-final.txt |
| npm run typecheck | PASS: tsc -b, zero erros | typecheck-final.txt |
| npm run build | PASS: tsc -b + Vite | build-final.txt |
| npm run lint | PASS com 507 avisos; não significa lint sem avisos | lint-final.txt |
| git diff --check | PASS | Executado após alterações de código/documentação |
| Playwright Auth, API controlada | PASS: 36/36, desktop/tablet/mobile | auth-e2e-final.txt e auth-e2e-final.json |
| Playwright regressão em demo isolada | Primeiro run: 83 PASS / 1 FAIL (alias agenda em tablet) | regression-first.txt/.json |
| Reteste após correção do alias no loader | PASS: 3/3; cobre o único caso anteriormente falho | agenda-retest.txt/.json |
| Casos únicos de regressão após reteste | 84 aprovados; não foi uma rodada integral 84/84 | Evidências primeira rodada + reteste |
| Tela local de login desktop/mobile | PASS visual e sem overflow | login-desktop.png, login-mobile.png |
| Login real contra Supabase | BLOCKED: sem conta autorizada fornecida para execução | Nenhuma credencial solicitada em texto/log |
| RLS negativo A/B/C e administrativo real | BLOCKED: sem staging isolado e contas descartáveis autorizadas | RECOVERY_02_RLS_REVIEW.md |
| Storage/Reatime real | BLOCKED | Requer servidor/schema e contas A/B/C |
| Recuperação por e-mail/OAuth remoto | NOT_RUN | Sem envio real/alteração de credenciais |
| SQL pendente em PostgreSQL | NOT_RUN | Sem PostgreSQL/Docker local; nenhum SQL remoto executado |
| Produção/Cloudflare/GitHub publicação | NOT_RUN por restrição expressa | Nenhum push, merge, deploy ou DNS |

## Cobertura Auth controlada

12 cenários × 3 viewports: sem sessão/deep link/reload; login com retorno ao destino e troca de agência/cache; ausência de vínculo; viewer negado na administração; erro de backend não vira cliente fictício; logout SDK seguido de rota privada; formulário de cliente usa agência ativa e contrato API após reload; credenciais inválidas; sessão inválida/expirada rejeitada por getUser; indisponibilidade de rede; vínculo inativo excluído da consulta; proposta pública sem token verificado não mostra fixture nem exige login.

A API audit-auth.supabase.co é interceptada exclusivamente na suíte. São testes de cliente/contratos simulados, nunca prova de RLS ou persistência PostgreSQL. Tokens/senhas de teste são fictícios. Fixtures só existem no modo demo loopback explícito ou nos testes. Nenhum resultado BLOCKED foi convertido em PASS com mocks.

A primeira rodada Auth após lazy loading apresentou três falhas de carregamento PDF desnecessário; a divisão manual de PDF foi removida, deixando chunk dinâmico. Outra rodada identificou mensagem de sessão inválida para indisponibilidade: o provider agora distingue falha de rede. A evidência final 36/36 corresponde às correções. Erro histórico de /agenda foi corrigido pelo loader; não foi removida a asserção nem ampliado seu timeout.

## Performance e limites

Bundle principal final aproximadamente 372,70 KB (gzip 112,71 KB), contra 1.083,74 KB antes do carregamento por demanda. PDF 1.198,96 KB (gzip 443,44 KB) separado. Teste confirma que login não carrega o chunk PDF. Não houve medição Core Web Vitals, carga/concor­rência, pentest ou homologação de produção.

O probe anônimo HEAD de metadados nesta recuperação não concluiu: anonymous-readonly.json contém UNAVAILABLE, não PASS. As 89 relações HTTP 200 são evidência histórica de existência exposta à consulta limit=0; não são homologação de policies, schema ou histórico.
