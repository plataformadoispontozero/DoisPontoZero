# Motor editorial de campanhas — primeira evolução

Implementado em 12/10/2026 a partir da especificação enviada. O motor usa regras determinísticas, sem IA. Preserva calendário mensal, revisão, link público de aprovação e produção idempotente. A nova interface foi enviada ao GitHub e publicada no Cloudflare nesta rodada.

## Operação da social media

1. Em Calendário Editorial, selecione cliente, briefing e mês. Confira os campos reconhecidos do briefing; campos não reconhecidos precisam de preenchimento humano.
2. Selecione a estratégia desse cliente. Pilares, temas, pesos e formatos entram na seleção. Objetivo, público, tom e posicionamento da estratégia completam campos vazios; restrições são reunidas. O briefing permanece prioritário.
3. Informe temas prioritários, assuntos a evitar, fatos aprovados, termos proibidos e direção visual. Temas manuais funcionam como um pilar adicional de prioridades com peso 100. Os pesos dos outros pilares são editados em Estratégia.
4. Configure quantidades de posts, carrosséis e reels. São propostas para revisão, não publicações obrigatórias. Limite de 30 por formato e 90 no total.
5. Antes de gerar, escolha slides do carrossel (3–10), cenas do reel (3–10) e duração (10–90 segundos, pelo menos 2 segundos por cena). Padrões: 7 slides, 3 cenas, 30 segundos. Cada peça também permite ajustar sua estrutura. Reduzir remove blocos excedentes; remontar é uma ação explícita e preserva textos estruturados existentes.
6. Revise a prévia, distribuição, ficha estratégica, direções visuais, alertas e copies. Lacunas aparecem como `[Completar...]` ou `[Complementar...]`; o link de aprovação fica bloqueado no servidor enquanto esses marcadores permanecerem.
7. Salve o rascunho. Gere o link após a revisão. O cliente pode sugerir copy/observações e aprovar o calendário conforme o fluxo existente. A aprovação é do calendário inteiro, pela ação explícita do cliente.
8. Gere produção após aprovação. A ação repetida retorna o mesmo projeto. Tarefas recebem a copy atual e as direções visuais, sem acrescentar textos antigos da ficha gerada. Editar antes da produção reabre o rascunho e revoga links anteriores; campanhas já convertidas em produção continuam bloqueadas para edição.

## Repertório e integridade

Gestor, administrador e proprietário podem ativar famílias e editar ângulos. A autorização é conferida no banco, além da interface. Social media usa/revisa o repertório. Cada alteração cria uma versão; geração com versão antiga exige atualização da prévia.

Há sete famílias iniciais: educativa, problema/orientação, escolha informada, institucional, convite/ação, diferencial documentado e processo confirmado. As duas últimas exigem fatos aprovados informados pela equipe. Os blocos de texto continuam fixos nesta primeira evolução; novos ângulos não criam redação semântica automaticamente.

A seleção distribui as quotas exatas entre pilares elegíveis, temas e famílias, com preferência simples por conversão em objetivos de contato/vendas. Formatos incompatíveis, termos proibidos e temas evitados são filtrados. Quando acabam as combinações elegíveis, a geração inteira é interrompida com alerta; nenhuma proposta parcial é salva.

O histórico consulta todas as campanhas registradas do cliente e o banco de ideias das suas estratégias, incluindo descartadas e estratégias arquivadas. Assinaturas normalizadas de tema/família/ângulo e tema/ângulo bloqueiam reaproveitamento da ideia essencial, mesmo em outro formato ou mês. Tema recorrente com outro ângulo recebe alerta com referências anteriores. O servidor confere os vínculos, repertório e assinaturas; usa bloqueio transacional por cliente e índices únicos. Não foi realizado teste de carga concorrente em múltiplas sessões.

Um único calendário por cliente/mês é permitido. A campanha não troca cliente ou mês depois de criada. Briefing atualizado exige reimportação quando houver revisão de conteúdo. Cada salvamento que altera conteúdo/contexto registra versão imutável, autor, contexto, peças, briefing e estratégia/pilares efetivamente consultados. A primeira captura de campanhas antigas preserva o conteúdo existente; não reconstrói briefings históricos que não haviam sido registrados.

