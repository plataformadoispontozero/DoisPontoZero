# Planejamento editorial automático — 22/10/2026

## Entrega

- Etapa3 substituída por plano automático, sem campos para escolher quantidade por formato, lâminas ou cenas.
- Volume parte do cadastro do cliente, padrão12 e teto12 materiais. Um carrossel completo conta como um material. Em12:5posts,4carrosséis,3Reels; volumes menores são distribuídos sem exceder o contrato.
- Carrossel padrão5 lâminas; ampliação na revisão limitada a8. Roteiros novos automáticos alternam30/40/50 segundos e3/4/5cenas.
- Arte com título até10 palavras, apoio curto e corpos curtos nas lâminas. A legenda reúne contexto, orientação, fato aprovado e chamada. Um fato longo não é cortado na arte: orienta ler o conteúdo completo na legenda.
- Direção mantém prefill de cadastro/briefing, preserva edição humana e importa campos explícitos de fatos aprovados, termos proibidos, temas a evitar e direção visual. Sem inferir fatos a partir de texto comercial.
- Histórico do próprio cliente exclui temas do mês anterior mesmo quando mudaria o ângulo. Assinaturas já usadas continuam bloqueadas. Falta de temas elegíveis interrompe a geração com orientação de revisão, sem salvar pacote repetido.
- Contexto revisado e aprovado do Drive permanece fonte explícita; geração não é descrita como IA.

## Contratos e limites

ENGINE_VERSION continua campaign-rules-1.0 porque o guard SQL exige esse identificador e verifica versões de briefing/repertório. A política nova é identificada pelas rules e planningMode. Campanhas salvas antigas carregam sem reescrita. Motor e validação de salvamento do frontend rejeitam mais de12 materiais. O CHECK remoto continua aceitando até90 por compatibilidade; eventual endurecimento de novos INSERTs é responsabilidade de integração, sem rewrite dos dados legados.

Meses com poucos temas novos podem exigir revisão humana após consultar histórico; o motor é determinístico e não faz pesquisa externa nem análise semântica por IA. Durações legadas e ajustes explícitos de roteiro continuam compatíveis; a criação automática utiliza apenas30/40/50s.

## Evidências

46 testes editoriais em6 arquivos aprovados na primeira reexecução. Reexecução final após ajustes de cópia/validação:46 testes/6arquivos aprovados (3,15s). Logs locais /tmp/editorial-automatic-test.log e /tmp/editorial-automatic-final-test.log. Typecheck inicial encontrou erro externo em BriefingPdfDocument (Letter versus LETTER) e requestedCounts sem tipagem; requestedCounts foi tipado em EditorialContext e a outra frente corrigiu o PDF. Typecheck conjunto final aprovado, sem erros. Não houve fullsuite, build, deploy, commit ou escrita remota nesta frente.
