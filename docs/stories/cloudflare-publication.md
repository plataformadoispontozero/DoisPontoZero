# Publicação autorizada — Cloudflare

Status: In Progress. Autorização explícita do usuário em 11/10/2026: publicar e fazer push. Preservar a branch atual, não fazer merge, migrations ou DNS.

- [x] Confirmar origin DoisPontoZero e branch codex/master-audit-15-1.
- [x] Remover regra SPA circular; configurar Worker doispontozero explicitamente com assets.directory=dist e fallback SPA.
- [x] Fixar versão Wrangler 4.149.0 no package.json/package-lock.json.
- [x] Build, lint, typecheck e testes após alteração de dependências.
- [x] Scan de arquivos preparados para commit; excluir configuração privada.
- [ ] Commit/push autorizado sem force.
- [ ] Publicação/verificação do Worker existente conforme autenticação disponível.

Arquivos: public/_redirects, wrangler.jsonc, package.json, package-lock.json e docs/stories/cloudflare-publication.md; recuperação acumulada listada em docs/evidence/agency-recovery/modified-files.txt.

RLS/backend permanecem sem homologação. Publicar frontend não certifica isolamento de tenant nem aplica SQL pendente.

Wrangler whoami: não autenticado. Login OAuth iniciado; depende de autorização interativa da conta Cloudflare. Scan dos 169 arquivos preparados não encontrou padrões reconhecidos de credenciais; .env.local permanece ignorado.
