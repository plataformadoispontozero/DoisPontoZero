# Organização da operação por cliente — 14/10/2026

## Entregas

Social Media e Tarefas iniciam com um bloco recolhível por cliente. Tarefas oculta clientes sem demandas em andamento; concluídos podem ser incluídos. As demandas mantêm o modal central e seus dados originais.

/projects passa a ser Kanban Geral com etapas e grupos por cliente, exclusivo de OWNER/ADMIN/MANAGER. A consulta get_management_kanban aplica controle de papel, vínculo ativo, agência e tasks.view, com SECURITY INVOKER para preservar RLS. Rotas de projetos individuais e atalhos de profissionais continuam disponíveis conforme permissões.

Calendários e briefings apresentam grupos por cliente. A agenda mantém consultas pessoais e oferece calendário de mês, semana, dia e lista.

Meta apresenta períodos de 7/30/90 dias, total da conta e métricas por campanha, com moeda recebida da API. Alcance não é somado entre campanhas. Leitura com ads_read e vinculação do cliente preservadas; nenhuma operação de anúncio foi adicionada.

PDF inclui texto, imagens e thumbnails, com proporções preservadas. Materiais sem seção recebem uma seção própria; previews indisponíveis são identificados. Download de uma prévia reutiliza o mesmo arquivo. Foram removidos inserts de exportação com demo-agency e storage_path sem upload real. Capa, cabeçalho, rodapé e paginação revisados.

Diagnóstico lê docs/RELEASE_STATUS.json, mostra esta entrega e reconcilia as fases envolvidas com evidências e critérios específicos. Não transforma publicação em homologação integral. Propostas permanece retirado.

## Evidências

- 353 testes aprovados em 93 arquivos na versão isolada; últimos ajustes de preparação de mídia e relatório também aprovados em verificação focada.
- 30 cenários de navegador aprovados; 4 cenários adicionais de briefings/calendários aprovados. Total de 34 cenários distintos em 1440×900 e 390×844, com APIs controladas. PDF repetido após revisão final: 2 casos aprovados.
- Typecheck aprovado; lint aprovado com avisos existentes. Build final aprovado e publicação confirmada.
- Migration aplicada: 20261014022802_management_kanban. Consulta autenticada real retornou 5 demandas Aurora; execução por anon revogada. Teste de banco local verifica papel comum, outra agência, vínculo inativo e falta de permissão.
- Meta Edge Function version 2 ACTIVE, verify_jwt=false preservado para callback OAuth, com verificação interna de sessão em POST. Chamada sem sessão retorna HTTP 401.
- Contratos Meta conferidos no SDK oficial: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adsinsights.py e adaccount.py.
- PDF gerado pelo navegador com texto longo e arte SVG de teste: 4 páginas A4. Inspeção completa por Poppler e PDFium, extração de texto e revisão das páginas confirmaram paginação e ausência de sobreposição na versão final.
- Nenhum dado real de cliente foi alterado; Aurora e seu histórico foram preservados. Trabalho anterior de chat, reuniões, permissões, notificações e manifesto de fases permanece fora desta publicação.

## Limites de validação

Métricas Meta reais dependem de autorização ads_read ativa e conta vinculada. O teste de navegador usa fixture explicitamente simulada; não comprova resultados de campanha real. Thumbnails privados do Drive dependem do acesso/CORS e devem ser homologados com arquivos da agência. O diagnóstico mantém essas pendências, o aceite operacional de gestão e a revisão de uma campanha editorial real.

## Publicação

Commit funcional 2d2ae80 enviado para origin/codex/master-audit-15-1.

Deploy Cloudflare: 14f4945d-b36e-4e32-af05-f7ce1ff6843f. Bundle principal: /assets/index-BZ2RnBXB.js; diagnóstico: /assets/DiagnosticsPage-CBtxSA-C.js.

Conferência no domínio doispontozero.renatodesigner.com.br confirmou igualdade byte a byte do bundle principal e dos módulos de Diagnóstico, Tarefas, Kanban, Calendários, Briefings, Social Media, Produção e PDF. O conteúdo publicado inclui o título da entrega, 353 testes aprovados e a pendência explícita de autorização ads_read. Interface autenticada foi exercitada com APIs controladas; a consulta de gestão e o bloqueio anônimo foram conferidos no backend real.

42/44 arquivos protegidos do trabalho anterior permanecem idênticos. Nos dois restantes, somente as linhas necessárias para retirar Propostas e exibir a entrega no diagnóstico foram alteradas; os conteúdos anteriores foram conferidos por hash após remover essas linhas.
