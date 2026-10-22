# Datas especiais do briefing no calendário — 22/10/2026

Perfil aplicado: Agency Agents Frontend Developer.

- Extrai texto de datas especiais/comemorativas/importantes/sazonais de respostas do briefing selecionado, cadastro do cliente e registro histórico mais recente. Preserva o texto original e remove blocos idênticos.
- Mostra a referência na direção editorial, com opção explícita para incluir as datas. Também disponibiliza a referência ao Gemini quando o comando mensal pedir essas datas sem marcar a opção.
- Datas e opção são persistidas no contexto da campanha e invalidam o plano preparado quando mudam. Troca de cliente usa as referências daquele cliente.
- Contrato da função aceita somente texto de referência até 6.000 caracteres e opção booleana. Sem alteração de esquema ou de credenciais.
- Prompt de planejamento/geração exige filtro pelo mês e ano da campanha, respeito a exclusões, ausência de inferência para datas ambíguas e inclusão das peças dentro do volume solicitado. Pede copy completa e estrutura do formato, não apenas nome da data.
- A seleção automática de datas pelo mês/ano é uma instrução ao modelo, sujeita a revisão humana. Não foi executada nova geração Gemini de campanha com essas datas nesta entrega. Não se declara homologação semântica do conteúdo gerado.
- Compilação TypeScript e build: /private/tmp/special-dates-build.log. Não adicionados/executados testes automatizados nesta solicitação.

Conferência em produção: /editorial/new com Ambience carregou as três referências de abril (17, 22 e 28) exatamente como no cadastro, na etapa Direção editorial. Bloco expandido e opção de inclusão visíveis. Evidência: /private/tmp/briefing-special-dates-production.png. Função editorial-ai v9 publicada. Nenhuma campanha nova foi gerada nem configuração do cliente alterada nesta conferência.
