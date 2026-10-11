# Recuperação operacional — agência
Status: Frontend validado; integração real BLOCKED
Fonte: solicitação do usuário em 11/10/2026 e prompts 02–12 fornecidos.

## Aceite
- [x] Auth Supabase real, login/logout/recuperação, guardas, vínculo multiagência e cache segregado.
- [x] Substituir IDs fixos usados por páginas operacionais; erros não viram dados demo quando configurado.
- [ ] Corrigir writes comprovadamente simulados quando contrato backend está disponível.
- [x] Regressão unitária, build/lint/typecheck e E2E; distinguir mocks de backend real.
- [ ] Preparar testes reais de agência conforme ambiente autorizado, sem publicar ou aplicar migrations existentes.

## Impacto
Acesso interno exige sessão e membership; sem Supabase exibe configuração pendente. Demo somente por flag explícita e loopback. Providers e cache passam a acompanhar usuário/tenant. Preserve o design system e SQL histórico.

## Arquivos
Lista em docs/evidence/agency-recovery/modified-files.txt; relatório atual em docs/RECOVERY_02_REPORT.md.

Último pedido restringe o ciclo à base Auth/tenant/permissões. Writes administrativos remotos e aceite operacional de módulos permanecem bloqueados; não avançar automaticamente ao Recovery 03.
