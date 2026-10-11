export type EditorialFormat = "post" | "reels" | "carousel";
export interface MonthlyItem {
  date: string;
  format: EditorialFormat;
  title: string;
  copy: string;
}
export interface EditorialContext {
  objective: string;
  audience: string;
  tone: string;
  positioning: string;
  restrictions: string;
}
export const emptyContext: EditorialContext = {
  objective: "",
  audience: "",
  tone: "",
  positioning: "",
  restrictions: "",
};
export const formatNames = {
  post: "Post",
  reels: "Reels",
  carousel: "Carrossel",
};
export function generateMonthlyPlan(
  month: string,
  client: string,
  context: EditorialContext,
  counts: Record<EditorialFormat, number>,
): MonthlyItem[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("Informe um mês válido.");
  const total = counts.post + counts.reels + counts.carousel;
  if (
    Object.values(counts).some(
      (n) => !Number.isInteger(n) || n < 0 || n > 30,
    ) ||
    total < 1 ||
    total > 90
  )
    throw new Error("Configure de 1 a 90 conteúdos, até 30 por formato.");
  if (!client.trim() || !context.objective.trim() || !context.audience.trim())
    throw new Error("Preencha cliente, objetivo e público antes de gerar.");
  const [year, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const remaining = { ...counts },
    formats: EditorialFormat[] = [];
  while (formats.length < total)
    for (const f of ["post", "reels", "carousel"] as const)
      if (remaining[f] > 0) {
        formats.push(f);
        remaining[f]--;
      }
  const themes = [
    "Uma dúvida do seu público",
    "Como sua solução funciona",
    "O diferencial da marca",
    "Uma dica prática",
    "Bastidores e processo",
    "Convite para conhecer a marca",
  ];
  return formats.map((format, i) => {
    const theme = themes[i % themes.length];
    const opening = `${theme}: ${client}.`;
    const body = `${context.positioning || `Conheça a proposta de ${client}.`}\nConteúdo pensado para ${context.audience}, com foco em ${context.objective}.`;
    const structure =
      format === "reels"
        ? `Roteiro: abertura com a dúvida, demonstração da solução e convite final.\n${opening}\n${body}`
        : format === "carousel"
          ? `Slide 1: ${opening}\nSlide 2: explique a necessidade de ${context.audience}.\nSlide 3: ${context.positioning || "Apresente a solução da marca."}\nLegenda: ${body}`
          : `${opening}\n${body}`;
    return {
      date: `${month}-${String(1 + Math.floor((i * days) / total)).padStart(2, "0")}`,
      format,
      title: `${theme} — ${client}`.slice(0, 200),
      copy: `${structure}\nVamos conversar sobre o que você precisa.`.slice(
        0,
        3000,
      ),
    };
  });
}
