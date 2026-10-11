# Entrada e cadastro com Google

Status em 11/10/2026: frontend local implementado; ativação externa pendente. Endpoint público /auth/v1/settings do projeto pvkhlobsiszrjtblpruu respondeu google=false, disable_signup=false. Nenhuma alteração em Auth config, nenhum usuário Google criado, nenhum push/deploy nesta etapa.

Botão Continuar com Google em /login utiliza signInWithOAuth(provider=google). Checa disponibilidade antes de sair do site, preserva o retorno seguro em next, trata falhas e cancelamento sem exibir parâmetros brutos. O SDK já detecta sessões na URL. Membership/RLS não são substituídos por cadastro Google; um novo usuário sem vínculo continua sem acesso à agência.

## Ativação

1. Google Cloud / Google Auth Platform: criar ou selecionar projeto, configurar consentimento e cliente OAuth do tipo Web application. Escopos básicos de identidade apenas: openid, email, profile. Em modo de testes, cadastrar as contas autorizadas no Google.
2. Origin autorizado: https://doispontozero.renatodesigner.com.br.
3. Redirect URI do cliente Google: https://pvkhlobsiszrjtblpruu.supabase.co/auth/v1/callback.
4. Supabase > Authentication > Sign In / Providers > Google: inserir Client ID e Client Secret e habilitar Google. Secret exclusivamente no painel/backend, nunca VITE_* ou chat.
5. Supabase > URL Configuration: Site URL do domínio atual e Redirect URL https://doispontozero.renatodesigner.com.br/login?next=*. Validar o padrão com a documentação de redirects; não usar wildcard global para domínios externos. Origins locais específicos de teste devem ser cadastrados separadamente. Não remover os redirects existentes de recuperação de senha.
6. Publicar somente após autorização de push/deploy e configuração revisada. Homologar login real, novo cadastro sem membership, usuário com membership, cancelamento, logout e retorno à rota protegida. Não vincular agência ou conceder OWNER automaticamente.

## Verificação

Vitest 96/96 PASS; typecheck/build/lint/diff PASS (lint com avisos). Testes unitários OAuth usam mocks; não certificam Google real. Regressão E2E de provedor desativado: 3/3 PASS (desktop/tablet/mobile), /private/tmp/dz-google-e2e-final.txt. Primeira tentativa teve erro no matcher do teste, corrigido antes da repetição. Prova real externa: NOT_RUN.

Arquivos: src/features/auth/{AuthPage.tsx,googleOAuth.ts,googleOAuth.test.ts}; e2e/agency-access.spec.ts; este documento.

Fontes oficiais: https://supabase.com/docs/guides/auth/social-login/auth-google e https://supabase.com/docs/guides/auth/redirect-urls.
