// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Briefing Intelligence: Maps briefing answers → strategy fields
// 100% deterministic — NO AI/LLM dependencies
// ============================================================

import type { BriefingAnswer, BriefingQuestion } from '@/types/briefing'
import type { CreateStrategyForm } from '@/types/strategy'

// Question key → strategy field mapping
const QUESTION_KEY_MAP: Record<string, keyof CreateStrategyForm> = {
  // Audience / Target
  target_audience: 'target_audience',
  publico_alvo: 'target_audience',
  audience: 'target_audience',
  persona: 'target_audience',
  cliente_final: 'target_audience',

  // Objectives
  objective: 'objective',
  objetivo: 'objective',
  meta: 'objective',
  goals: 'objective',
  objetivo_principal: 'objective',

  // Tone of Voice
  tone_of_voice: 'tone_of_voice',
  tom_de_voz: 'tone_of_voice',
  tom_comunicacao: 'tone_of_voice',
  linguagem: 'tone_of_voice',
  estilo_comunicacao: 'tone_of_voice',

  // Brand Positioning
  brand_positioning: 'brand_positioning',
  posicionamento: 'brand_positioning',
  posicionamento_marca: 'brand_positioning',
  diferencial: 'brand_positioning',

  // Channels
  channels: 'channels',
  canais: 'channels',
  plataformas: 'channels',
  redes_sociais: 'channels',

  // Competitors
  competitors: 'competitors',
  concorrentes: 'competitors',
  concorrencia: 'competitors',

  // Restrictions
  restrictions: 'restrictions',
  restricoes: 'restrictions',
  limitacoes: 'restrictions',
  nao_fazer: 'restrictions',
  proibicoes: 'restrictions',

  // Description
  descricao_projeto: 'description',
  contexto: 'description',
  briefing_geral: 'description',
  overview: 'description',
}

// Keys that produce arrays
const ARRAY_FIELDS: Set<keyof CreateStrategyForm> = new Set([
  'channels',
  'competitors',
  'key_messages',
  'restrictions',
])

/**
 * Extracts strategy fields from briefing answers using deterministic key mapping.
 * No AI/ML/LLM — purely rule-based.
 */
export function extractStrategyFromBriefing(
  answers: BriefingAnswer[],
  questions: BriefingQuestion[]
): Partial<CreateStrategyForm> {
  const result: Partial<CreateStrategyForm> = {}

  // Build a map of question_id → question for quick lookup
  const questionMap = new Map(questions.map((q) => [q.id, q]))

  for (const answer of answers) {
    const question = questionMap.get(answer.question_id) ?? answer.question
    if (!question) continue

    const key = question.question_key.toLowerCase().replace(/[-\s]/g, '_')
    const strategyField = QUESTION_KEY_MAP[key]

    if (!strategyField) continue

    const value = answer.answer_value ?? (answer as any).value

    if (ARRAY_FIELDS.has(strategyField)) {
      // Convert value to array
      const arrayField = strategyField as 'channels' | 'competitors' | 'key_messages' | 'restrictions'
      if (Array.isArray(value)) {
        result[arrayField] = value.map(String)
      } else if (typeof value === 'string') {
        // Split by comma, semicolon, or newline
        result[arrayField] = value
          .split(/[,;\n]+/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
    } else {
      // Scalar field
      const scalarField = strategyField as 'objective' | 'target_audience' | 'tone_of_voice' | 'brand_positioning' | 'description'
      if (typeof value === 'string') {
        result[scalarField] = value
      } else if (Array.isArray(value)) {
        result[scalarField] = value.join(', ')
      } else if (value != null) {
        result[scalarField] = String(value)
      }
    }
  }

  return result
}

/**
 * Checks how many strategy-relevant fields can be extracted from given questions.
 * Returns a coverage score (0–100) and list of mapped fields.
 */
export function calculateBriefingCoverage(questions: BriefingQuestion[]): {
  score: number
  mappedFields: string[]
  unmappedKeys: string[]
} {
  const totalRelevantFields = Object.keys(
    new Set(Object.values(QUESTION_KEY_MAP))
  ).length

  const mappedFields: string[] = []
  const unmappedKeys: string[] = []

  for (const q of questions) {
    const key = q.question_key.toLowerCase().replace(/[-\s]/g, '_')
    if (QUESTION_KEY_MAP[key]) {
      const field = QUESTION_KEY_MAP[key]
      if (!mappedFields.includes(field)) {
        mappedFields.push(field)
      }
    } else {
      unmappedKeys.push(q.question_key)
    }
  }

  const uniqueMapped = new Set(Object.values(QUESTION_KEY_MAP))
  const score = Math.round((mappedFields.length / uniqueMapped.size) * 100)

  return { score, mappedFields, unmappedKeys }
}
