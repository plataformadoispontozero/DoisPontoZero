# Otimização de transferência editorial — 24/10/2026

## Publicado

- Migração `20261024034453_editorial_summary_egress.sql` aplicada com sucesso.
- View de resumos sem copies/contexto; security_invoker=true verificado em catálogo, SELECT negado a anon e permitido a authenticated, sujeito ao RLS original.
- Listas de calendários e Social Media usam a view; calendário completo é carregado por ID ao abri-lo.
- Polling de listas/avaliações editoriais e Social Media: 60s; notificações: 30s; background polling explicitamente desativado na configuração padrão.
- Cabeçalhos de referrer, no-store e noindex dos links de acesso incluídos.
- Worker versão `9a016436-983a-4ac7-a880-3fa7da925f2b` no domínio atual doispontozero.renatodesigner.com.br.

Build de publicação preparado em /private/tmp/2zero-free-optimization-release com HEAD e somente os seis arquivos de otimização/cabeçalhos. As outras alterações locais de briefing, apresentação e site público não entraram nesta publicação. Nenhuma migração pendente dessas outras entregas foi aplicada.

## Evidências

- TypeScript e build passaram. Nenhum teste adicionado ou executado.
- Duas campanhas existentes: representação JSON calculada no banco, 122.865 bytes na listagem completa anterior vs 432 bytes nos campos do resumo. Não é medição do tráfego HTTP real, nem economia total da organização. A consulta de amostra incluiu arquivados; a interface mantém filtro de ativos/arquivados.
- Advisor após DDL: mesmos quatro grupos já registrados (21 INFO de RLS sem policy, 10 WARN de definer anon, 46 WARN de definer authenticated, 1 WARN de proteção contra senha vazada). Sem novo grupo de alerta.
- Conferência visual de leitura em produção: cliente Ambience com 1 calendário ativo, 12 conteúdos; clique carregou calendário, resumo 4 posts/4 carrosséis/4 reels e cards. Nenhum conteúdo salvo, enviado, aprovado ou modificado na conferência.
- Captura local: /private/tmp/2zero-otimizacao-calendarios.png.

Limites: não houve medição longitudinal de egress, teste de carga ou certificação de isolamento multiusuário. A melhora real deve aparecer nos próximos números do painel Usage. Contadores já acumulados não diminuem retroativamente.
