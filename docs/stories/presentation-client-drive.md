# Apresentação orientada ao cliente e ao Drive

Status: Ready for Review
Responsabilidade: @po → @dev → @qa → @devops.

Pedido: abrir Drive do cliente, navegar pastas e selecionar materiais; corrigir seletores e aprimorar apresentação.

- [x] Drive inicia na pasta vinculada ao cliente e lista a pasta selecionada.
- [x] Validar agência, cliente, seção e descendência dos materiais no servidor.
- [x] Editor com seletores legíveis, salvamento explícito de textos e prévia responsiva.
- [x] Visual público alinhado à marca, sem dados ou resultados fictícios.
- [x] Gates e publicação verificados.

Arquivos: PresentationWorkspacePage.tsx, PresentationSectionEditor.tsx, ClientPresentationDrivePicker.tsx, PresentationPreview.tsx, PublicShowcaseViewPage.tsx, google-workspace/index.ts; testes correspondentes.

## QA Results
Lint passou (avisos legados); typecheck/build passaram; 318 testes em 80 arquivos passaram com 1 worker; 3 E2E públicos em desktop/tablet/mobile passaram com API controlada. CodeRabbit não instalado. Google Workspace v10 ACTIVE; requisição sem sessão retorna 401. Listagem autorizada real depende da sessão Google do cliente e será testada pela equipe.

File list adicional: src/components/ui/Dialog.tsx; ClientPresentationDrivePicker.test.tsx; PresentationSectionEditor.test.tsx; PresentationWorkspacePage.test.tsx; clientPresentationDrive.test.ts; PresentationPreview.test.tsx; e2e/presentation-preview.spec.ts; supabase/functions/google-workspace/presentationDrive.ts.
