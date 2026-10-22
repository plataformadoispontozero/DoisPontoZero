import type { EditorialContext } from './monthlyPlanner';
import type { PillarInput } from './campaignEngine';
import { missingEditorialInputs } from './editorialContext';

export const editorialSteps = ['Cliente e briefing', 'Direção editorial', 'Plano automático', 'Revisar e gerar'] as const;
export function editorialStepIssues(step: number, client: string, month: string, context: EditorialContext, counts: { post: number; reels: number; carousel: number }, pillars: PillarInput[]): string[] {
  if (!client || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return ['selecione o cliente e um mês válido'];
  if (step >= 1) {
    const missing = missingEditorialInputs(context, pillars);
    if (missing.length) return missing;
  }
  if (step >= 2) {
    if (Object.values(counts).some(value => !Number.isInteger(value) || value < 0 || value > 12)) return ['use quantidades inteiras entre 0 e 12'];
    if (Object.values(counts).reduce((sum,value)=>sum+value,0)>12) return ['o mês permite até 12 materiais no total'];
    if (!Object.values(counts).some(value => value > 0)) return ['adicione pelo menos um conteúdo'];
    if (counts.carousel > 0 && (!Number.isInteger(context.carouselSlides ?? 5) || (context.carouselSlides ?? 5) < 3 || (context.carouselSlides ?? 5) > 8)) return ['defina entre 3 e 8 lâminas por carrossel'];
    if (counts.reels > 0 && (!Number.isInteger(context.reelsScenes ?? 3) || (context.reelsScenes ?? 3) < 3 || (context.reelsScenes ?? 3) > 10 || !Number.isInteger(context.reelsSeconds ?? 30) || (context.reelsSeconds ?? 30) < 10 || (context.reelsSeconds ?? 30) > 90)) return ['defina de 3 a 10 cenas e de 10 a 90 segundos por reel'];
  }
  return [];
}
