# Publicação autorizada — Cloudflare

Status: Done — frontend publicado; backend/RLS pendentes. Autorização explícita do usuário em 11/10/2026: publicar e fazer push. Preservar a branch atual, não fazer merge, migrations ou DNS.

- [x] Confirmar origin DoisPontoZero e branch codex/master-audit-15-1.
- [x] Remover regra SPA circular; configurar Worker doispontozero explicitamente com assets.directory=dist e fallback SPA.
- [x] Fixar versão Wrangler 4.149.0 no package.json/package-lock.json.
- [x] Build, lint, typecheck e testes após alteração de dependências.
- [x] Scan de arquivos preparados para commit; excluir configuração privada.
- [x] Commit/push autorizado sem force.
- [x] Publicação/verificação do Worker existente conforme autenticação disponível.

Arquivos: public/_redirects, wrangler.jsonc, package.json, package-lock.json e docs/stories/cloudflare-publication.md; recuperação acumulada listada em docs/evidence/agency-recovery/modified-files.txt.

RLS/backend permanecem sem homologação. Publicar frontend não certifica isolamento de tenant nem aplica SQL pendente.

Wrangler whoami: não autenticado. Login OAuth iniciado; depende de autorização interativa da conta Cloudflare. Scan dos 169 arquivos preparados não encontrou padrões reconhecidos de credenciais; .env.local permanece ignorado.


## Resultado

Push das correções: c121ee03af270d8583ac4b038b936a9b4497d5f9 na branch codex/master-audit-15-1; sem merge/force. OAuth Wrangler concluído pelo usuário. Dry-run PASS. Deploy no Worker existente concluído em 11/10/2026.

URL: https://doispontozero.marketingrenatodesigner.workers.dev/login
Versão Cloudflare: 80701662-0a98-40a6-810f-e1030803029a.

Smoke Chromium na URL pública: /login HTTP 200 e heading visível; /clients e /agenda HTTP 200 e guard retornando /login sem sessão; reload PASS; nenhum pageerror. Build/typecheck/lint aprovados (lint com avisos), 81 testes unitários aprovados. E2E controlados já documentados em RECOVERY_02_TESTS.md. O erro 100324 não ocorreu neste deploy.

Nenhuma migration, DNS ou dado Supabase alterado. Backend/RLS permanecem sem homologação; recuperação de senha depende de liberar limite de e-mail/SMTP e permitir a URL pública /reset-password no Supabase. Conta ADMIN depende de membership/papel autorizados no backend. Workers.dev e preview URLs foram habilitados pelo padrão do Wrangler; nenhum domínio customizado configurado pela publicação.
