# Login da equipe e identidade Dois.Zero
Status: Done — validado; publicação e envio autorizados

- [x] Login com logo oficial, apresentação, área restrita e e-mail/senha.
- [x] Google removido da interface; sem cadastro de cliente no workspace.
- [x] Recuperação e redefinição preservadas.
- [x] Paleta interna laranja/preto/branco, preservando estados semânticos.
- [x] Build, typecheck e lint (avisos preexistentes) passaram; 105 unitários, 48 E2E de acesso e 21 E2E públicos passaram.
- [x] Login revisado em 1440, 390 e 320 px, sem Google e sem overflow.
- [x] Entrega aprovada para publicação e push nesta revisão.

Alterações: AuthPage, OfficialBrandLogo compartilhado, tokens e utilitários de cor internos, componente público reutiliza logo; teste de acesso exclusivo à equipe. Sem mudanças remotas de Auth, RLS ou migrations.
