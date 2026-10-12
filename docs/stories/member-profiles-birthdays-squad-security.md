# Perfis de membros, aniversários e integridade dos squads

## Resultado
Cada pessoa edita nome, avatar, profissão descritiva e data de nascimento opcional. A data permanece em tabela privada, acessível somente ao próprio usuário pela RPC. Gestão recebe aviso de aniversário no fuso da agência, uma vez por membro/ano. Squads aceitam apenas pessoas ativas da própria agência.

## Critérios
- [x] RPCs `get_my_profile`, `save_my_profile` sem alterações de papéis de acesso.
- [x] Profissão propagada do cadastro aprovado sem sobrescrever preferência existente.
- [x] Avatar público em bucket próprio, 2 MiB, JPEG/PNG/WebP, gravação somente em pasta UID do dono.
- [x] Validação de avatar também em atualizações diretas de perfil; preservar avatar legado inalterado.
- [x] Data privada; notificações sem ano de nascimento ou idade.
- [x] Aniversários no fuso válido da agência; deduplicação transacional anual.
- [x] Gestão pode sincronizar; membros comuns e anon não podem.
- [x] Squad exige `squads.manage_members` e associação ativa na mesma agência.
- [x] Testes PGlite de RPC, privacidade, Storage RLS, notificações e integridade tenant.
- [x] Aplicar migration após revisão do root/DevOps e verificar Storage em produção.

## Arquivos
- `supabase/migrations/20261012145455_member_profiles_birthdays_squad_security.sql`
- `src/features/team/member-profile.database.test.ts`

## Verificação
PGlite executa a migration real com tabelas mínimas e autenticação simulada por `auth.uid()`. Limites MIME/tamanho são configuração do bucket (verificação real de upload depende da aplicação da migration); RLS de caminho foi executada no PostgreSQL local. A UI e publicação são coordenadas pelo root.

## Publicação e evidências
- UI: MyProfilePage e seus testes, Avatar, AuthProvider, TopBar, Sidebar, SettingsLayout, TeamDirectoryPage, useAgencySettings, SquadMembersPanel, SquadsPage, notificações e tipos, router; E2E profile-squads.spec.ts.
- 249 testes em 61 arquivos, lint e build passaram; 12 E2E perfil/squads e regressões editoriais passaram em desktop/tablet/mobile usando backend simulado.
- Migration `20261012145455` aplicada; get/save/sync sem execução anon; data privada RLS; bucket público profile-avatars de 2 MiB confirmado. Nenhum upload real de foto foi exercitado.
- Advisors sem novos WARN; duas INFO de RLS privadas sem policies são deny-by-default intencional.
- Aniversários sincronizam quando a gestão abre/refaz consulta na plataforma; não há cron de avisos offline. CodeRabbit indisponível.
