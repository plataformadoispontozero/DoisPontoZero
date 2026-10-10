// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: BRIEFING STUDIO INTEGRATION
// Import data from client briefings into proposal sections
// ============================================================

import type { Briefing } from '@/types/briefing'
import type { ProposalSection } from '@/types/proposals'

export interface BriefingProposalImport {
  proposalTitle: string
  clientName: string
  suggestedSections: Partial<ProposalSection>[]
  suggestedNotes: string[]
}

export function importDataFromBriefing(briefing: Briefing | any): BriefingProposalImport {
  const clientName = briefing.client?.name || briefing.client_name || briefing.company_name || 'Cliente'
  const briefingTitle = briefing.title || 'Briefing Institucional'

  // Extract answers safely
  const answers = briefing.answers || {}

  const suggestedSections: Partial<ProposalSection>[] = [
    {
      section_type: 'introduction',
      title: 'Contexto do Cliente & Respostas do Briefing',
      position: 1,
      is_visible: true,
      content: {
        text: `Proposta comercial elaborada a partir das diretrizes coletadas no briefing "${briefingTitle}" preenchido por ${clientName}.`,
        briefing_id: briefing.id,
        submitted_at: briefing.created_at,
      },
    },
    {
      section_type: 'diagnosis',
      title: 'Diagnóstico & Desafios Identificados',
      position: 2,
      is_visible: true,
      content: {
        text: answers.challenges || answers.desafios || answers.objetivos || 'Aumentar a relevância de marca e otimizar a conversão de novos clientes.',
      },
    },
    {
      section_type: 'objectives',
      title: 'Objetivos Principais do Projeto',
      position: 3,
      is_visible: true,
      content: {
        list: Array.isArray(answers.goals)
          ? answers.goals
          : [
              answers.objective || 'Aumentar alcance e engajamento da marca nas redes sociais',
              'Desenvolver posicionamento estético de alta percepção de valor',
              'Garantir entregas contínuas com controle de prazos e qualidade',
            ],
      },
    },
  ]

  const suggestedNotes: string[] = [
    `Briefing respondido por ${clientName} em ${new Date(briefing.created_at || Date.now()).toLocaleDateString('pt-BR')}.`,
  ]

  if (answers.budget) {
    suggestedNotes.push(`Expectativa de investimento declarada no briefing: ${answers.budget}`)
  }

  return {
    proposalTitle: `Proposta Comercial — ${clientName}`,
    clientName,
    suggestedSections,
    suggestedNotes,
  }
}
