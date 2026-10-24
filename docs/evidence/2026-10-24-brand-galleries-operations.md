# Integração com Agency Agents · 24/10/2026

## Entrega

Perfis instalados usados: Frontend Developer, UI Designer e Backend Architect, com responsabilidades separadas para apresentações, site público, squads e calendários; integração central de identidade e contraste.

- Identidade persistida em agency_branding alimenta provider de navegação e tokens do workspace. Cores primária/destaque, superfícies, texto e fontes permitidas aplicam após gravação; foregrounds ajustados para legibilidade. Componentes antigos têm ponte CSS restrita ao workspace; artes e prévias autorais ficam fora dessa transformação.
- Upload de logo do cliente (fonte até 5 MiB), cor opcional no cabeçalho e assets da agência com URL real persistida; nenhum blob temporário é declarado salvo. Imagens públicas devem ser logos autorizadas.
- Hero e portfólio com multiseleção e galeria; fontes até 50 MiB são verificadas e reduzidas para WebP de até 2.560 px / 2 MiB. Até 60 itens combinados, respeitando limite de metadados de 98 KB na interface / 100 KB no banco. Correção da política de Storage que confundia nome da agência com caminho do arquivo.
- Checkbox de movimento removido das logos públicas; controles administrativos mantidos, pausa por foco/hover e movimento reduzido continuam.
- Squads: meta mensal única por métrica aplicada individualmente a cada equipe; performance derivada de demandas dos líderes/membros ativos ou projetos vinculados. Sem notas manuais inventadas. Sobreposição identificada, tarefa distinta dentro de cada squad, UTC e vínculos atuais; não é fechamento imutável histórico.
- Exclusão definitiva de calendário exige permissão, confirmação exata cliente/mês e ausência de produção vinculada. Arquivamento permanece opção recuperável. Social Media filtra arquivados antes do limite e dos indicadores.
- Apresentação: nove cards de seção, capa com imagem e logo de Drive/URL/cadastro, imagem em cinza a 10%, avaliações atuais separadas do histórico, progresso público e conclusão sem autoaprovar.
- Link amigável /apresentacao/nome-do-cliente/identificador: converte os mesmos 192 bits de acesso em 32 caracteres; o nome é descritivo, não autorização. Links antigos continuam válidos; não é um encurtador público nem redirecionamento externo.

## Evidência real

- Compilação de produção e typecheck concluídos. Nenhum teste automatizado criado ou executado. Avisos de chunks grandes/import estático-dinâmico preexistentes permanecem.
- Migrações aplicadas: presentation_current_review_summary; editorial_campaign_permanent_delete; shared_monthly_squad_goals; fix_public_site_media_owner_path; client_brand_color_media; squad_member_automatic_performance.
- Navegador autenticado: cliente em claro com botões legíveis, controles de logo/cor; escritório claro, squads reais com líderes e métricas vindas do RPC; galerias únicas da Hero/Portfólio com textos opcionais; Social Media mostrou Planejamento 0 e demais colunas 0, sem calendário arquivado; página pública sem checkbox de movimento das logos; novo endereço amigável abriu os 12 materiais reais e suas avaliações existentes, sem registrar aprovação.
- Paleta no início da revisão: roxo #5900ff/amarelo #daad0b; durante a conferência foi registrada a nova paleta #ff5900/#fffcf0, confirmada por leitura do banco. A interface passou a acompanhar a nova paleta. Não sobrescrevemos cores nem registros do responsável.
- Advisors: RPCs definer intencionais com autenticação/permissão ou token; tabelas novas com RLS/policies. Permanecem avisos anteriores de tabelas privadas sem policy e proteção de senhas vazadas desativada; autenticação não alterada.

## Limitações e aceite pendente

Não foi executado upload físico de 50 MiB, criação de meta operacional, exclusão real ou aprovação de cliente para fabricar evidência. Esses fluxos precisam de aceite com arquivos e registros autorizados pelo responsável. Uploads confirmados só passam a integrar a galeria/logo após salvar os metadados. Não removemos o calendário arquivado que o usuário indicou; agora há exclusão explícita com confirmação na interface.
