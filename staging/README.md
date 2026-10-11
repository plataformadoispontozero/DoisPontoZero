# Staging isolado — preparação local, não provisionado

Usuário escolheu preparar staging separado em 11/10/2026. Nenhuma conta/infraestrutura remota foi criada por esta etapa.

1. Criar projeto Supabase distinto, sem copiar dados pessoais/arquivos/tokens de produção. Confirmar custo e região no painel antes de contratar recursos.
2. Registrar somente o identificador público do novo projeto. Guardar credenciais administrativas no gerenciador de segredos/CI, nunca em VITE_* nem no Git.
3. Obter metadados do projeto atual com supabase/diagnostics/schema_operacional.sql e export separado do histórico de migrations. Metadados não incluem registros de usuários. Não executar db push/reset para obter essa informação.
4. Reconciliar as nove migrations: em especial profiles.agency_id utilizado indevidamente na fase 10, proteção de OWNER, SECURITY DEFINER/search_path/EXECUTE e policies de Storage. Não aplicar cegamente nem editar migrations históricas já utilizadas. Propor baseline corrigida exclusiva de staging e incrementos revisados, com plano de reversão antes de autorização.
5. Após autorizar SQL apenas em staging, criar contas descartáveis A/B, multivínculo, viewer, OWNER e sem vínculo. Testar SELECT/INSERT/UPDATE/DELETE/RPC e Storage cruzados, troca/logout e concorrência do último OWNER. Falha em tenant ou elevação de privilégios = NO_GO.
6. Configurar callback/Auth no origin local ou preview exclusivo de staging. Usar frontend.env.example como modelo em um arquivo local ignorado. Não compartilhar chaves administrativas no chat.
7. Homologar primeiro CRM/Projeto/Tarefa/Briefing/Equipe e arquivos. Preservar produção. Evidências controladas do Playwright não substituem o PostgreSQL real.
8. Para Meta, criar aplicativo/test accounts e callback de backend exclusivos de staging. Nunca ligar ativos reais de clientes durante testes. Não escrever em campanhas nem consumir verba.

Rollback: preservar frontend publicado atual; não fazer deploy nesta etapa. Correções de banco devem ter backup e recuperação testada em staging. Nenhum plano genérico autoriza alterações remotas.
