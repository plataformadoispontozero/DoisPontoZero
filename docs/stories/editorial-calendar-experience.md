# Experiência do calendário editorial e conteúdo para produção

Status: In progress — análise do legado concluída; implementação em andamento.

## Solicitação atual

Analisar o calendário da plataforma anterior Lovable e aprimorar o calendário Dois.Zero com conteúdo útil para a equipe: carrossel com textos distintos por slide e legenda completa; reels com roteiro, fala, texto na tela, tempo e direção visual; post com ideia, copy e indicação visual. Separar a página de geração da página organizada de demandas editoriais, abrindo essa organização após gerar e salvar um rascunho.

A geração não concede aprovação do cliente e não inicia produção automaticamente. Fluxos existentes de revisão, histórico, aprovação e produção devem continuar válidos. Esta story não autoriza push nem importação adicional de registros reais.

## Análise efetiva dos artefatos locais

Fonte lida somente no filesystem: `/Users/designer/Documents/Codex/2026-10-12/legacy-export/calendarios*.json` e `demands*.json`. Não foram enviados nomes, IDs de clientes, copies ou detalhes privados a serviços externos.

### Estrutura observada

- 103 registros de calendários nos arquivos locais; 100 têm `conteudo_estruturado` como lista, dois como string e um nulo. As listas contêm 1.200 peças. Uma normalização deve distinguir essas formas, não assumir uma estrutura única.
- 326 registros de demandas guardam `approved_snapshot`, com cópia da peça aprovada e seu conteúdo estruturado. Isso evidencia a separação entre planejamento e material enviado à produção.
- A peça editorial contém `tema`, `headline`, `gancho`, `objetivo`, `pilar`/`pilar_editorial`, `ideia`/`ideia_central`, `sugestao_visual`, `direcao_criativa`, `etapa_jornada`, `cta`, `legenda`, `legenda_resumida`, `pontos_validacao`, `rede_social` e `kpi`, com presença variável entre versões.
- Carrossel: `payload.carrossel.slides[]` contém `ordem`, `tipo`, `titulo`, `corpo` e, conforme a versão, `nota_design` e `visual`. O carrossel guarda ainda `qtd_slides`, `fluxo_persuasao`, `legenda_completa`, `cta_final` e `hashtags`.
- Reels: `payload.reels.cenas[]` contém `ordem`, `tempo`, `fala`, `texto_tela` e `visual`. O roteiro guarda ainda `gancho_3s`, `estrategia_retencao`, `objetivo_video`, `tipo_gancho`, `trend`, `legenda_completa`, `cta_final` e `hashtags`.
- Post: `payload.post` contém `headline`, `gancho`, `desenvolvimento`, `legenda_completa`, `cta`, `hashtags` e `variacoes_copy`. A direção visual está também nos campos externos da peça, não apenas no payload específico do post.

### Qualidade verificável da estrutura

Nos 164 carrosséis que possuem payload estruturado, foram encontrados 865 slides, entre três e seis por peça. Nenhum desses carrosséis repetiu exatamente o título ou o corpo entre seus slides após normalização simples de espaços/capitalização. A mediana do corpo foi 112 caracteres; a legenda completa teve mediana de 516 caracteres, com valores entre 235 e 916. Esses dados justificam separar título, texto do slide e legenda, sem repetir uma mesma frase em todos os cards.

Nos 330 reels com payload estruturado, 319 têm quatro cenas. Os 1.302 tempos de cena observados são strings de intervalos, e a mediana da fala é 83 caracteres. Há seis roteiros com lista de cenas vazia e falas vazias em alguns registros. Portanto, usar o schema como referência não significa declarar todo conteúdo antigo completo, correto ou aprovado para um novo cliente.

Os números acima descrevem os arquivos exportados lidos nesta análise, não quantidade de clientes ou resultado de campanhas, nem avaliação factual das copies.

## Critérios de aceite

### Conteúdo útil e estruturado

