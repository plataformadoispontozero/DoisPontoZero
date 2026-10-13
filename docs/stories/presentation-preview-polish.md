# Apresentações — prévia editorial e mídia do cliente

Status: Ready for Review

## Pedido
Melhorar a apresentação, corrigir contraste dos seletores e visualizar os materiais reais da pasta selecionada do cliente.

## Critérios
- [x] Prévia e página pública usam a mesma composição responsiva com identidade Dois.Zero.
- [x] Nome, período, títulos, textos e materiais reais são apresentados sem métricas inventadas.
- [x] Imagens usam miniaturas existentes; arquivos abrem seus links seguros, sem supor permissões de reprodução.
- [x] Editor apresenta informações legíveis e orientação de publicação, sem UUID ou White Label.
- [x] Testes de conteúdo, links e estados vazios passam; lint/typecheck/build verificados na entrega integrada.

## Arquivos
- src/features/presentations/PresentationPreview.tsx
- src/features/presentations/PresentationPreview.test.tsx
- src/features/presentations/public/PublicShowcaseViewPage.tsx
- e2e/presentation-preview.spec.ts
- src/features/presentations/PresentationSectionEditor.tsx
- src/features/presentations/PresentationWorkspacePage.tsx (integração pelo agente principal)

## Validação parcial
3 testes do componente passaram; typecheck passou. Gates integrados aguardam editor e seletor do cliente.

### Drive por cliente — implementação @dev

- [x] Abrir automaticamente a pasta real do cliente vinculado.
- [x] Navegar subpastas, retornar por caminho e paginar materiais.
- [x] Selecionar até 20 arquivos e vincular metadados à seção com verificação server-side de cliente, apresentação, seção, pasta e arquivo.
- [x] Mostrar carregamento, pasta vazia, erros e tentativa novamente.
- [x] Preservar arquivos binários no Drive; usar conexão central sem exigir Google pessoal da equipe.
- [x] Corrigir retorno de root-picker-session que usava variáveis fora de escopo.
- [x] 9 testes direcionados de metadata/isolamento/navegação/erro passaram.
- [x] QA/deploy global por @devops após integração visual.

File list adicional:
- `supabase/functions/google-workspace/index.ts`
- `supabase/functions/google-workspace/presentationDrive.ts`
- `src/features/presentations/ClientPresentationDrivePicker.tsx`
- `src/features/presentations/ClientPresentationDrivePicker.test.tsx`
- `src/features/presentations/clientPresentationDrive.test.ts`

Limite de validação: testes com API Google mockada; conta OAuth real e pasta particular do cliente devem ser conferidas com a sessão da agência. Falha de persistência pode deixar referência leve sem asset; tentativa novamente reutiliza referências já indexadas.

Prévia pública validada em desktop, tablet e mobile com API controlada; sem alegar autorização real do Drive.

## QA Results
Lint passou (avisos legados); typecheck/build passaram; 318 testes em 80 arquivos passaram com 1 worker; 3 E2E públicos em desktop/tablet/mobile passaram com API controlada. CodeRabbit não instalado. Google Workspace v10 ACTIVE; requisição sem sessão retorna 401. Listagem autorizada real depende da sessão Google do cliente e será testada pela equipe.
