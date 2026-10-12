# Arquivos da produção por demanda

## Componentes e integração reaproveitados
A conexão Google central e a configuração de raiz/credenciais existentes continuam únicas. DemandProductionFiles integra o detalhe da tarefa; ClientDrivePanel reutiliza navegação, criação confirmada e upload em chunks do helper driveProduction. Design, Vídeo e Tráfego usam o mesmo detalhe de tarefa.

## Pastas e autorização
O serviço resolve tarefa, projeto e cliente no servidor. Consulta pastas reais, com paginação, dentro da raiz do cliente vinculada à raiz autorizada da agência. Usuário pode navegar e trocar destino; a pasta selecionada é referência salva e revalidada. O mês editorial ou prazo orienta sugestão conforme nomes existentes. Nenhuma abertura de tela cria pasta; nome pode ser editado e criação exige confirmação explícita.

Google Picker aparece para autorizar acesso de escrita quando necessário, restrito à gestão que administra a conexão central. Profissionais de produção não recebem tokens centrais. Se o cliente ainda não tem pasta vinculada, reutiliza-se o fluxo existente do painel do cliente.

## Upload e banco
O navegador solicita sessão resumable validada pelo servidor e envia o Blob diretamente ao Google em chunks de 8 MiB. A fila mostra progresso, cancelamento e retry por arquivo. Falha individual não interrompe os demais. O finalizador consulta o arquivo no Google e compara nome, MIME, tamanho, pasta, propriedades da sessão/cliente/tarefa e versão antes de registrar metadados.

Task attachments são reutilizados, com file/folder/version, cliente, usuário e referência do preview; não armazenam originais, Base64 ou conteúdo binário. Os originais permanecem no Drive. Remover referência mantém o arquivo original.

## Preview e Kanban
Imagens e vídeos suportados pelo navegador geram WebP/poster de até 1600 px, qualidade 0,78, também enviados ao Drive. Falha de thumbnail preserva original e usa fallback explícito. Serviço entrega somente imagem leve verificada, limitada a 2 MiB, com MIME validado. Galeria abre preview no detalhe; Abrir original no Drive é secundário. Cards Kanban carregam contagem de anexos, sem download de originais.

## Segurança
Acesso combina associação ativa, agência, cliente, tarefa atribuída ou gestão e permissões atuais. Seleção/upload/finalização revalidam pertencimento à raiz; pasta de outro cliente e sessão/arquivo incompatíveis são recusados. Metadados Drive e destino não podem ser forjados via escrita direta autenticada. Sessões ficam privadas, sem credenciais no navegador de produção.

## Verificação
Resultados finais serão registrados na story demand-drive-production-files.md. Testes automatizados e E2E usam APIs simuladas; uma sessão legítima de usuário para envio real não foi disponibilizada a esta execução. Portanto não se afirma upload real, homologação de credenciais ou destino real de PNG/MP4. Não houve criação de pasta ou envio de arquivo a clientes reais nos testes.