- [ ] Carrossel apresenta quantidade configurável de slides, com função narrativa, título, corpo e direção visual por slide; textos são distintos dentro da peça.
- [ ] Carrossel tem progressão coerente de capa/gancho, desenvolvimento e fechamento/CTA, além de legenda completa separada dos textos da arte.
- [ ] Reels apresenta quantidade configurável de cenas e duração total, com intervalo/tempo, fala, texto de tela e indicação de gravação/visual para cada cena.
- [ ] Tempos de cena somam a duração configurada. Gancho inicial, desenvolvimento e CTA têm papéis claros; uma instrução genérica repetida não equivale a roteiro completo.
- [ ] Post apresenta ideia central, headline/gancho, desenvolvimento, legenda completa, CTA e sugestão visual que explique o material a produzir.
- [ ] Conteúdo é baseado no cliente, briefing/contexto e fatos revisados disponíveis. O motor não inventa resultados, preços, depoimentos, serviços ou materiais existentes para completar campos.
- [ ] Quando faltarem informações aprovadas, o sistema identifica o campo pendente e permite revisão. Nenhuma pendência pode ser apresentada como fato confirmado ou roteiro pronto.
- [ ] Fatos obrigatórios, limites, termos proibidos, temas evitados, histórico e antirrepetição existentes continuam aplicados ao conteúdo de todos os blocos.
- [ ] Editar um slide/cena/legenda preserva os demais campos. Alterar quantidades não apaga revisão manual silenciosamente.
- [ ] Conteúdo anterior continua legível e editável; formato novo não invalida rascunhos e campanhas já salvos.

### Geração separada da organização

- [ ] Página de geração concentra cliente, mês, contexto/briefing, estratégia/pilares, quantidades, slides/cenas/duração e validação das entradas.
- [ ] Gerar e salvar cria uma campanha **em rascunho**, usando persistência existente e seus controles de versão/histórico.
- [ ] Após sucesso de gravação, navega para a página organizada da campanha/demandas. Falha ao salvar mantém entradas e prévia acessíveis; não navega para campanha inexistente.
- [ ] Página organizada permite localizar conteúdo por data/formato/estado, ver detalhes completos, editar e revisar as peças, sem repetir todo o formulário de geração.
- [ ] A organização lista peças do rascunho editorial. Não cria tarefas reais de produção antes da aprovação exigida pelo fluxo atual.
- [ ] Retornar à geração/revisão mantém cliente e campanha corretos. Repetir clique/retentativa não cria campanhas duplicadas nem perde conteúdo salvo.
- [ ] A organização oferece as ações existentes de apresentação/revisão, link de aprovação, ajustes e produção com estados e permissões corretos.
- [ ] Campanha em rascunho, pendente ou com alterações não libera produção. A criação de tarefas continua passando pelo RPC de produção após aprovação e preserva idempotência.

### Persistência, aprovação e compatibilidade

- [ ] Payload estrutural salvo conserva slide/cena, legenda e direção visual, além de origem, regras e versão interna do motor.
- [ ] Snapshot para aprovação apresenta todo o conteúdo criativo necessário ao cliente, sem expor trace interno, histórico privado, dados de integração ou campos sensíveis.
- [ ] Material enviado à produção corresponde à versão aprovada. Revisão posterior revoga/renova o fluxo conforme as regras existentes, sem modificar silenciosamente uma aprovação anterior.
- [ ] Limites de caracteres/tamanho são coerentes entre UI, motor, RPCs, snapshots e tarefas. Conteúdo acima do limite gera mensagem e possibilidade de ajuste; não é truncado silenciosamente.
- [ ] Dados legados são lidos defensivamente e não são atribuídos a outro cliente. O legado é referência estrutural e histórica, não autorização para reaproveitar fatos de terceiros.
- [ ] Agência, cliente e permissões são validados no servidor; mudar ID na rota ou payload não concede acesso a campanha de outra agência.
- [ ] Interface funciona em desktop/tablet/mobile com cards legíveis, edição acessível e sem overflow.

## Decisões de arquitetura para implementação

1. **Um motor e um registro de campanha.** Estender o motor atual, em vez de criar um gerador paralelo. Manter quotas, assinatura de ideia, histórico e versão. A organização lê as peças desse registro.
2. **Conteúdo criativo separado de rastreamento interno.** Slides/cenas/legenda devem ser campos próprios da peça ou ter uma serialização compatível completa. Dados de origem e regras são trace interno. O snapshot público deve usar whitelist de conteúdo criativo; não publicar o objeto interno inteiro.
3. **Compatibilidade por adaptação, não reimportação.** Conteúdos antigos com `copy` e `editorial.slides[].text`/`scenes[].text` continuam apresentáveis. Campos detalhados novos podem ser opcionais para leitura antiga, mas são exigidos/conferidos quando gerados pela versão nova.
4. **Organização editorial não é fila de produção.** Abrir o workspace após salvar rascunho cumpre a jornada. A criação de tasks reais permanece no comando existente `produce_monthly_editorial`, condicionado à aprovação.
5. **Persistência precede navegação.** A geração salva somente após validação; o ID retornado direciona ao workspace. A prévia fica preservada em caso de erro. UI e RPC precisam lidar com retentativa/idempotência do mesmo cliente/mês.
6. **Direção visual é proposta de execução.** Descrever composição, enquadramento, elemento gráfico/gravação e texto associado; não afirmar existência de fotos, pessoas, provas ou filmagem ainda não fornecidas.

