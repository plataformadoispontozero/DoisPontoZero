// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO & EDITORIAL GENERATOR TESTS
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  extractStrategyFromBriefing,
  calculateBriefingCoverage,
} from './services/briefingIntelligence'
import {
  generateEditorialSuggestions,
  getPillarDistribution,
} from './services/editorialEngine'
import {
  STRATEGY_STATUS_CONFIG,
  IDEA_STATUS_CONFIG,
  EDITORIAL_STATUS_CONFIG,
  CONTENT_FORMAT_CONFIG,
  SOCIAL_CHANNEL_CONFIG,
  DEFAULT_PILLAR_COLORS,
} from '@/types/strategy'
import type { EditorialPillar, ContentIdea } from '@/types/strategy'
import type { BriefingAnswer, BriefingQuestion } from '@/types/briefing'

describe('Strategy Studio — Briefing Intelligence (Deterministic)', () => {
  const mockQuestions: BriefingQuestion[] = [
    {
      id: 'q1',
      agency_id: 'agency-1',
      template_id: 'tpl-1',
      section_id: 'sec-1',
      question_key: 'target_audience',
      label: 'Público-Alvo',
      description: null,
      question_type: 'short_text',
      is_required: true,
      position: 0,
      options: [],
      validation_rules: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'q2',
      agency_id: 'agency-1',
      template_id: 'tpl-1',
      section_id: 'sec-1',
      question_key: 'objetivo_principal',
      label: 'Objetivo',
      description: null,
      question_type: 'short_text',
      is_required: true,
      position: 1,
      options: [],
      validation_rules: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'q3',
      agency_id: 'agency-1',
      template_id: 'tpl-1',
      section_id: 'sec-1',
      question_key: 'tom_de_voz',
      label: 'Tom de Voz',
      description: null,
      question_type: 'short_text',
      is_required: false,
      position: 2,
      options: [],
      validation_rules: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'q4',
      agency_id: 'agency-1',
      template_id: 'tpl-1',
      section_id: 'sec-1',
      question_key: 'redes_sociais',
      label: 'Redes Sociais',
      description: null,
      question_type: 'multiple_choice',
      is_required: false,
      position: 3,
      options: [],
      validation_rules: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'q5',
      agency_id: 'agency-1',
      template_id: 'tpl-1',
      section_id: 'sec-1',
      question_key: 'concorrentes',
      label: 'Concorrentes',
      description: null,
      question_type: 'short_text',
      is_required: false,
      position: 4,
      options: [],
      validation_rules: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'q6',
      agency_id: 'agency-1',
      template_id: 'tpl-1',
      section_id: 'sec-1',
      question_key: 'perguntas_extras_sem_mapeamento',
      label: 'Outra Pergunta',
      description: null,
      question_type: 'short_text',
      is_required: false,
      position: 5,
      options: [],
      validation_rules: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const mockAnswers: BriefingAnswer[] = [
    {
      id: 'a1',
      agency_id: 'agency-1',
      briefing_id: 'b1',
      question_id: 'q1',
      answer_value: 'CEOs e Diretores de Tecnologia',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a2',
      agency_id: 'agency-1',
      briefing_id: 'b1',
      question_id: 'q2',
      answer_value: 'Consolidar liderança e gerar 50 MQLs/mês',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a3',
      agency_id: 'agency-1',
      briefing_id: 'b1',
      question_id: 'q3',
      answer_value: 'Inspirador, inovador e autoritário',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a4',
      agency_id: 'agency-1',
      briefing_id: 'b1',
      question_id: 'q4',
      answer_value: ['instagram', 'linkedin', 'youtube'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a5',
      agency_id: 'agency-1',
      briefing_id: 'b1',
      question_id: 'q5',
      answer_value: 'Empresa X, Studio Y, Brand Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  it('maps briefing answers directly to strategic fields deterministically', () => {
    const result = extractStrategyFromBriefing(mockAnswers, mockQuestions)

    expect(result.target_audience).toBe('CEOs e Diretores de Tecnologia')
    expect(result.objective).toBe('Consolidar liderança e gerar 50 MQLs/mês')
    expect(result.tone_of_voice).toBe('Inspirador, inovador e autoritário')
    expect(result.channels).toEqual(['instagram', 'linkedin', 'youtube'])
    expect(result.competitors).toEqual(['Empresa X', 'Studio Y', 'Brand Z'])
  })

  it('calculates briefing coverage percentage correctly', () => {
    const coverage = calculateBriefingCoverage(mockQuestions)

    expect(coverage.mappedFields).toContain('target_audience')
    expect(coverage.mappedFields).toContain('objective')
    expect(coverage.mappedFields).toContain('tone_of_voice')
    expect(coverage.mappedFields).toContain('channels')
    expect(coverage.mappedFields).toContain('competitors')
    expect(coverage.unmappedKeys).toContain('perguntas_extras_sem_mapeamento')
    expect(coverage.score).toBeGreaterThan(0)
    expect(coverage.score).toBeLessThanOrEqual(100)
  })
})

describe('Strategy Studio — Editorial Engine (Deterministic Suggestion Generator)', () => {
  const mockPillars: EditorialPillar[] = [
    {
      id: 'pillar-1',
      agency_id: 'agency-1',
      strategy_id: 'strat-1',
      name: 'Autoridade Técnica',
      description: 'Cases e frameworks.',
      color: '#7952FF',
      icon: 'Award',
      percentage: 50,
      position: 0,
      content_formats: ['carrossel', 'artigo'],
      posting_frequency: '3x por semana',
      example_topics: ['Como escalar times ágeis', 'Métricas essenciais de marketing'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pillar-2',
      agency_id: 'agency-1',
      strategy_id: 'strat-1',
      name: 'Cultura & Bastidores',
      description: 'Humanização e equipe.',
      color: '#10B981',
      icon: 'Users',
      percentage: 30,
      position: 1,
      content_formats: ['stories', 'reels'],
      posting_frequency: '2x por semana',
      example_topics: ['Dia a dia no estúdio', 'Nossos rituais de design'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pillar-3',
      agency_id: 'agency-1',
      strategy_id: 'strat-1',
      name: 'Conversão Direta',
      description: 'Ofertas e chamadas.',
      color: '#F59E0B',
      icon: 'Zap',
      percentage: 20,
      position: 2,
      content_formats: ['post', 'carrossel'],
      posting_frequency: '1x por semana',
      example_topics: ['Depoimento de cliente', 'Oferta do mês'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  it('generates suggestions distributed across pillars respecting weights and formats', () => {
    const suggestions = generateEditorialSuggestions(mockPillars, 30)

    expect(suggestions.length).toBeGreaterThan(0)

    // Verify all suggestions have required fields
    for (const sug of suggestions) {
      expect(sug.pillar_id).toBeTruthy()
      expect(sug.pillar_name).toBeTruthy()
      expect(sug.pillar_color).toBeTruthy()
      expect(sug.suggested_format).toBeTruthy()
      expect(sug.suggested_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(sug.example_topics.length).toBeGreaterThan(0)
    }

    // Verify higher weight pillar gets more items than lower weight pillar
    const p1Count = suggestions.filter((s) => s.pillar_id === 'pillar-1').length
    const p3Count = suggestions.filter((s) => s.pillar_id === 'pillar-3').length
    expect(p1Count).toBeGreaterThanOrEqual(p3Count)
  })

  it('calculates pillar distribution summary accurately', () => {
    const distribution = getPillarDistribution(mockPillars)

    expect(distribution.length).toBe(3)
    expect(distribution[0].pillar.name).toBe('Autoridade Técnica')
    expect(distribution[0].weeklyPosts).toBe(3)
    expect(distribution[0].monthlyPosts).toBeGreaterThan(0)
    expect(distribution[0].percentage).toBe(50)

    const totalWeight = distribution.reduce((acc, p) => acc + p.percentage, 0)
    expect(totalWeight).toBe(100)
  })

  it('handles empty pillars list safely without errors', () => {
    const suggestions = generateEditorialSuggestions([], 30)
    expect(suggestions).toEqual([])
  })
})

describe('Strategy Studio — Domain Configurations', () => {
  it('has all required strategy statuses with labels and badges', () => {
    expect(STRATEGY_STATUS_CONFIG.draft).toBeDefined()
    expect(STRATEGY_STATUS_CONFIG.active).toBeDefined()
    expect(STRATEGY_STATUS_CONFIG.paused).toBeDefined()
    expect(STRATEGY_STATUS_CONFIG.completed).toBeDefined()
    expect(STRATEGY_STATUS_CONFIG.archived).toBeDefined()
  })

  it('has all required idea statuses with labels and badges', () => {
    expect(IDEA_STATUS_CONFIG.idea).toBeDefined()
    expect(IDEA_STATUS_CONFIG.approved).toBeDefined()
    expect(IDEA_STATUS_CONFIG.in_production).toBeDefined()
    expect(IDEA_STATUS_CONFIG.scheduled).toBeDefined()
    expect(IDEA_STATUS_CONFIG.published).toBeDefined()
    expect(IDEA_STATUS_CONFIG.discarded).toBeDefined()
  })

  it('has all required editorial statuses with labels and badges', () => {
    expect(EDITORIAL_STATUS_CONFIG.draft).toBeDefined()
    expect(EDITORIAL_STATUS_CONFIG.in_review).toBeDefined()
    expect(EDITORIAL_STATUS_CONFIG.approved).toBeDefined()
    expect(EDITORIAL_STATUS_CONFIG.scheduled).toBeDefined()
    expect(EDITORIAL_STATUS_CONFIG.published).toBeDefined()
  })

  it('provides rich social channels and content format mappings', () => {
    expect(CONTENT_FORMAT_CONFIG.carrossel).toBeDefined()
    expect(CONTENT_FORMAT_CONFIG.reels).toBeDefined()
    expect(CONTENT_FORMAT_CONFIG.stories).toBeDefined()
    expect(SOCIAL_CHANNEL_CONFIG.instagram).toBeDefined()
    expect(SOCIAL_CHANNEL_CONFIG.linkedin).toBeDefined()
    expect(DEFAULT_PILLAR_COLORS.length).toBeGreaterThanOrEqual(8)
  })
})
