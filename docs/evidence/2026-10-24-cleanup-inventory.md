# Inventário para revisão de limpeza — 24/10/2026

Projeto Supabase: pvkhlobsiszrjtblpruu. Agência: a0f00e64-e8ba-44e5-b0cf-2ad7adb44211.

**Somente leitura. Nada excluído.** Autorização atual: analisar e apresentar lista antes de apagar.

## Registros candidatos

| Tipo | Identificação | Situação e vínculos observados |
|---|---|---|
| Projeto | `560ee08a-0cf6-4e93-a9fe-21bec7fe2613` — teste | Planning; sem cliente; 1 demanda, 1 quadro, 1 membro; sem calendário, reunião, canal de chat ou vínculo Drive |
| Demanda | `3069eeff-aaac-4204-9a38-308c9cbfe7ef` — teste | Arquivada, dentro do projeto acima; sem cliente, anexos ou comentários |
| Modelo | `dfda3300-1eb3-461d-812a-df7faa815c9b` — Aurora Café — MODELO DE TESTE | Publicado; 0 briefings vinculados; 1 seção, 7 perguntas; 0 modelos derivados |

O nome indica teste, mas não constitui autorização de exclusão nesta etapa. Uma eventual remoção do projeto precisa incluir avaliação das dependências em cascata; projeto e demanda não são operações independentes.

## Arquivos armazenados no Supabase

- `agency-site-media`: 12 WebP; 3.857.072 bytes.
- `profile-avatars`: 1 JPG; 417.877 bytes, referenciado por perfil.
- Cada um dos 12 WebP é referenciado pelo conteúdo salvo do site. Não foi identificado arquivo órfão nesses 13 objetos nas verificações de referências realizadas.
- Há seis pares com mesmo tamanho e ETag. Isso sugere conteúdo duplicado, mas não foi realizada comparação binária. Como ambos os caminhos são referenciados, não excluir sem primeiro consolidar as referências e revisar a apresentação desejada no site.
- Rascunhos locais do navegador não foram inspecionados.

Pares no bucket `agency-site-media` (prefixo comum é o UUID da agência acima):

| Caminho 1 | Caminho 2 | Bytes por arquivo |
|---|---|---:|
| 7d8bc2b8-34ef-445f-96ea-509d7d7745ad.webp | b6b73c2f-3d25-407e-baaa-e3aab7491ba0.webp | 277338 |
| ab65619b-12c6-46d6-a2d6-819dfc349ff8.webp | 8aafaf0d-5364-4333-8d97-9f820e37d627.webp | 275052 |
| 3c058768-e761-4cfd-ad59-34ed0733f09b.webp | e5f2d2db-af8a-4027-acf2-43c601c85677.webp | 337348 |
| e25cdf8b-3de9-4d3f-9628-0f9432e6b96b.webp | 1e4d7f1f-4aed-4c29-8de8-69b873cf6237.webp | 378982 |
| 0146e7c9-89a5-40c2-9ed1-8ef461da6eba.webp | ba33179b-a09e-43aa-8e00-09ad0c4aa778.webp | 298136 |
| fc7e17d3-70f8-49b9-84db-1aab326a918f.webp | 7b401b18-1dbe-402d-b735-4abe27b2c9ac.webp | 361680 |

## Referências do Google Drive para revisar

Existem 22 registros em `drive_file_references`. Dez não possuem vínculo em `project_drive_files` ou `presentation_assets`; nenhum dos dez coincide com original ou prévia de `task_attachments` por Google file ID. **São metadados de arquivos reais do Drive, não arquivos comprovadamente descartáveis.** Não foi consultado o conteúdo desses arquivos nem sua lixeira. Outras referências em documentos, snapshots, chat ou sistemas externos não foram esgotadas. Não excluir arquivos do Drive com base nesta lista.

| ID da referência | Nome |
|---|---|
| a4938f28-d3fd-4334-bae9-c070335c3b5d | POST_ENGSERV - OUT 1.png |
| 8b6ab362-732e-4994-840b-f64ce6e216eb | POST_ENGSERV - OUT 1.png |
| 37951478-9d5c-4187-b9f0-effbc0394833 | POST_ENGSERV - OUT 2.png |
| e2a7655b-4afb-4eed-a799-6e728297ec8f | POST_ENGSERV - OUT 5.png |
| 2e51996d-b527-421b-9d28-cdf36aa3485b | POST_ENGSERV - OUT 6.png |
| 540192e9-a9a9-4843-a559-1e05d680cdf0 | POST_ENGSERV - OUT 5.png |
| 236fbccd-ac74-408b-b036-18883150687a | POST_ENGSERV - OUT 4.png |
| b7ea9b19-4682-492f-938d-749baf47dbe8 | POST_ENGSERV - OUT 3.png |
| 8dd0be68-dda7-4100-8d4b-1df90a2734dd | POST_ENGSERV - OUT 2.png |
| 463abd53-01f9-4cd3-892e-61b329729165 | POST_ENGSERV - OUT 1.png |

Os tamanhos informados nesses registros correspondem aos arquivos externos; apagar metadados não recupera esse volume no banco Supabase.

## Preservar

22 modelos chamados “Briefing histórico migrado”, em rascunho: todos possuem briefings vinculados. O nome genérico não significa teste. Preservar seus dados e respostas reais.

## Limitações e controles

Consultas SQL somente de leitura, com seleção de nomes/IDs, contagens, caminhos e metadados mínimos. Uma consulta inicial com conversão de linhas completas para procurar referências foi rejeitada pela revisão automática por escopo amplo; substituída por consultas a campos específicos e contagens. Nenhuma alteração SQL, exclusão, exportação de conteúdo de clientes ou download de arquivos foi realizada. Revalidar vínculos imediatamente antes de qualquer limpeza futura.

## Execução autorizada posterior

O responsável autorizou excluir os testes após revisar o inventário. Executada uma transação com bloqueio dos três registros e validação de nome, agência, projeto sem cliente, demanda única arquivada e ausência de vínculos adicionais com materiais, calendário, reuniões, chat, apresentações ou briefings.

Excluídos o projeto `560ee08a-0cf6-4e93-a9fe-21bec7fe2613`, sua demanda `3069eeff-aaac-4204-9a38-308c9cbfe7ef` e o modelo `dfda3300-1eb3-461d-812a-df7faa815c9b`, com suas dependências estruturais em cascata. Consulta após commit confirmou zero registros restantes para os três IDs. Não houve exclusão de clientes reais, arquivos do Storage ou arquivos do Google Drive. Os 22 modelos históricos reais não integraram o escopo de exclusão.

Origem das novas imagens da hero e do portfólio: aguardando o link da(s) pasta(s) do Drive informado pelo responsável. As imagens atualmente publicadas permanecem até a substituição ser definida.