## Pontos atuais que exigem revisão

- `MonthlyItem.copy` agrega atualmente textos, e o motor valida um limite de 3.000 caracteres. Uma peça com dez slides e legenda completa pode exceder esse limite mesmo sem texto excessivo por slide. O contrato completo precisa de limites explícitos e coerentes, não corte automático.
- `EditorialTrace` mantém slides com `text/visual` e cenas com `seconds/text/visual`. Ainda não distingue headline/corpo/legenda nem fala/texto de tela.
- O código atual preenche slides extras com marcadores de complementação e direções genéricas. Essas pendências são corretas para evitar fatos inventados, mas não atendem sozinhas à experiência de conteúdo completo solicitada.
- O snapshot público existente remove `item.editorial` inteiro. Se todo conteúdo novo ficar apenas nesse campo e `copy` passar a ser só legenda, o cliente perderá os textos da arte/roteiro. Isso deve ser tratado antes da aprovação pública da versão nova.
- A página editorial atual reúne formulário, prévia, edição, feedback e produção. A nova navegação precisa dividir responsabilidades preservando os handlers/permissões, não apenas esconder campos sem recuperar o estado salvo.

## Verificação e evidências

- [ ] Testes do motor: textos distintos, papéis de slides/cenas, duração, legenda completa, direção visual, limites e ausência de fatos não aprovados.
- [ ] Testes de persistência: payload completo, leitura antiga, snapshot público seguro, revisão, produção somente aprovada e idempotência.
- [ ] E2E: geração → salvar rascunho → organização → edição → revisão/aprovação → produção, com API controlada e escopo de cliente correto.
- [ ] E2E em três viewports com legibilidade/overflow e erros de gravação sem perda de prévia.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, build e `git diff --check` aprovados para os arquivos implementados.
- [ ] Relatório final diferencia conteúdo gerado pendente de revisão, testes simulados e homologação real; não declara todas as peças prontas se houver campos pendentes.

Análise de schema/estrutura e estatísticas dos exports concluída nesta tarefa. Nenhum conteúdo privado de cliente foi incluído na story. Não houve alteração de aplicação, importação, banco, push ou publicação pela tarefa de arquitetura.

## File list

Alterado nesta tarefa:

- `docs/stories/editorial-calendar-experience.md`

Arquivos previstos para implementação/revisão, conforme divisão de trabalho:

- `src/features/editorial/campaignEngine.ts`, `monthlyPlanner.ts` e testes do motor.
- `src/features/editorial/MonthlyEditorialPage.tsx`, novo workspace organizado e componentes de conteúdo.
- `src/features/editorial/PublicEditorialApprovalPage.tsx` e rota/navegação editorial, se necessário para o contrato público.
- Migration CLI/RPCs de gravação, snapshot e produção, caso o novo contrato exija mudança.
- Testes de navegação, revisão e regressão das campanhas existentes.

## Evidências finais

- 237 testes em 58 arquivos, lint e build aprovados. Nove E2E passaram em desktop/tablet/mobile com backend simulado.
- Geração salva rascunho automaticamente e abre workspace; cards abrem editor individual. Edição de uma lâmina preserva as demais e a direção visual; reels apresentam fala, texto na tela, câmera e áudio.
- Falha ao gravar mantém entradas e rota de geração; produção continua bloqueada enquanto calendário não aprovado. Modal tem nome acessível e largura compatível com mobile.
- Não houve geração, aprovação ou produção sobre dados reais. CodeRabbit indisponível. Sem mudanças de banco ou Edge Functions nesta release.

- Push funcional `74d48f1` confirmado. Cloudflare `8d890db8-ccb8-40bc-8889-b5d90abad7fd`; rota `/editorial/new` no domínio oficial entrega `index-DSYpyNqU.js`.
