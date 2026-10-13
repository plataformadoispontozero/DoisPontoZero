# QA — Operação Social Media e avaliações da apresentação

Data: 13/10/2026. Responsáveis: @qa/@devops.

## Gates
- Lint aprovado, com avisos existentes.
- `npm run typecheck` (`tsc -b`) aprovado. Uma tentativa inicial foi bloqueada por permissão de escrita no cache TypeScript; após conceder a pasta real, o comando passou sem erro de código.
- 345 testes únicos validados. A execução completa teve 343 aprovados e dois timeouts de 5s em suites PGlite existentes enquanto o Chrome executava os E2E. As duas suites foram reexecutadas sem Chrome: 9/9 aprovados, sem alterar testes ou tempos limite.
- Build aprovado; bundle `index-CEEgLE6o.js`.
- Social Media: 6 E2E aprovados (rota e fluxo cliente/calendário/produção em desktop, tablet e mobile).
- Apresentação: 3 E2E finais aprovados após o último ajuste do cabeçalho (container estreito, imagem legível, aprovação, ajuste e restauração após refresh). Screenshot mobile inspecionado: sem sobreposição da marca ou overflow.
- Estes E2E usam APIs/arte controladas; não comprovam leitura real no Google Drive.
- CodeRabbit indisponível no ambiente; não se afirma aprovação dessa ferramenta.

## Supabase
Migration canônica `20261013143738_presentation_material_reviews.sql` aplicada por CLI.
Rollback com papéis anon/authenticated comprovou: três decisões, restauração do histórico, rejeição de material de outra apresentação, token inválido/expirado, bloqueio do catálogo anônimo, leitura pela equipe autorizada e bloqueio de identidade externa. Nenhum registro de teste persistido ou retorno real de cliente alterado.

Os avisos do advisor sobre as duas bridges públicas SECURITY DEFINER são intencionais: as funções delegam exclusivamente ao validador privado de token, com search_path fixo, sem grant de catálogo ou USAGE privado ao anon. [Referência do advisor](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Limites
- Social Media reutiliza calendários nativos e demandas existentes, sem importar ou duplicar arquivos históricos.
- A qualidade da imagem depende da fonte do Google; solicitações maiores têm fallback.
- Uso de arquivos reais do Drive e avaliação real por um cliente ainda dependem de teste com os links autorizados da agência.

Publicação em andamento; cache `supabase/.temp/cli-latest` excluído do commit.
