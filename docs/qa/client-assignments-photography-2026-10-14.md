# Atribuições por cliente e direção fotográfica — 14/10/2026

## Resultado implementado
A ficha inclui Atribuições, com seleção de vários membros por setor. A agência define a equipe real; não foi escolhido um responsável fictício para clientes reais. Só membros ativos podem receber novas atribuições. Consulta exige clients.view; gravação exige clients.edit. A tabela privada não admite acesso direto por anon/authenticated; RPCs públicos invoker chamam funções privadas com validação atual de agência e permissão. Não há ampliação de papéis.

Trigger de novas tarefas reconhece os prefixos internos Design, Videomaker, Tráfego Pago e Social Media e herda os membros ativos daquele setor/cliente, incluindo vínculo no projeto necessário ao fluxo de atribuições existente. O mesmo caminho cobre demandas criadas manualmente e pela produção editorial. Demandas anteriores mantêm a equipe atribuída; trocar a equipe do cliente afeta apenas novas demandas. Membros inativos não são incluídos.

Direção fotográfica separada da legenda: assunto coerente com copy, enquadramento/ângulo, luz e fundo. Grid 3×3/regra dos terços posiciona o assunto no lado oposto ao espaço negativo escolhido (esquerda, direita, cima ou baixo). Aproximadamente um terço limpo para título/apoio/CTA, evitando rostos, objetos e texturas fortes; margem para recortes quadrados/verticais. A escolha é uma sugestão ajustável à captura real, não uma afirmação sobre produtos ou pessoas disponíveis. É possível desativar fotografia em peças ilustradas.

A geração serializa o guia em editorial.visual para que o formatador existente da produção preserve a fotografia nas demandas. O editor evita duplicar o bloco, mantém roteiro técnico de vídeo e não mistura instruções de fotografia com a copy pública. Demandas históricas não foram reescritas.

## Evidências
- Regressão: 427 testes, 116 arquivos, aprovados.
- Direção fotográfica + engine: 30 testes direcionados aprovados.
- Atribuições + fotografia: 10 testes direcionados aprovados (4 transacionais e 6 de fotografia).
- Typecheck sem erros; lint aprovado, com avisos preexistentes.
- Chrome isolado com respostas de API controladas: criação de post, carrossel e reels em desktop/celular (6 aprovações). Payload salvo contém assunto e espaço à direita.
- Aba Atribuições: escolha de 2 membros no mesmo setor, save/reabertura em desktop/celular (2 aprovações). Primeira execução falhou por fixture tratar agency_id como filtro id; fixture corrigida e reexecutada.
- SQL real autenticado: atribuições temporárias nos quatro setores para Aurora TESTE, nova demanda Design herda 1 responsável, rollback. Consulta posterior confirma 0 atribuições e 0 tarefas temporárias; RPCs de consulta/gravação não executáveis por anon.
- Advisors: nenhuma nova função pública definer exposta. Informação RLS sem políticas na tabela privada é intencional: sem grants e acessível apenas por funções privadas protegidas. Avisos anteriores da plataforma permanecem fora desta alteração. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

- Consulta sem clients.edit, falha de carregamento e diagnósticos: 4 cenários desktop/celular aprovados. Total desta entrega: 12 cenários de navegador distintos aprovados.

## Publicação
Build e confirmação pública serão registrados após a publicação. O aceite do uso diário da equipe permanece pendente nos diagnósticos.
