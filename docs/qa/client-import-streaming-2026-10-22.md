# Importação grande de clientes — 22/10/2026

Perfil Agency Agents aplicado: `.codex/agents/engineering-frontend-developer.toml`.

## Implementação

- Seleção de CSV/JSON até **1 GiB**, **512 colunas**, **1.000.000 registros**.
- `File.slice()` + `TextDecoder` UTF-8 fatal em blocos de 64 KiB. Nenhum `File.text()` ou `arrayBuffer()` do arquivo inteiro no caminho real de upload.
- CSV aceita BOM, vírgula/ponto e vírgula, campos entre aspas, aspas escapadas, CRLF e linhas internas aos campos, inclusive quando divididos entre blocos.
- Parser JSON incremental valida a estrutura inteira. Materializa somente um cliente por vez; aceita array raiz, `clients`, `clientes`, `data` e `data.clients`/`data.clientes`. Dados simples em `profile` são achatados para a mesma revisão e mapeamento do CSV.
- Primeira passagem verifica sintaxe, conta todos os registros e descobre todos os cabeçalhos JSON. Retém apenas uma prévia de até 100 registros e 4 MiB de texto; campos descobertos tardiamente são alinhados na prévia.
- Segunda passagem, ao clicar **Revisar importação**, valida o arquivo completo com os campos mapeados e índices de duplicados. Informa quantidade elegível e inválida antes de oferecer **Confirmar**. Campos extras/faltantes do CSV tornam aquela linha inválida. Inválidos e duplicados não autorizados são ignorados com contagem explícita. A opção de incluir o restante do arquivo é visível e pode ser desmarcada para importar somente a prévia selecionada.
- Terceira passagem somente após confirmação. RPC existente `import_clients_csv` recebe lotes sequenciais de até 100 registros / 1 MiB, preservando limites e permissões do backend. Cada resposta deve conter um resultado para cada linha enviada; não há sucesso presumido. Contadores por status cobrem todas as respostas, detalhamento limitado às primeiras 100.
- Progresso da leitura e cancelamento nas passagens. Cancelamento durante gravação impede próximos lotes; não desfaz lotes enviados. Falha informa quantos receberam resposta e que o lote em andamento pode ter sido gravado. Repetição exige nova revisão. Troca de agência/desmontagem aborta os próximos lotes.

## Limites deliberados

- Campo: até 262.144 caracteres; registro: até 2.097.152 caracteres de texto; cabeçalho: até 200 caracteres; JSON: profundidade até 32. Arrays/objetos aninhados no cliente continuam recusados, exceto `profile` com valores simples. Não aceita anexos/base64 gigantes embutidos no cliente.
- O tamanho de arquivo é em bytes; os limites de texto por campo/registro usam caracteres UTF-16 para limitar memória. JSON escapado conta também no orçamento de registro. A validação não garante aceitação de qualquer arquivo arbitrário de 1 GiB: os limites estruturais também se aplicam.
- O índice de duplicados retém no máximo 1 milhão de slugs válidos de até 100 caracteres. O pior caso pode requerer centenas de MB de memória do navegador. O arquivo completo não fica na memória; cada passagem relê o arquivo selecionado. Dispositivos com pouca memória devem dividir exportações extensas.
- O progresso exibido é de leitura/validação local; não representa porcentagem de clientes gravados. Gravação mostra separadamente registros com resposta do servidor.
- A importação em vários lotes não é uma transação global. Falhas/cancelamento podem deixar lotes anteriores gravados, explicitamente sinalizados. Dados reais não foram importados nem alterados durante os testes.
- Não foi executado arquivo físico de 1 GiB. O teste de limite superior usa metadados simulados; o teste real de streaming usa arquivo acima do limite anterior de 2 MiB. Não foi medido heap real de navegador nem tempo para 1 GiB.

## Verificação

Testes dirigidos em `csv.test.ts`, `json.test.ts`, `stream.test.ts`, `ImportClientsPage.test.tsx`:

- Unicode/UTF-8 e aspas divididos em blocos de 3 bytes.
- 1.200 registros, retenção de 100 e consumidor sequencial aguardado.
- Arquivo real acima de 2 MiB com 6.000 clientes; upload inteiro proibido pelo mock.
- 200 colunas aceitas, 513 rejeitadas; erros depois da prévia rejeitam o arquivo completo.
- Cabeçalhos JSON novos no fim; passagem seguinte mantém alinhamento.
- Cancelamento, campos grandes, tamanho acima de 1 GiB, duplicados entre lotes e CSV com número incorreto de campos.
- UI: zero chamadas RPC antes da confirmação; 250 clientes enviados em 100/100/50; falha após primeiro lote informa gravação parcial e lote ambíguo; importar somente prévia.

Resultado final de testes e compilação deve ser registrado pelo integrador após a revisão conjunta. Não executado build/deploy/commit neste agente.

## Integração

47 testes dirigidos aprovados em quatro arquivos, /private/tmp/import-tests.log. Typecheck/build aprovados pelo integrador; limites publicados e visíveis em /settings/integrations/import-clients. Evidência /private/tmp/import-limits-published.png. Nenhuma importação real foi confirmada durante a conferência em produção.
