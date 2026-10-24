# Base de segurança e orçamento do Free — 24/10/2026

## Medições reais, somente leitura

Painel da organização Dois.zero, todos os projetos, ciclo 10/10–10/11/2026. Os valores do painel podem ter atraso de atualização e não são contadores exclusivos da plataforma.

| Recurso | Uso | Franquia | Avaliação |
|---|---:|---:|---|
| Egress sem cache | 3,515 GB | 5 GB | 70%; prioridade de economia |
| Egress com cache | 0,012 GB | 5 GB | <1%; franquia independente |
| Database Size | 0,045 GB | 0,5 GB | 9%; painel mostra 42,9 MB para 2.0 e 24,88 MB para Brief Studio Atina |
| Storage médio no ciclo | <0,01 GB | 1 GB | Baixo; média difere dos bytes atuais |
| Edge invocations | 1.512 | 500.000 | <1% |
| Realtime mensagens | 22 | 2.000.000 | <1% |
| Realtime pico | 7 | 200 | 4% |
| MAU | 8 | 50.000 | <1% |
| Logs ingeridos | 0,267 GB | 1 GB | 27% |
| Logs consultados | 206,702 GB | 100 GB | 207%; item upcoming, sem cobrança direta |

O detalhamento de Logs Query mostrou 206,46 GB do projeto doispontozero e 0,24 GB do Brief Studio Atina. Não foi possível atribuir a pessoa, ferramenta ou consulta específica; não executar varredura de logs para tentar explicar esse contador sem um incidente e uma janela delimitada.

Uma consulta pontual a pg_database_size retornou 29.710.003 bytes do banco conectado e 18 conexões naquele instante (não usuários simultâneos). Essa métrica pontual não foi substituída pela medição de faturamento do painel; horários e abrangência diferem. Nenhuma tabela pública de tipo tabela comum estava sem RLS. RLS habilitada não prova que cada policy autoriza corretamente.

## Mudanças locais preparadas

- Calendários/demandas: quatro consultas a cada 15s passam para 60s.
- Painel Social Media: consulta de campanhas passa de 15s para 60s.
- Notificações: atualização passa de 15s para 30s.
- QueryClient: explicita que polling não deve continuar em segundo plano. Cache de 60s, refetch ao foco e retry existente preservados.
- Chat, presença e chamadas preservados para manter interatividade.
- Cada consulta alterada de 15s para 60s passa de 240 para 60 execuções/hora por tela ativa, redução teórica de 75% dessas consultas. Não é estimativa de 75% da transferência total.
- Referrer-Policy passa a no-referrer para não propagar endereços de links com tokens.
- Rotas /b/*, /approve-calendar/*, /showcase/* e /apresentacao/* recebem no-store e noindex/nofollow/noarchive no arquivo de headers. Isso complementa autorização; não a substitui. Robôs maliciosos podem ignorar noindex.

Status: código local. Não publicado nesta etapa. Não executar uma publicação parcial do frontend enquanto as migrations de outras entregas locais não forem revisadas e sincronizadas. A escolha anterior do responsável foi revisar localmente primeiro.

## Política econômica de operação

- Sem monitor automático por consultas de logs. Usar o resumo de Usage; conferir antes de grandes importações ou sessões extensas de diagnóstico.
- Incidente: começar com janela de 15 minutos, projeto e serviço específicos, status/rota filtrados, limite de resultados; ampliar só se necessário. Limitar resultados sozinho não garante reduzir bytes examinados.
- Adotar limites internos de atenção em 60%, contenção em 75%, crítico em 90% das franquias. São critérios de operação documentados, não alertas já configurados.
- Egress restante aproximado: 1,485 GB até 10/11. Meta operacional conservadora: até 50 MB/dia na organização no restante do ciclo, sem garantia automática de limite. Rever com os números atualizados do painel.
- Não repetir downloads de campanhas completas e de mídia. Próxima otimização: separar lista resumida de campanhas do detalhe com items; manter paginação. Essa separação ainda não foi implementada.
- Drive privado não deve ser colocado no site via URL que exija credencial. Definir material autorizado para publicação e distribuição pública otimizada; importar do Drive não elimina automaticamente egress se a Edge funcionar como proxy.
- Importação de 1 GB no navegador e arquivos de 50 MB precisam de leitura em streaming, lotes e conversão, nunca upload indiscriminado para o banco.
- Free não oferece a mesma disponibilidade/backup de plano pago. Manter rotina de recuperação documentada antes de depender exclusivamente da plataforma para operação real.

## Segurança: resultado do Advisor

| Achado | Quantidade | Tratamento |
|---|---:|---|
| RLS enabled no policy | 21 INFO | Em geral bloqueio por padrão, sobretudo tabelas privadas; não liberar policies em massa |
| Definer executável por anon | 10 WARN | Revisar individualmente autenticação por token, escopo, expiração e limitação; não revogar APIs de aprovação em massa |
| Definer executável por authenticated | 46 WARN | Revisar tenant/permissão em cada operação; aviso não comprova exploração |
| Proteção contra senha vazada desativada | 1 WARN | Recurso Pro+, indisponível no Free; não prometer ativação gratuita |

Prioridades seguintes, ainda pendentes de execução/validação:
1. Inventariar e revisar as 10 APIs públicas privilegiadas com maior exposição, começando pelos cadastros e aprovações; avaliar limitação e desafio no servidor com configuração real.
2. Enrolar MFA dos responsáveis no Supabase/GitHub/Cloudflare; o dono deve cadastrar o autenticador e guardar os códigos de recuperação. Não ativar exigência que possa bloquear os administradores antes disso.
3. Revisar políticas por agência e operações de alteração/atribuição para impedir acesso entre clientes/agências; verificação de autorização em servidor, nunca apenas ocultação de botões.
4. Reconciliar migrations locais/remotas e revisar o retorno restrito de apresentação antes de publicar.
5. Revisar exportação/recuperação, segredos no servidor, dependências e resposta a incidente. Não foram executados pentest, ataques ou testes de carga nesta etapa.

## Evidências e limites

Nenhuma consulta de logs foi executada nesta análise. Usados: uma consulta de catálogo/tamanho, um Security Advisor e leitura do painel Usage. Não há evidência suficiente para afirmar ausência de invasão ou homologação de segurança. Não houve mudança de plano, desativação de proteção, troca de credenciais, bloqueio de usuários nem instalação de monitor recorrente.

Typecheck local passou. Não foram adicionados ou executados testes.

Referências:
- https://supabase.com/docs/guides/platform/manage-your-usage/logs-query
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/auth/password-security
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Atualização de publicação

As otimizações e headers iniciais deste relatório foram publicados na versão 9a016436-983a-4ac7-a880-3fa7da925f2b; a integração posterior de páginas e briefing foi publicada na versão c8cc662f-4711-4966-9e20-fb0c2f04127d. Ver docs/evidence/2026-10-24-editorial-egress-optimization.md e docs/evidence/2026-10-24-pages-briefing-light-release.md. O status local descrito acima é a fotografia da primeira análise, substituído por essas entregas. As pendências de segurança operacional, MFA e medição longitudinal permanecem.
