# QA: estratégias, criação editorial e salas de trabalho

Data: 13/10/2026. Responsável: @qa/@devops.

## Verificação
- Lint: sem erros (avisos existentes).
- Typecheck: `npm run typecheck` (`tsc -b`) aprovado.
- Suite completa: 84 arquivos / 335 testes aprovados; componente WorkRooms adicionado depois da coleta da suite: 2 testes adicionais aprovados. Total validado: 337.
- Build aprovado; bundle `index-DkveCMNt.js`.
- Supabase: duas migrations canônicas aplicadas por CLI; rollback em sessão authenticated validou exclusão de rascunho, isolamento entre agências, presença com identidade servidor, bloqueio de sala privada e saída própria. Nenhum registro de teste persistido.
- Presença: RLS deny-all na tabela private, nenhum grant direto; RPCs públicas invoker, anon sem execute.
- Advisors: informação de tabela private sem policies é intencional. Avisos antigos sobre funções públicas/search_path e configuração Auth continuam fora destas duas migrations; não se afirma auditoria de segurança global concluída.
- CodeRabbit indisponível no ambiente; revisão local e gates executados, sem afirmar aprovação CodeRabbit.

## Reconciliação do histórico
Três versões criadas anteriormente via MCP tinham SQL byte a byte igual aos arquivos canônicos (MD5 verificado). Somente o identificador da versão no histórico foi alinhado; SQL não foi reaplicado.
- showcase_drive_references: 20261012233902 → 20261012233624; MD5 be0139bd5800debe39270ffca046a996.
- presentation_link_permissions: 20261012233937 → 20261012233927; MD5 f091805012bc42f45656c80244200688.
- showcase_anonymous_bridge: 20261012234037 → 20261012234001; MD5 867f3840578f69a568e79b3a7c8de49e.

## E2E
48 cenários únicos aprovados: 15 rotas × desktop/tablet/mobile, mais filtro/entrada de sala em cada viewport. A primeira execução teve 47 aprovados e um timeout de login mock antes da rota Tráfego. A revalidação pontual Desktop Tráfego + sala aprovou 2/2 após ajustar espera de autenticação e fixture de membros. Nenhuma falha funcional da rota foi reproduzida.

APIs controladas: estes E2E comprovam frontend/responsividade, não acesso real a Google ou autenticação de membros em produção. A presença/exclusão foram verificadas separadamente no banco via rollback.

## Publicação concluída
- Commit funcional: `7d11ad7`; push em `codex/master-audit-15-1`.
- Cloudflare Worker: `doispontozero`; versão `eb1f3cce-8a57-4363-988b-7a7b03665100`.
- Domínio da agência retornou `/assets/index-DkveCMNt.js`, igual ao build validado.
- Migrations remotas canônicas: `20261013000947`, `20261013001151`.
- Limites: áudio/vídeo não implementados; acesso real do Google e uso simultâneo por membros não verificados por este conjunto de testes.
