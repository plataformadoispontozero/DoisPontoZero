// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: BRIEFING STUDIO & PDF GENERATION TESTS
// ============================================================

import { describe, it, expect } from 'vitest'
import { transformBriefingToPdfModel } from './pdf/transformBriefingToPdfModel'
import { sha256Hex, generateSecureToken } from './hooks/useBriefings'
import { INITIAL_BRIEFING_TEMPLATES } from './constants/initialTemplates'
import { BRIEFING_CATEGORY_CONFIG, BRIEFING_STATUS_CONFIG, QUESTION_TYPE_CONFIG } from '@/types/briefing'
import type { Briefing } from '@/types/briefing'

describe('Briefing Studio — Domain & PDF Model', () => {
  it('contains all 5 official initial templates with valid structure', () => {
    expect(INITIAL_BRIEFING_TEMPLATES.length).toBe(5)

    const categories = INITIAL_BRIEFING_TEMPLATES.map((t) => t.category)
    expect(categories).toContain('branding')
    expect(categories).toContain('social_media')
    expect(categories).toContain('motion')
    expect(categories).toContain('audiovisual')
    expect(categories).toContain('campaign')

    for (const tpl of INITIAL_BRIEFING_TEMPLATES) {
      expect(tpl.name).toBeTruthy()
      expect(tpl.sections.length).toBeGreaterThan(0)
      const allQuestions = tpl.sections.flatMap((s) => s.questions)
      expect(allQuestions.length).toBeGreaterThan(0)
      for (const q of allQuestions) {
        expect(q.question_key).toBeTruthy()
        expect(q.label).toBeTruthy()
        expect(QUESTION_TYPE_CONFIG[q.question_type]).toBeDefined()
      }
    }
  })

  it('generates a secure 48-char hex token and computes sha256 correctly', async () => {
    const token = generateSecureToken()
    expect(token).toHaveLength(48)

    const hash1 = await sha256Hex(token)
    const hash2 = await sha256Hex(token)
    expect(hash1).toHaveLength(64)
    expect(hash1).toBe(hash2) // deterministic
  })

  it('transforms a briefing into a validated BriefingPdfModel', () => {
    const mockBriefing: Briefing = {
      id: 'brf-12345678-abcd',
      agency_id: 'agency-1',
      client_id: 'client-1',
      template_id: 'tpl-branding-v1',
      template_version: 2,
      title: 'Redesign Marca 2026',
      description: 'Briefing estratégico de identidade visual.',
      status: 'submitted',
      created_by: null,
      assigned_to: null,
      created_at: '2026-10-10T10:00:00Z',
      updated_at: '2026-10-10T12:00:00Z',
      submitted_at: '2026-10-10T12:00:00Z',
      approved_at: null,
      archived_at: null,
      client: {
        id: 'client-1',
        agency_id: 'agency-1',
        name: 'Studio Alfa',
        slug: 'studio-alfa',
        logo_url: null,
        status: 'active',
        created_at: '2026-10-10T00:00:00Z',
        updated_at: '2026-10-10T00:00:00Z',
      },
      template: {
        id: 'tpl-branding-v1',
        agency_id: 'agency-1',
        name: 'Branding & Identidade Visual',
        description: null,
        category: 'branding',
        status: 'published',
        version: 2,
        created_by: null,
        created_at: '2026-10-10T00:00:00Z',
        updated_at: '2026-10-10T00:00:00Z',
        archived_at: null,
        sections: [
          {
            id: 'sec-1',
            agency_id: 'agency-1',
            template_id: 'tpl-branding-v1',
            title: 'Sobre a Empresa',
            description: 'Histórico e posicionamento',
            position: 0,
            created_at: '2026-10-10T00:00:00Z',
            updated_at: '2026-10-10T00:00:00Z',
          },
        ],
        questions: [
          {
            id: 'q-1',
            agency_id: 'agency-1',
            template_id: 'tpl-branding-v1',
            section_id: 'sec-1',
            question_key: 'history',
            label: 'História da Marca',
            description: null,
            question_type: 'long_text',
            is_required: true,
            position: 0,
            options: [],
            validation_rules: {},
            created_at: '2026-10-10T00:00:00Z',
            updated_at: '2026-10-10T00:00:00Z',
          },
          {
            id: 'q-2',
            agency_id: 'agency-1',
            template_id: 'tpl-branding-v1',
            section_id: 'sec-1',
            question_key: 'colors',
            label: 'Preferência de Cores',
            description: null,
            question_type: 'multiple_choice',
            is_required: false,
            position: 1,
            options: [
              { id: '1', label: 'Azul', value: 'blue' },
              { id: '2', label: 'Verde', value: 'green' },
            ],
            validation_rules: {},
            created_at: '2026-10-10T00:00:00Z',
            updated_at: '2026-10-10T00:00:00Z',
          },
        ],
      },
      answers: [
        {
          id: 'ans-1',
          agency_id: 'agency-1',
          briefing_id: 'brf-12345678-abcd',
          question_id: 'q-1',
          answer_value: 'Fundada em 2020 para revolucionar o design editorial.',
          created_at: '2026-10-10T12:00:00Z',
          updated_at: '2026-10-10T12:00:00Z',
        },
        {
          id: 'ans-2',
          agency_id: 'agency-1',
          briefing_id: 'brf-12345678-abcd',
          question_id: 'q-2',
          answer_value: ['blue', 'green'],
          created_at: '2026-10-10T12:00:00Z',
          updated_at: '2026-10-10T12:00:00Z',
        },
      ],
    }

    const model = transformBriefingToPdfModel(mockBriefing, {
      agencyName: 'Agência Criativa Premium',
      primaryColor: '#7952FF',
    })

    expect(model.title).toBe('Redesign Marca 2026')
    expect(model.clientName).toBe('Studio Alfa')
    expect(model.documentId).toBe('BRF-BRF-1234-V2')
    expect(model.categoryLabel).toBe('Branding & Identidade')
    expect(model.version).toBe(2)
    expect(model.metadata.totalQuestions).toBe(2)
    expect(model.metadata.answeredQuestions).toBe(2)
    expect(model.metadata.completionRate).toBe(100)
    expect(model.branding.agencyName).toBe('Agência Criativa Premium')

    // Questions verification
    const sec1 = model.sections[0]
    expect(sec1.title).toBe('Sobre a Empresa')
    expect(sec1.questions[0].answerText).toBe(
      'Fundada em 2020 para revolucionar o design editorial.'
    )
    expect(sec1.questions[1].answerText).toBe('Azul • Verde')
  })

  it('throws an error if briefing has no title', () => {
    const invalidBriefing = {
      id: 'brf-invalid',
      title: '',
    } as any

    expect(() => transformBriefingToPdfModel(invalidBriefing)).toThrow(
      'Título do briefing é obrigatório'
    )
  })
})
