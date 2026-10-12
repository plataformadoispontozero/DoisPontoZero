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
      [item.title, item.copy, item.editorial?.visual || ""].join(" "),
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
    const formal = /formal|institucional|técnico|tecnico/i.test(context.tone),
      title = `${openings[angle] || "Sobre"} ${theme}`,
      cta =
        f.journey === "Conversão"
          ? formal
            ? "Solicite informações."
            : "Vamos conversar?"
          : f.journey === "Relacionamento"
            ? "Conheça a marca."
            : "Salve para consultar.";
    const fact =
        context.approvedFacts?.[index % (context.approvedFacts?.length || 1)],
      pending = `[Completar com informação aprovada sobre ${theme}.]`;
    const support =
      fact ||
      (f.id === "institutional" && context.positioning
        ? context.positioning
        : pending);
    const warnings = [
      ...(!fact
        ? [
            "Conteúdo de apoio pendente: forneça uma informação aprovada antes de enviar ao cliente.",
          ]
        : []),
      ...(!context.tone
        ? ["Tom não informado; linguagem neutra aplicada."]
        : []),
      ...(!context.visualGuidance
        ? [
            "Identidade visual não informada; designer deve confirmar referências.",
          ]
        : []),
    ];
    const visual = `Direção sugerida, material a produzir: ${context.visualGuidance || "usar a identidade aprovada do cliente"}. Composição com foco em ${theme}, hierarquia curta e espaço livre para o título. Não representa material existente.`;
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
    let copy = `${title}.\n${support}\n${cta}`;
    if (format === "carousel") {
      trace.slides = Array.from({ length: slidesCount }, (_, i) => ({
        text:
          i === 0
            ? title
            : i === slidesCount - 1
              ? cta
              : i === 1
                ? support
                : `[Complementar: ponto ${i} aprovado sobre ${theme}.]`,
        visual: `Direção sugerida do slide ${i + 1}: ${i === 0 ? "capa tipográfica" : i === slidesCount - 1 ? "síntese com logo" : "diagrama ou detalhe visual a produzir"}, conforme identidade aprovada.`,
      }));
      copy =
        trace.slides
          .map((slide, i) => `Slide ${i + 1}: ${slide.text}`)
          .join("\n") + `\nLegenda: ${title}. ${cta}`;
      trace.warnings.push(
        "Revisar cada slide e fornecer os pontos aprovados; o motor não inventa informações para preencher slides.",
      );
    }
    if (format === "reels") {
      trace.scenes = Array.from({ length: scenesCount }, (_, i) => ({
        seconds:
          Math.floor(seconds / scenesCount) +
          (i < seconds % scenesCount ? 1 : 0),
        text:
          i === 0
            ? title
            : i === scenesCount - 1
              ? cta
              : i === 1
                ? support
                : `[Complementar: fala ${i} aprovada sobre ${theme}.]`,
        visual:
          i === 0
            ? `Plano de abertura sugerido; texto na tela. Material a gravar: ${theme}.`
            : i === scenesCount - 1
              ? "Fechamento com marca e uma única chamada."
              : "Plano de apoio ou demonstração sugerida, a confirmar e gravar; não representa cena existente.",
      }));
      copy = trace.scenes
        .map((scene, i) => `Cena ${i + 1} (${scene.seconds}s): ${scene.text}`)
        .join("\n");
    }
    results.push({
      date: `${month}-${String(1 + Math.floor((index * days) / total)).padStart(2, "0")}`,
      format,
      title,
      copy,
      editorial: trace,
    });
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
  const trace = { ...item.editorial },
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
  const lines = item.copy
    .split("\n")
    .filter((line) =>
      isCarousel ? /^Slide \d+:/.test(line) : /^Cena \d+ \(\d+s\):/.test(line),
    );
  const expected = isCarousel ? trace.slides?.length : trace.scenes?.length;
  if (!expected || lines.length !== expected)
    throw Error(
      "Estrutura da copy foi editada manualmente. Ajuste os blocos manualmente para não perder conteúdo.",
    );
  const texts = lines.map((line) =>
    line.replace(isCarousel ? /^Slide \d+:\s*/ : /^Cena \d+ \(\d+s\):\s*/, ""),
  );
  const next = Array.from({ length: size }, (_, i) =>
    i === 0
      ? texts[0]
      : i === size - 1
        ? texts[texts.length - 1]
        : texts[i] && i < texts.length - 1
          ? texts[i]
          : `[Complementar: ponto ${i} aprovado sobre ${trace.theme}.]`,
  );
  if (isCarousel) {
    trace.slides = next.map((text, i) => ({
      text,
      visual: `Direção sugerida do slide ${i + 1}: ${i === 0 ? "capa tipográfica" : i === size - 1 ? "síntese e CTA" : "recurso gráfico ou detalhe a produzir"} na identidade aprovada.`,
    }));
    return {
      ...item,
      editorial: trace,
      copy:
        next.map((text, i) => `Slide ${i + 1}: ${text}`).join("\n") +
        "\n" +
        (item.copy.split("\n").find((line) => line.startsWith("Legenda:")) ||
          `Legenda: ${item.title}. ${trace.cta}`),
    };
  }
  trace.scenes = next.map((text, i) => ({
    text,
    seconds: Math.floor(seconds / size) + (i < seconds % size ? 1 : 0),
    visual: `Cena ${i + 1}: plano sugerido a confirmar e gravar; não representa material existente.`,
  }));
  return {
    ...item,
    editorial: trace,
    copy: trace.scenes
      .map((scene, i) => `Cena ${i + 1} (${scene.seconds}s): ${scene.text}`)
      .join("\n"),
  };
}
