# Conteúdo legível nas demandas

Solicitação: ampliar a leitura de posts, carrosséis e roteiros no pop-up central.

- [x] Leitura por blocos com tipografia maior e sem textarea pequena.
- [x] Identificar cabeçalhos existentes de lâminas, cenas, legenda e direção.
- [x] Editor de texto completo cresce com o conteúdo; campo limpo pode ser salvo.
- [x] Preservar o texto canônico, sem reescrever descrições no parser ou consultar outra fonte.
- [x] 360 testes passaram na versão isolada; 12 testes de navegador desktop/mobile passaram.
- [x] Typecheck e lint concluídos.
- [x] Build de produção concluído.
- [ ] Publicação confirmada.

Arquivos: parseDemandContent.ts; DemandContent.tsx; DemandContent.test.tsx; TaskDetailPanel.tsx; esta story.

Não muda schema ou estrutura de tarefas. Conteúdo livre continua disponível integralmente. Roteiros sem cabeçalhos explícitos continuam como texto livre; nenhuma cena é inventada. Rollback: reverter o commit de interface.
