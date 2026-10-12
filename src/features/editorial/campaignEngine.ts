import type {
  EditorialContext,
  EditorialFormat,
  EditorialTrace,
  MonthlyItem,
} from "./monthlyPlanner";
export const ENGINE_VERSION = "campaign-rules-1.0";
export interface PillarInput {
  id: string;
  name: string;
  percentage: number;
  example_topics: string[];
  content_formats: string[];
}
export interface HistoryEntry {
  clientId: string;
  campaignId?: string;
  month?: string;
  state?: string;
  item: MonthlyItem;
}
export interface RepertoireFamily {
  id: string;
  label: string;
  journey: string;
  angles: string[];
  requiresFact?: boolean;
}
export const DEFAULT_REPERTOIRE: RepertoireFamily[] = [
  {
    id: "educational",
    label: "Educativa",
    journey: "Descoberta",
    angles: ["conceito", "pergunta", "guia"],
  },
  {
    id: "orientation",
    label: "Problema e orientação",
    journey: "Consideração",
    angles: ["necessidade", "decisao", "prioridade"],
  },
  {
    id: "choice",
    label: "Escolha informada",
    journey: "Consideração",
    angles: ["criterio", "checklist", "comparacao-interna"],
  },
  {
    id: "institutional",
    label: "Institucional",
    journey: "Relacionamento",
    angles: ["proposito", "posicionamento", "valores"],
  },
  {
    id: "action",
    label: "Convite e ação",
    journey: "Conversão",
    angles: ["primeiro-passo", "contato", "planejamento"],
  },
  {
    id: "differential",
    label: "Diferencial documentado",
    journey: "Consideração",
    angles: ["atributo", "beneficio"],
    requiresFact: true,
  },
  {
    id: "process",
    label: "Processo confirmado",
    journey: "Relacionamento",
    angles: ["etapas", "bastidores"],
    requiresFact: true,
  },
];
export interface EngineOptions {
  clientId?: string;
  pillars?: PillarInput[];
  history?: HistoryEntry[];
  repertoire?: RepertoireFamily[];
}
export const normalizeEditorial = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export const editorialSignature = (
  theme: string,
  family: string,
  angle: string,
) => [theme, family, angle].map(normalizeEditorial).join("|");
export function forbiddenTerms(context: EditorialContext) {
  const explicit = context.forbiddenTerms || [];
  const extracted = [
    ...context.restrictions.matchAll(
      /(?:não mencionar|nao mencionar|não usar|nao usar|não prometer|nao prometer|não divulgar|nao divulgar|evitar o termo|termo proibido)\s+([^.;\n]+)/gi,
    ),
  ].map((m) => m[1].replace(/^["']|["']$/g, ""));
  return [...explicit, ...extracted].map(normalizeEditorial).filter(Boolean);
}
export function validateEditorialItems(
  items: MonthlyItem[],
  context: EditorialContext,
) {
  const blocked = forbiddenTerms(context),
    signatures = new Set<string>();
  for (const item of items) {
    const text = normalizeEditorial(
      [item.title, item.copy, item.editorial?.visual || "",item.editorial?.postConcept?.support||"",item.editorial?.postConcept?.composition||""].join(" "),
    );
    const hit = blocked.find((term) =>
      (" " + text + " ").includes(" " + term + " "),
    );
    if (hit)
      throw Error(
        `Termo proibido encontrado: ${hit}. Revise a peça antes de salvar.`,
      );
    if (!item.copy.trim() || !item.title.trim())
      throw Error("Tema e copy são obrigatórios.");
    if (item.title.length > 200)
      throw Error("Tema acima de 200 caracteres. Encurte antes de salvar.");
    if (item.copy.length > 3000)
      throw Error(
        "Copy acima do limite de 3000 caracteres. Encurte antes de salvar; o texto não será cortado.",
      );
    const signature = item.editorial?.signature;
    if (signature && signatures.has(signature))
      throw Error("Combinação editorial repetida na campanha.");
    if (signature) signatures.add(signature);
  }
}
export function editorialQualityWarnings(item: MonthlyItem): string[] {
  const blocks = item.copy
    .split("\n")
    .map((b) =>
      b.replace(/^(?:Slide \d+:|Cena \d+ \(\d+s\):|Legenda:)\s*/, "").trim(),
    )
    .filter(Boolean);
  const normalized = blocks.map(normalizeEditorial);
  const alerts: string[] = [];
  if (new Set(normalized).size < normalized.length)
    alerts.push(
      "Há blocos de texto repetidos. Revise a progressão e evite repetir a mesma mensagem.",
    );
  if (
    blocks.some((b) => b.split(/\s+/).length > 30) ||
    item.copy.split(/\s+/).length > 150
  )
    alerts.push(
      "Texto extenso para a estrutura curta. Revise concisão e ritmo; nenhum trecho será cortado automaticamente.",
    );
  if (/\[(Completar|Complementar)/i.test(item.copy))
    alerts.push(
      "Há informação pendente. Complete com dados aprovados antes de enviar ao cliente.",
    );
  return alerts;
}
const openings: Record<string, string> = {
  conceito: "Entenda",
  pergunta: "Uma pergunta sobre",
  guia: "Um guia para",
  necessidade: "O que observar em",
  decisao: "Antes de decidir sobre",
  prioridade: "Por onde começar com",
  criterio: "Critérios para pensar em",
  checklist: "Seu checklist de",
  "comparacao-interna": "Compare suas necessidades em",
  proposito: "O propósito por trás de",
  posicionamento: "Nossa perspectiva sobre",
  valores: "O que orienta",
  "primeiro-passo": "O primeiro passo para",
  contato: "Vamos conversar sobre",
  planejamento: "Planeje",
  atributo: "Conheça",
  beneficio: "Entenda a proposta de",
  etapas: "Por dentro de",
  bastidores: "O processo de",
};
type NarrativeBlock = { role: string; headline: string; text: string; visual: string };
const narrativeRoles: Record<number, string[]> = {
  3: ['criteria'],4: ['context','action'],5: ['context','criteria','summary'],
  6: ['context','diagnostic','criteria','action'],7: ['context','diagnostic','criteria','action','summary'],
  8: ['context','diagnostic','criteria','checklist','action','summary'],
  9: ['context','diagnostic','criteria','checklist','comparison','action','summary'],
  10: ['context','diagnostic','criteria','evidence','checklist','comparison','action','summary'],
};
const topicReference = (theme: string) => theme.split(/\s+/).slice(0, 8).join(' ');
function decisionFrame(trace:EditorialTrace){
 const topic=normalizeEditorial(trace.theme+' '+trace.audience);
 if(/obra|reforma|construcao|engenharia|espaco/.test(topic))return {need:'Que uso o espaço precisa atender e quais intervenções você está considerando?',criteria:'delimitação do escopo, sequência de etapas e condições de execução',checklist:'áreas envolvidas, necessidades de uso e dúvidas sobre o escopo',comparison:'Compare propostas para as mesmas áreas e intervenções; registre diferenças de escopo antes de decidir.',action:'Liste as necessidades do espaço e leve suas dúvidas a uma conversa de alinhamento.'};
 if(/marca|branding|identidade|conteudo|social|marketing/.test(topic))return {need:'Que mensagem precisa chegar ao público e qual resposta você espera provocar?',criteria:'clareza da mensagem, adequação ao público e coerência entre canais',checklist:'mensagem principal, público prioritário e ação desejada',comparison:'Compare abordagens para o mesmo público e objetivo; explique o papel de cada peça antes de escolher.',action:'Organize a mensagem principal e selecione uma ação para o público realizar.'};
 if(/curso|aprendiz|educacao|ensino/.test(topic))return {need:'O que você pretende aprender e como esse objetivo se encaixa na sua rotina?',criteria:'objetivo de aprendizagem, conteúdo proposto e disponibilidade para estudar',checklist:'objetivo pessoal, conteúdo de interesse e tempo disponível',comparison:'Compare propostas pelo conteúdo e pela rotina necessária; esclareça dúvidas sem presumir um resultado garantido.',action:'Anote o que pretende aprender e peça detalhes sobre o conteúdo e a rotina.'};
 return {need:'Qual necessidade você quer atender e o que precisa esclarecer antes de escolher?',criteria:'escopo da oferta, condições de atendimento e adequação à sua necessidade',checklist:'necessidade principal, condições da oferta e dúvidas ainda abertas',comparison:'Compare alternativas com os mesmos critérios; registre o que cada opção inclui e o que precisa ser esclarecido.',action:'Organize sua principal dúvida e reúna as informações necessárias para o próximo contato.'};
}
function narrativeBlocks(trace:EditorialTrace,size:number):NarrativeBlock[]{
 const theme=topicReference(trace.theme),fact=trace.sources.find(s=>s.startsWith('Informação aprovada: '))?.slice('Informação aprovada: '.length);
 const frame=decisionFrame(trace);
 const orientation=trace.family==='choice'?'Compare as opções usando os mesmos critérios.':trace.family==='action'?'Transforme uma necessidade clara em um próximo passo possível.':'Organize as informações antes de decidir.';
 const blocks:Record<string,NarrativeBlock>={
  hook:{role:'hook',headline:trace.theme,text:`${theme}: por onde começar uma decisão bem informada?`,visual:`Capa: título sobre ${theme}; um elemento focal e contraste entre título e fundo, sem excesso de texto.`},
  context:{role:'context',headline:'Comece pela necessidade',text:`${frame.need} Use essa resposta para orientar sua decisão sobre ${theme}.`,visual:'Composição em duas áreas: necessidade atual e objetivo desejado. Use ícones ou tipografia, sem representar um resultado já alcançado.'},
  diagnostic:{role:'diagnostic',headline:'Faça três perguntas',text:`Ao avaliar ${theme}, separe o que você já sabe, o que precisa confirmar e o que ainda é dúvida. Qual desses pontos merece atenção primeiro?`,visual:'Três cartões numerados, uma pergunta por cartão; destaque uma palavra em cada bloco para facilitar a leitura.'},
  criteria:{role:'criteria',headline:'Compare o que importa',text:`Para avaliar ${theme}, compare ${frame.criteria}. Esses critérios organizam a conversa, sem substituir uma avaliação do seu caso.`,visual:'Checklist de critérios com marcações neutras; não incluir números de desempenho nem selos de qualidade não comprovados.'},
  evidence:{role:'evidence',headline:fact?'O que está confirmado':'Procure informações verificáveis',text:fact||'Antes de confiar em uma afirmação, confira sua origem e o contexto. Exemplos e comprovações precisam ser reais, não apenas persuasivos.',visual:fact?'Destaque tipográfico da informação aprovada; use foto ou documento somente se a equipe confirmar sua disponibilidade.':'Organize fonte, contexto e verificação em um diagrama; não criar depoimentos ou imagens de resultados.'},
  checklist:{role:'checklist',headline:'Organize sua decisão',text:`Sua lista de conferência: ${frame.checklist}. Se algum ponto não estiver claro, esclareça-o antes de avançar.`,visual:'Lista vertical de três itens com espaço em branco; um símbolo por item, sem repetir a composição dos cartões anteriores.'},
  comparison:{role:'comparison',headline:'Avalie as alternativas',text:orientation+' '+frame.comparison,visual:'Quadro comparativo de critérios, com colunas sem marcas ou notas inventadas. Deixe o conteúdo factual para materiais verificados.'},
  action:{role:'action',headline:'Defina o próximo passo',text:`${frame.action} O próximo passo sobre ${theme} precisa corresponder à sua necessidade.`,visual:'Sequência de três passos com direção de leitura evidente: organizar, reunir e conversar; destaque apenas o passo final.'},
  summary:{role:'summary',headline:'Leve esta síntese',text:`Para avançar com ${theme}, conecte necessidade, critérios e próximo passo. Uma decisão clara começa com perguntas bem formuladas.`,visual:'Síntese em três palavras-chave conectadas por linhas; recuperar um elemento da capa sem repetir o layout.'},
  cta:{role:'cta',headline:trace.cta,text:`${trace.cta} Compartilhe sua principal dúvida sobre ${theme}.`,visual:'Encerramento com marca e uma chamada principal. Usar contato ou link somente quando fornecido e confirmado pela equipe.'},
 };
 const middle=narrativeRoles[size].map(role=>blocks[role]);
 // An approved fact is quoted once; the remaining blocks develop guidance instead of repeating it.
 if(fact&&!middle.some(b=>b.role==='evidence')){const index=middle.findIndex(b=>b.role==='criteria');if(index>=0)middle[index]={...blocks.evidence,role:'criteria',headline:'Critério com base confirmada',visual:'Informação aprovada em destaque, seguida por composição de critérios; confirme qualquer imagem utilizada.'};}
 return [blocks.hook,...middle,blocks.cta];
}
export function renderEditorialCopy(item:MonthlyItem):string{
 const trace=item.editorial;if(!trace)return item.copy;
 const caption=trace.caption;
 if(item.format==='carousel'&&trace.slides)return trace.slides.map((slide,i)=>`Slide ${i+1}: ${slide.headline&&slide.headline!==slide.text?slide.headline+' — ':''}${slide.text}`).join('\n')+(caption?`\nLegenda: ${caption}`:'');
 if(item.format==='reels'&&trace.scenes)return trace.scenes.map((scene,i)=>`Cena ${i+1} (${scene.seconds}s): ${scene.text}${scene.onScreen?`\nNa tela: ${scene.onScreen}`:''}`).join('\n')+(caption?`\nLegenda: ${caption}`:'');
 return trace.postConcept?`Texto da arte: ${trace.postConcept.headline}\nApoio: ${trace.postConcept.support}\nLegenda: ${trace.postConcept.caption}`:item.copy;
}
export function renderProductionDirection(item:MonthlyItem):string{
 const trace=item.editorial;if(!trace)return '';
 const base=trace.visual.split('\nRoteiro técnico:')[0];
 if(item.format!=='reels'||!trace.scenes)return base;
 return base+'\nRoteiro técnico:\n'+trace.scenes.map((scene,i)=>`Cena ${i+1} (${scene.seconds}s): ${scene.camera||'Plano a confirmar'}; ${scene.audio||'Áudio a confirmar'}. ${scene.visual}`).join('\n');
}
function applyNarrativeStructure(item:MonthlyItem,size:number,seconds:number):MonthlyItem{
 const trace={...item.editorial!};const blocks=narrativeBlocks(trace,size);blocks[0]={...blocks[0],headline:item.title};
 if(item.format==='carousel')trace.slides=blocks.map(b=>({...b}));
 else trace.scenes=blocks.map((b,i)=>({...b,narration:b.text,onScreen:b.headline,seconds:Math.floor(seconds/size)+(i<seconds%size?1:0),camera:cameraForRole(b.role),audio:i===0?'Locução clara; trilha instrumental discreta.':i===size-1?'Locução com pausa antes da chamada; finalizar a trilha sem cortar a frase.':'Voz em primeiro plano; transição sonora discreta entre blocos.'}));
 const updated={...item,editorial:trace};trace.visual=renderProductionDirection(updated);return {...updated,copy:renderEditorialCopy(updated)};
}
function cameraForRole(role:string):string{
 const cameras:Record<string,string>={hook:'Plano médio de abertura; aproximação suave e contato com a câmera.',context:'Plano lateral ou apoio ilustrativo; movimento lento para apresentar o contexto.',diagnostic:'Close de fala; cortes secos entre as três perguntas.',criteria:'Plano superior de uma lista ou gráfico a produzir; revelar um critério por vez.',evidence:'Close estável do material aprovado, se disponível; foco sem simular comprovação.',checklist:'Plano de detalhe de lista ilustrativa; alternar enquadramento a cada item.',comparison:'Plano frontal de quadro comparativo; deslocamento lateral entre critérios.',action:'Planos curtos de organização de ideias; sequência com cortes orientados pelo texto.',summary:'Retorno ao plano médio; enquadramento estável para a síntese.',cta:'Plano fechado de encerramento ou marca; segurar o quadro até concluir a chamada.'};
 return cameras[role]||cameras.criteria;
}

export function generateCampaignPlan(
  month: string,
  client: string,
  context: EditorialContext,
  counts: Record<EditorialFormat, number>,
  options: EngineOptions = {},
): MonthlyItem[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw Error("Informe um mês válido.");
  const total = counts.post + counts.reels + counts.carousel;
  if (
    Object.values(counts).some(
      (n) => !Number.isInteger(n) || n < 0 || n > 30,
    ) ||
    total < 1 ||
    total > 90
  )
    throw Error("Configure de 1 a 90 conteúdos, até 30 por formato.");
  if (!client.trim() || !context.objective.trim() || !context.audience.trim())
    throw Error("Preencha cliente, objetivo e público antes de gerar.");
  const slidesCount = context.carouselSlides ?? 7,
    seconds = context.reelsSeconds ?? 30,
    scenesCount = context.reelsScenes ?? 3;
  if (
    !Number.isInteger(slidesCount) ||
    slidesCount < 3 ||
    slidesCount > 10 ||
    !Number.isInteger(seconds) ||
    seconds < 10 ||
    seconds > 90 ||
    !Number.isInteger(scenesCount) ||
    scenesCount < 3 ||
    scenesCount > 10 ||
    seconds < scenesCount * 2
  )
    throw Error(
      "Use de 3 a 10 slides e de 3 a 10 cenas, com duração de 10 a 90 segundos e pelo menos 2 segundos por cena.",
    );
  const blocked = forbiddenTerms(context),
    avoided = (context.avoidedTopics || []).map(normalizeEditorial);
  const allowedText = (s: string) =>
    ![...blocked, ...avoided].some((t) =>
      (" " + normalizeEditorial(s) + " ").includes(" " + t + " "),
    );
  if (
    !allowedText(
      [
        client,
        context.objective,
        context.audience,
        context.positioning,
        ...(context.approvedFacts || []),
      ].join(" "),
    )
  )
    throw Error(
      "Os dados do briefing conflitam com termos proibidos ou temas a evitar. Revise as entradas.",
    );
  const manual = (context.topics || []).map((t) => t.trim()).filter(Boolean);
  const pillars = (options.pillars || [])
    .filter((p) => p.percentage > 0 && p.example_topics.length)
    .map((p) => ({
      ...p,
      example_topics: p.example_topics.filter(allowedText),
    }))
    .filter((p) => p.example_topics.length);
  if (manual.length)
    pillars.push({
      id: "monthly-priorities",
      name: "Prioridades do mês",
      percentage: 100,
      example_topics: manual.filter(allowedText),
      content_formats: ["post", "carousel", "reels"],
    });
  if (!pillars.some((p) => p.example_topics.length))
    throw Error(
      "Cadastre temas aprovados nos pilares da estratégia ou informe os temas do mês. Nenhum tema elegível disponível.",
    );
  pillars.sort((a, b) => a.id.localeCompare(b.id));
  const history = (options.history || []).filter(
      (h) => h.clientId === options.clientId,
    ),
    used = new Set(
      history.map((h) => h.item.editorial?.signature).filter(Boolean),
    ),
    essential = new Set(
      history
        .filter((h) => h.item.editorial)
        .map(
          (h) =>
            normalizeEditorial(h.item.editorial!.theme) +
            "|" +
            normalizeEditorial(h.item.editorial!.angle),
        ),
    );
  const oldTitles = new Set(
    history
      .filter((h) => !h.item.editorial)
      .map((h) => normalizeEditorial(h.item.title)),
  );
  const repertoire = (options.repertoire || DEFAULT_REPERTOIRE).filter(
    (f) =>
      !(["differential", "process"].includes(f.id) || f.requiresFact) ||
      !!context.approvedFacts?.length,
  );
  const formats: EditorialFormat[] = [];
  const remaining = { ...counts };
  while (formats.length < total)
    for (const f of ["post", "reels", "carousel"] as const)
      if (remaining[f] > 0) {
        formats.push(f);
        remaining[f]--;
      }
  const allocated = new Map<string, number>(),
    themeUse = new Map<string, number>(),
    familyUse = new Map<string, number>(),
    results: MonthlyItem[] = [];
  const [year, m] = month.split("-").map(Number),
    days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  for (const [index, format] of formats.entries()) {
    const eligible = pillars.filter(
      (p) =>
        !p.content_formats.length ||
        p.content_formats.some(
          (f) => f === format || (format === "carousel" && f === "carrossel"),
        ),
    );
    const candidates = eligible
      .flatMap((p) =>
        p.example_topics.flatMap((theme) =>
          repertoire.flatMap((f) =>
            f.angles.map((angle) => ({
              p,
              theme,
              f,
              angle,
              signature: editorialSignature(theme, f.id, angle),
            })),
          ),
        ),
      )
      .filter(
        (c) =>
          allowedText(c.theme) &&
          !used.has(c.signature) &&
          !essential.has(
            normalizeEditorial(c.theme) + "|" + normalizeEditorial(c.angle),
          ),
      )
      .sort(
        (a, b) =>
          (allocated.get(a.p.id) || 0) / a.p.percentage -
            (allocated.get(b.p.id) || 0) / b.p.percentage ||
          (themeUse.get(normalizeEditorial(a.theme)) || 0) -
            (themeUse.get(normalizeEditorial(b.theme)) || 0) ||
          (familyUse.get(a.f.id) || 0) - (familyUse.get(b.f.id) || 0) ||
          (/contato|venda|lead/i.test(context.objective)
            ? (a.f.journey === "Conversão" ? 0 : 1) -
              (b.f.journey === "Conversão" ? 0 : 1)
            : 0) ||
          a.signature.localeCompare(b.signature),
      );
    const selected = candidates.find(
      (c) =>
        !oldTitles.has(
          normalizeEditorial(`${openings[c.angle] || "Sobre"} ${c.theme}`),
        ) && !oldTitles.has(normalizeEditorial(c.theme)),
    );
    if (!selected)
      throw Error(
        `Repertório esgotado para ${format}: ${results.length} de ${total} propostas possíveis. Amplie temas, ângulos ou pilares; nada foi salvo.`,
      );
    const { p, theme, f, angle, signature } = selected;
    used.add(signature);
    essential.add(normalizeEditorial(theme) + "|" + normalizeEditorial(angle));
    allocated.set(p.id, (allocated.get(p.id) || 0) + 1);
    themeUse.set(
      normalizeEditorial(theme),
      (themeUse.get(normalizeEditorial(theme)) || 0) + 1,
    );
    familyUse.set(f.id, (familyUse.get(f.id) || 0) + 1);
    const formal = /formal|profissional|institucional|técnico|tecnico/i.test(context.tone),
      title = `${openings[angle] || "Sobre"} ${theme}`,
      cta =
        f.journey === "Conversão"
          ? formal
            ? "Solicite informações."
            : "Vamos conversar?"
          : f.journey === "Relacionamento"
            ? "Conheça a marca."
            : "Salve para consultar.";
    const fact=context.approvedFacts?.[index%(context.approvedFacts?.length||1)];
    const warnings=[...(!fact?['Sem fatos aprovados: proposta usa perguntas e orientação geral; valide a adequação antes de compartilhar.']:[]),...(!context.tone?['Tom não informado; linguagem neutra aplicada.']:[]),...(!context.visualGuidance?['Identidade visual não informada; designer deve confirmar referências.']:[])];
    const visual=`Direção sugerida, material a produzir: ${context.visualGuidance||"usar a identidade aprovada do cliente"}. Conceito sobre ${theme}; não representa material existente.`;
    const similar = history.filter(
      (h) =>
        h.item.editorial &&
        normalizeEditorial(h.item.editorial.theme) ===
          normalizeEditorial(theme),
    );
    if (similar.length)
      warnings.push(
        `Tema recorrente no histórico: ${similar
          .map(
            (h) =>
              `${h.month || "sem mês"} · ${h.state || "ideia"} · ${h.item.title}`,
          )
          .slice(0, 3)
          .join("; ")}. Novo ângulo aplicado; revise a similaridade.`,
      );
    const trace: EditorialTrace = {
      version: ENGINE_VERSION,
      theme,
      pillarId: p.id,
      pillar: p.name,
      family: f.id,
      angle,
      journey: f.journey,
      objective: context.objective,
      audience: context.audience,
      cta,
      signature,
      visual,
      warnings,
      sources: [
        context.briefingRevision
          ? `Briefing: ${context.briefingRevision}`
          : "Dados preenchidos pela social media",
        ...(fact ? [`Informação aprovada: ${fact}`] : []),
      ],
      rules: [
        "quotas-exatas",
        "peso-do-pilar",
        "historico-do-cliente",
        "sem-fatos-presumidos",
        formal ? "tom-formal" : "tom-direto",
        ...(context.restrictions
          ? ["restricoes-visiveis-e-filtro-de-termos"]
          : []),
      ],
    };
    trace.rules.push('narrativa-progressiva-revisavel');
    const shortTheme=topicReference(theme);
    trace.caption=`${title}.\n${fact||`Ao pensar em ${shortTheme}, organize sua necessidade, seus critérios e o próximo passo.`}\n${cta}`;
    let item:MonthlyItem={date:`${month}-${String(1+Math.floor((index*days)/total)).padStart(2,"0")}`,format,title,copy:trace.caption,editorial:trace};
    if(format==='post'){
      const support=fact||`${decisionFrame(trace).need} Ao pensar em ${shortTheme}, organize essa resposta antes do próximo passo.`;
      trace.postConcept={headline:title,support,composition:`Poster com título em destaque sobre ${shortTheme}, apoio em um único bloco e CTA discreto. Criar uma ilustração conceitual ou usar material autorizado; evitar imagem que sugira resultados inexistentes.`,caption:trace.caption};
      trace.visual+=` ${trace.postConcept.composition}`;
      item.copy=renderEditorialCopy(item);
    } else item=applyNarrativeStructure(item,format==='carousel'?slidesCount:scenesCount,seconds);
    results.push(item);
  }
  validateEditorialItems(results, context);
  return results;
}

export function restructureItem(
  item: MonthlyItem,
  size: number,
  seconds = 30,
): MonthlyItem {
  if (!item.editorial || !["carousel", "reels"].includes(item.format))
    throw Error("Peça sem ficha de formato; ajuste a estrutura manualmente.");
  if (!Number.isInteger(size) || size < 3 || size > 10)
    throw Error("Use de 3 a 10 slides/cenas.");
  const trace = { ...item.editorial,caption:item.editorial.caption||item.copy.split('\n').find(line=>line.startsWith('Legenda:'))?.replace(/^Legenda:\s*/, '') },
    isCarousel = item.format === "carousel";
  if (
    !isCarousel &&
    (!Number.isInteger(seconds) ||
      seconds < 10 ||
      seconds > 90 ||
      seconds < size * 2)
  )
    throw Error(
      "Duração deve ser 10–90 segundos e ao menos 2 segundos por cena.",
    );
  const expected=isCarousel?trace.slides?.length:trace.scenes?.length;
  if(!expected)throw Error('Peça sem blocos estruturados.');
  // Canonical copy must match blocks; an independent free-form edit must not be overwritten.
  const canonical=renderEditorialCopy(item);
  const legacyLines=item.copy.split('\n').filter(line=>isCarousel?/^Slide \d+:/.test(line):/^Cena \d+ \(\d+s\):/.test(line));
  const hasNewStructure=isCarousel?trace.slides?.some(s=>s.role):trace.scenes?.some(s=>s.role);
  if((hasNewStructure&&item.copy!==canonical)||(!hasNewStructure&&legacyLines.length!==expected))throw Error('Estrutura da copy foi editada manualmente. Ajuste os blocos manualmente para não perder conteúdo.');
  const generated=applyNarrativeStructure({...item,editorial:trace},size,seconds);
  if(isCarousel){
    const old=trace.slides!;generated.editorial!.slides=generated.editorial!.slides!.map((block,i)=>{const previous=old.find(b=>b.role&&b.role===block.role)||(i===0?old[0]:i===size-1?old[old.length-1]:!hasNewStructure?old[i]:undefined);return previous?{...block,...previous}:block;});
  }else{
    const old=trace.scenes!;generated.editorial!.scenes=generated.editorial!.scenes!.map((block,i)=>{const previous=old.find(b=>b.role&&b.role===block.role)||(i===0?old[0]:i===size-1?old[old.length-1]:!hasNewStructure?old[i]:undefined);return previous?{...block,...previous,seconds:block.seconds}:block;});
  }
  generated.editorial!.visual=renderProductionDirection(generated);
  generated.copy=renderEditorialCopy(generated);
  return generated;
}
