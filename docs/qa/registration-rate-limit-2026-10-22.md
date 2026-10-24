# Correção pontual do rate limit de cadastro — 2026-10-22

## Alteração

`supabase/functions/team-registration/index.ts` passa a usar o helper testável `rateLimit.ts`. Sem uma fonte comprovada de IP do cliente, `p_ip_hash` recebe SHA-256 de um prefixo específico, e-mail normalizado (trim + lowercase) e segredo existente. E-mails diferentes deixam de compartilhar o bucket constante `public-registration` de 10/h. O helper não recebe headers nem usa `x-forwarded-for` ou outros headers como identidade.

Este fallback **não é proteção por IP**: o bucket legado de 10/h agora é por e-mail normalizado e fica subordinado ao limite de 3/h por e-mail. Trocar de e-mail permite trocar de bucket; permanece o limite global de 100/dia. Não há fonte de IP confiável configurada por esta alteração.

O hash de `p_email_hash` conserva exatamente o algoritmo anterior para manter o bucket existente. A função SQL, os limites de 3/h por e-mail e 100/dia global, as permissões e os fluxos de revisão não foram alterados. As respostas genéricas para conta existente (`submitted: true`) e o tratamento de erro do rate limit permanecem iguais; nenhuma consulta de existência foi adicionada.

## Evidência executada

Único comando de teste: `npx vitest run src/features/team/registration-rate-limit.test.ts`.

Resultado: exit code 0; **1 arquivo, 3 testes aprovados**, duração 1,55 s, início 11:53:13 (horário reportado pelo runner).

- Variantes com espaços/maiúsculas produzem os mesmos hashes; hash de e-mail compatível com o algoritmo anterior; fallback em formato hexadecimal de 64 caracteres e separado do hash de e-mail.
- E-mails diferentes e segredos diferentes produzem buckets de fallback distintos.
- PGlite local executa a definição existente de `reserve_team_registration`, extraída da migration sem editar ou aplicar a migration: três reservas do mesmo e-mail normalizado passam e a quarta falha. Após limpar somente a tabela local do teste, 100 e-mails distintos passam na mesma janela e o 101º falha, comprovando também a passagem além de 10 e-mails/h.

Revisão estática do diff: mudança no endpoint restrita à importação/chamada do helper e remoção do hash/bucket constante. Respostas de não enumeração, autorização e permissões preservadas por ausência de alterações nesses trechos; não foram retestadas ponta a ponta.

## Escopo e limites da evidência

Sem alteração de banco remoto ou migrations, deploy ou commit. Sem execução de suíte completa, build ou teste remoto. Edições concorrentes de apresentações e manifests foram preservadas. Este registro valida apenas a correção pontual local; não constitui homologação global do cadastro. Captcha não foi implementado.
