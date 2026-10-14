# Conteúdo ampliado das demandas — 14/10/2026

Solicitação: melhorar a leitura de post, carrossel e roteiro, substituindo a pequena área de descrição no pop-up central.

## Mudanças
- Leitura por padrão: fonte de 16px, espaçamento maior, quebra de texto e blocos sem corte de linhas.
- Pop-up com limite de 1100px e 92dvh, com rolagem no conteúdo principal.
- Identificação dos cabeçalhos já presentes: lâminas/slides, cenas, texto da arte, apoio, legenda, composição e direção visual.
- Roteiros manuais com cabeçalhos explícitos inline também são divididos visualmente; texto livre permanece integral.
- Editar conteúdo abre a descrição canônica inteira; textarea cresce com o texto e mantém salvamento ao sair do campo.
- Correção de campo limpo: salvar string vazia é permitido, sem converter a edição para undefined.
- Nenhuma alteração de banco, migração, calendário ou registros do Aurora Café. O parser não reescreve dados nem inventa lâminas/cenas.

## Verificação
- 360 testes passaram em 92 arquivos no snapshot isolado, que exclui trabalho pendente de outros módulos.
- 5 testes do novo leitor: carrossel, roteiro, post, texto livre/edição e escape de HTML.
- 12 testes Playwright passaram em desktop/mobile; incluem leitura de cinco lâminas, três cenas, campo amplo e preservação do texto após salvar. API controlada, sem escrita real nos registros.
- Typecheck e lint concluídos; lint mantém avisos existentes do projeto.
- Ajuste final de largura rechecado com os cenários de carrossel/roteiro e assert de mais de 900px em desktop.

## Limites e rollback
Descrições sem cabeçalhos explícitos ficam como texto livre. Não há conversão automática de estrutura ou sincronização adicional com o calendário. Reverter o commit restaura a interface anterior; não há dados a remover.

## Publicação
Build de produção concluído. A verificação final de largura/leitura passou nos quatro cenários desktop/mobile. Publicação concluída:
- Commit funcional `3e63970`, push na branch `codex/master-audit-15-1`.
- Cloudflare Worker `474a22df-4fd1-48d6-911f-3bb2c1fc4da2`.
- Domínio entregou `index-Bq7zi-0g.js` e `TaskDetailPanel-5FA-2qxu.js`; componente conferido byte a byte contra o build.
- Nenhuma migration ou alteração de dados foi executada nesta entrega.
