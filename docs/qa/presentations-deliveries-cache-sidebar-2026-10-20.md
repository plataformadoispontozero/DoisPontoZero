# Apresentações: entregas, cache, links e menu — 20/10/2026

## Entregue

- Posts individuais em grade na prévia compartilhada pelo editor e showcase público. Carrossel é um modo explícito da seção: artes lado a lado, com ordenação natural dos nomes (1, 2, 10), sem confundir posts independentes com um carrossel.
- Atalhos Posts, Carrossel e Reels: criam a seção com configuração própria, selecionam a seção criada e abrem o seletor de materiais. Modelo mensal passa a separar esses formatos e deixa de trazer números de resultados fictícios.
- Seletor do Drive permite abrir uma pasta e vincular suas imagens em ordem numérica. Cada lote aceita até 20 arquivos; a pasta continua no Drive. A vinculação é uma seleção dos arquivos atuais, não sincronização automática dos futuros arquivos da pasta.
- Reels: vídeo inline, loop, início mudo, controle explícito de áudio e pausa fora da área visível. Streaming com Range, ticket criptografado de 15 minutos e nova autorização por requisição. O navegador não recebe credenciais Google. Tickets são renovados durante o uso.
- Link de aprovação recuperável no cabeçalho do editor, disponível entre abas e próximos acessos para membros com `presentations.manage_public_links`. O Edge Function guarda o token criptografado com AES-GCM numa tabela privada; apenas a service role executa a RPC de armazenamento. Os links anteriores tinham apenas hash e não podem ser recuperados: uma nova geração é necessária. Links antigos não são revogados por este ajuste.
- Arquivar permanece recuperável. Apagar definitivamente exige o título exato e a permissão `presentations.delete` no servidor; remove avaliações e apresentação em uma transação. Os originais e referências compartilhadas do Drive são preservados. Não executada exclusão de apresentações reais.
- Sidebar desktop fixa na viewport, conteúdo compensado pela largura, rolagem interna dos atalhos e perfil/saída na base. Scrollbar interna não desloca o centro dos ícones recolhidos.

## Cache e sessão

- A causa encontrada da tela escura no retorno era o reset de acesso em todo evento de autenticação. Renovação de token e novo evento SIGNED_IN do mesmo usuário preservam o acesso hidratado durante a revalidação. Mudança de usuário, saída, perda de acesso e erro continuam limpando o escopo.
- Cache das consultas já visitadas mantido em memória por até 30 minutos após desativação, respeitando os staleTimes e invalidações de cada setor. Não há pré-carregamento de todos os setores no login.
- Imagens autorizadas compartilham consulta/cache por escopo de usuário/agência ou link público e por material. Blob em memória por 5 minutos, com requisições simultâneas deduplicadas; URLs locais revogadas ao desmontar o consumidor. Sem gravação de dados privados em localStorage, CacheStorage ou Service Worker.
- Prévia pede thumbnail recente do Drive em até s1200; se falhar para imagem compatível, tenta o original autorizado. Ao ampliar, o original é carregado separadamente. Sem fallback para uma URL privada expirada. Erro de prévia oferece nova tentativa.
- Showcase começa a renderizar os materiais antes da conclusão da consulta de histórico, sem sobrescrever avaliações novas com respostas antigas. Acesso por token continua revalidado no servidor. Cache não transforma a plataforma em aplicação offline.

## Validação

- **58 testes em 20 arquivos passaram**: apresentações, mídia, decisões, reutilização, exclusão, galerias, seleção do Drive, Reels, cache, continuidade da sessão e navegação.
- Build TypeScript/Vite aprovado para produção e homologação. `git diff --check` aprovado. Lint sem erros, com avisos do projeto.
- Consultas SQL confirmaram: RPC do segredo negada para anon/authenticated e permitida só à service role; tabela privada com RLS; exclusão negada para anon. Chamadas sem identidade às duas funções foram negadas.
- Exclusão validada com fixture temporária criada em transação: título errado negado, título correto excluiu a fixture, transação inteira revertida. Nenhuma apresentação real removida.
- Advisors revisados. Tabela privada sem políticas é bloqueada aos papéis de navegador por projeto; a RPC de exclusão é deliberadamente autenticada com verificação de identidade/permissão e título. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable. Alertas preexistentes de outras áreas não alterados.
- Conferência visual autenticada em homologação e domínio oficial: seis artes da Ambience carregadas na grade, nitidez da prévia, atalhos de formatos, campo do link, ações da biblioteca e menu fixo recolhido durante a rolagem.
- Há 16 imagens e **zero vídeos vinculados** nas apresentações atuais. Reels foi coberto por testes de componente (loop/mudo/ação de áudio) e handler (stream/Range/autorização); reprodução de um Reel real do cliente ainda depende da vinculação de um vídeo compatível.
- Recuperação do link no componente coberta por teste entre abas. Não foi gerado um novo link de cliente durante a inspeção visual.

## Publicações

- Supabase `pvkhlobsiszrjtblpruu`: migrações de armazenamento criptografado e exclusão definitiva aplicadas; `google-workspace` **versão 19 ACTIVE**. Gateway JWT permanece desabilitado como anteriormente para OAuth/showcase; o handler verifica identidade, token público ou ticket e autorização em cada caminho.
- Uma proposta inicial de token legível foi rejeitada pela revisão automática e substituída por armazenamento criptografado aprovado. Não foi aplicada a proposta rejeitada.
- CLI Supabase recusou o token local expirado; publicação concluída pelo conector autenticado. A primeira publicação pelo conector precisou de um caminho explícito de import map; o arquivo vazio correspondente foi incluído no código.
- Produção: Worker `doispontozero`, versão `7fccad71-6327-4650-93ef-cf9fe5f07d50`. Flags: escritório/controles true; chamadas/mídia do escritório false, preservadas.
- Homologação: Worker `doispontozero-office-homologacao`, versão `8df4229a-971f-4d32-9cb0-b44bbef0a62f`. Flags anteriores de escritório/controles/chamadas/mídia true, preservadas.
- Evidências locais: `/tmp/dois-apresentacoes-editor-menu-20261020.png`, `/tmp/dois-apresentacoes-grade-menu-20261020.png` e `/tmp/dois-presentations-validation.log`.
- O `dist` local final foi construído com flags de homologação; reconstruir com as flags de produção antes de um próximo deploy no domínio oficial.
