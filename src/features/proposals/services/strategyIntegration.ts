// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: STRATEGY STUDIO INTEGRATION
// Import strategic objectives, diagnosis and recommendations into proposals
// ============================================================

import type { ContentStrategy } from '@/types/strategy'
import type { ProposalSection } from '@/types/proposals'

export interface StrategyProposalImport {
  strategyTitle: string
  suggestedSections: Partial<ProposalSection>[]
}

export function importDataFromStrategy(strategy: ContentStrategy | any): StrategyProposalImport {
  const strategyTitle = strategy.name || strategy.title || 'Estratégia de Conteúdo'

  const suggestedSections: Partial<ProposalSection>[] = [
    {
      section_type: 'diagnosis',
      title: 'Diagnóstico Estratégico & Posicionamento',
      position: 2,
      is_visible: true,
      content: {
        text: strategy.description || strategy.diagnosis || 'Análise de posicionamento desenvolvida no Strategy Studio.',
        positioning: strategy.brand_positioning || strategy.target_positioning,
        main_channels: strategy.channels || strategy.main_channels || [],
      },
    },
    {
      section_type: 'objectives',
      title: 'Pilares & Metas Estratégicas',
      position: 3,
      is_visible: true,
      content: {
        strategy_id: strategy.id,
        list: strategy.key_messages || strategy.primary_goals || ['Consolidar presença de marca', 'Aumentar taxa de conversão'],
        tone_of_voice: strategy.tone_of_voice,
      },
    },
  ]

  return {
    strategyTitle,
    suggestedSections,
  }
}
