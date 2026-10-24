# Exclusão de briefing e conclusão pública de apresentação

## Exclusão

`delete_briefing_permanently(p_agency uuid,p_briefing uuid,p_confirmation text) -> boolean`.

- Exige `briefings.delete`, autenticação e título exato. Interface deve pedir confirmação explícita digitada.
- Bloqueia referência em calendário, estratégia, proposta ou snapshot histórico editorial. Existe trigger para também proteger DELETE direto.
- Remove briefing e filhos com FK CASCADE: respostas, links públicos, metadados de anexos, versões, registros de exportação e atividade local do briefing.
- Mantém template, cliente, Drive e arquivos de Storage. Não faz operação remota de exclusão de arquivo.
- Grava auditoria global preservada após exclusão; não executamos exclusões reais durante implementação.

## Conclusão de apresentação

`complete_showcase_review(p_token text) -> {completedAt,total,status:'completed'}`.

- Valida token, validade, revogação, agência, apresentação publicada e não arquivada.
- Exige última decisão `approved` para cada material atual, neste mesmo link e na mesma impressão digital do conteúdo atual. Não aprova materiais automaticamente, nem transforma status published em approved.
- Impressão digital usa allowlist: apresentação id/cliente/título/descrição/período; seções id/tipo/título/descrição/conteúdo/posição; materiais id/seção/arquivo/título/descrição/posição; Drive google_file_id/nome/mime_type/modified_time/size_bytes. Ignora timestamps operacionais, sincronização, disponibilidade, miniaturas, publicação e estado de produção. Alterações externas no Drive ainda não sincronizadas não podem ser detectadas pelo banco.
- Migração adiciona `content_hash` às novas avaliações; avaliações antigas não recebem versão retroativa inventada. Para concluir pela primeira vez após a atualização, materiais antigos precisam ser avaliados novamente. Consulta pública de avaliações retorna somente avaliações do link/conteúdo atuais.
- Conclusão é idempotente por link e conteúdo. Registra evento `client_review_completed` e notifica uma vez os gestores, responsável/criador da apresentação e criador do link, desde que ativos e autorizados a `presentations.view`.
- Usa tipo existente `material_approved` sem alterar enum nem gerar tarefas de produção.
- Novos registros em `presentation_review_completions` têm RLS; somente equipe autorizada pode consultar. Anônimo acessa apenas o RPC de conclusão validado por token.

Migração `20261023113323_briefing_delete_presentation_completion.sql`. Sem testes, deploy ou mutação de dados reais durante a implementação; integrador revisa e aplica.

### Leitura de catálogo remoto · 23/10/2026

Confirmados por SELECT no catálogo do projeto: permissão `briefings.delete` existente; seis FKs de filhos listadas acima usam CASCADE; `content_strategies` e `proposals` usam SET NULL; `monthly_editorial_campaigns` impede exclusão por FK simples. A proteção adicional bloqueia as referências SET NULL e snapshots antes da exclusão. Nomes das colunas da allowlist foram conferidos no `information_schema.columns` remoto. Nenhuma exclusão foi executada.