A ficha pública exclui metadados internos de estratégia. As tabelas de histórico têm RLS, leitura autenticada autorizada e nenhuma escrita direta para usuários. As duas novas RPCs não são executáveis por `anon` e usam caminho de busca fixo.

## Limites e próximos passos da especificação

O motor não interpreta qualquer restrição, tom ou fato em texto livre. O tom distingue linguagem formal/técnica e direta/neutra; as demais nuances precisam de revisão. Termos proibidos explícitos e algumas instruções padronizadas são reconhecidos. Informações factuais são confirmadas pela equipe, sem verificação externa automática. A direção visual é sugestão de material a produzir, não evidência de foto/cena existente.

As checagens de concisão detectam blocos repetidos, extensão e pendências; não cortam texto automaticamente. O limite técnico de copy permanece 3.000 caracteres; tema, 200. Similaridade é determinística e não garante ausência de equivalência semântica. A ficha conserva a proposta de origem e sinaliza edição manual; a copy editada é o conteúdo vigente.

Ainda pendentes da especificação ampliada: editor livre de blocos/CTAs, distribuição personalizada por objetivo/jornada, termos obrigatórios/preferidos, datas sazonais e preferidas, frequência avançada, exceções recorrentes justificadas, painel completo de decisões de similaridade/desempenho e registro separado de tentativas de geração malsucedidas. Tentativas e alertas aparecem na prévia; versões salvas registram parâmetros, fontes e regras. Aprovação por peça não foi adicionada. Não há publicação automática nem conexão Meta/IA nesta entrega.

## Validação e implantação

- 131 testes unitários em 30 arquivos: quotas, mês, estruturas, duração, histórico/descartadas, client isolation, lacunas, restrições, repertório, pesos, esgotamento, concisão e lote máximo.
- 72 cenários de regressão de interface em desktop/tablet/mobile; 6 execuções finais de geração/aprovação e 3 cenários adicionais de integração com estratégia/pilares passaram. Testes de interface usam API controlada e não substituem RLS real.
- Testes SQL reais, em transações revertidas: versões, repetição entre campanhas, duplicidade interna, outro cliente, termo proibido, remoção de ficha, mês imutável, briefing desatualizado, estratégia/pilar de outro cliente, lacunas antes do compartilhamento, snapshot público, feedback, revogação/aprovação, produção idempotente e autorização de repertório. Nenhum fixture permaneceu no projeto.
- Typecheck e build de produção passaram. Lint sem erros; permanecem avisos existentes, incluindo o efeito de importação do briefing.
- Migration aplicada em `pvkhlobsiszrjtblpruu`: `20261012033627_campaign_editorial_engine.sql`. Verificação posterior confirmou ausência de permissão anônima nas novas RPCs e de escrita direta no histórico.
- Advisors não adicionaram avisos de caminho mutável/RLS. As duas RPCs autenticadas aparecem no aviso genérico de SECURITY DEFINER: uso intencional com autorização explícita. Avisos anteriores do projeto continuam fora desta alteração.
- Push confirmado: `e487494ac7581a52a53e64f275f7bc6410b22119`, branch `codex/master-audit-15-1`. Worker publicado: `0930289d-8b18-4bd6-82e6-4b54ecc7f4a1`; bundle `index-DPnTtuTf.js`. Domínio verificado em desktop/mobile: início/login HTTP 200, editorial exige sessão, sem overflow. Fluxos autenticados foram validados com API controlada e SQL real; não houve homologação manual autenticada no domínio com uma campanha real.

Teste SQL reproduzível: `supabase/tests/campaign_editorial_engine.sql`. Executar como administrador de teste, dentro de `BEGIN`/`ROLLBACK`, definindo `test.editorial_agency_id` e `test.editorial_owner_id` com `set_config(...,true)` antes. Nunca confirmar os fixtures. Os testes pressupõem repertório inicial sem versões persistidas e um proprietário ativo autorizado; usar ambiente de homologação para execuções futuras.
