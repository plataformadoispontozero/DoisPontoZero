# Análise do motor editorial — Dois.Zero

Extraído da documentação e do código do sistema em 12/10/2026. Esta análise não consulta calendários privados de clientes nem altera dados ou motores.

## Fontes internas

- docs/stories/monthly-editorial-workflow.md
- src/features/editorial/monthlyPlanner.ts
- src/features/editorial/MonthlyEditorialPage.tsx
- src/features/editorial/PublicEditorialApprovalPage.tsx
- src/features/strategy/services/editorialEngine.ts
- src/features/strategy/services/briefingIntelligence.ts
- src/features/strategy/components/EditorialGeneratorDialog.tsx

## Dois fluxos existentes

| Capacidade | Calendário mensal /editorial | Área Estratégia |
| --- | --- | --- |
| Base de geração | Cliente, objetivo, público e posicionamento | Pilares, pesos, frequência, formatos e temas |
| Quantidades | Exatas por post/reels/carrossel; até 30 por formato, 90 no total | Calculadas por pilar; não equivalem a um pacote mensal exato |
| Datas | Distribuição uniforme no mês selecionado | Período contado a partir do dia da geração |
| Textos | Templates por formato e seis temas em rotação | Sugestões de tópicos e formatos |
| Briefing | Importação de campos reconhecidos; revisão manual | Mapeamento de respostas para campos estratégicos |
| Aprovação externa | Link com snapshot, observações e sugestões de copy | Não é o mesmo fluxo de aprovação mensal |
| Produção | Após aprovação, projeto/tarefas por especialidade | Gerador salva itens editoriais ou ideias |

Ambos são motores por regras; não existe chamada a modelo de IA nesses arquivos. A área mensal não chama o motor de pilares da Estratégia.

## O que o fluxo mensal já entrega

1. Seleção do cliente, briefing e mês.
2. Quantidades configuráveis, alternância de formatos e datas válidas no mês.
3. Rascunhos editáveis com temas, copy e estrutura simples de reels/carrosséis.
4. Salvamento, link de aprovação da versão e retorno do cliente sem conta.
5. Aplicação manual das sugestões e reemissão de link.
6. Produção após aprovação, com criação atômica/idempotente das demandas; tráfego opcional é planejamento.

A documentação registra homologação remota anterior do fluxo e testes. Esta análise apenas inspecionou o código atual; não executou uma nova homologação real.

## Lacunas verificáveis

- O gerador mensal repete seis temas. Objetivo/público/posicionamento entram no texto, mas tom e restrições importados não alteram a geração.
- Pilares e banco de ideias da Estratégia não alimentam automaticamente o calendário mensal.
- Datas são matemáticas; não há planejamento por dias preferidos, feriados, sazonalidade ou desempenho.
- No motor da Estratégia, as quantidades são calculadas por pilar usando o maior valor entre frequência e peso. Os pesos não garantem uma distribuição exata de um total mensal contratado.
- Pilares podem gerar conteúdos no mesmo dia; não há resolução global de colisões.
- O motor da Estratégia procura uma ideia existente, mas a variável resultante não participa da geração. Não há prevenção efetiva de repetição a partir desse banco nesse trecho.
- Não há análise automática de concorrentes, fatos de mercado, oferta, funil ou métricas Meta. Campos importados não equivalem a pesquisa realizada.

## Direção sugerida para evolução

Unificar o planejamento mensal com a estratégia do cliente: briefing revisado, pilares, temas aprovados, oferta, restrições e pacote de formatos. Manter quantidades exatas e distribuir pilares dentro desse total. Evitar temas já usados, planejar datas preferidas e explicitar objetivo/CTA de cada conteúdo. Incorporar tom e restrições à geração, com revisão humana antes do envio.

IA pode ser uma camada posterior para redação e elaboração de pautas, mantendo regras de quantidade/data e aprovação existentes. Conectar IA ou Meta exige implementação própria; nenhuma conexão é afirmada neste documento.

## Conclusão

O sistema já resolve rascunho, revisão, aprovação e passagem para produção. O principal trabalho de evolução é unificar os dois motores e tornar a personalização estratégica efetiva. A presença dos campos no briefing não significa que todos influenciam a pauta gerada.
