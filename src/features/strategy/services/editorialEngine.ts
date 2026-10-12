// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// Editorial Engine: Deterministic content suggestion generator
// 100% rule-based — NO AI/LLM dependencies
// ============================================================

import type { EditorialPillar, ContentIdea, EditorialSuggestion, ContentFormat } from '@/types/strategy'

// Content format distribution weights per posting frequency pattern
const FREQUENCY_MAP: Record<string, number> = {
  'diário': 7,
  'diario': 7,
  '7x por semana': 7,
  '6x por semana': 6,
  '5x por semana': 5,
  '4x por semana': 4,
  '3x por semana': 3,
  '2x por semana': 2,
  '1x por semana': 1,
  'semanal': 1,
  'quinzenal': 0.5,
  'mensal': 0.25,
}

function parseFrequency(freq: string | null): number {
  if (!freq) return 2 // Default: 2x per week
  const normalized = freq.trim().toLowerCase()

  // Check direct match
  if (FREQUENCY_MAP[normalized] !== undefined) return FREQUENCY_MAP[normalized]

  // Try extracting number (e.g. "3x", "3 vezes")
  const match = normalized.match(/(\d+)\s*x/i)
  if (match) return parseInt(match[1], 10)

  return 2
}

// Deterministic topic rotation
function getRotatedTopic(topics: string[], index: number): string {
  if (topics.length === 0) return 'Conteúdo do pilar'
  return topics[index % topics.length]
}

function getRotatedFormat(formats: string[], index: number): string {
  if (formats.length === 0) return 'post'
  return formats[index % formats.length]
}

/**
 * Generates editorial suggestions for a given period.
 * Distributes content across pillars based on their percentage weight
 * and posting frequency.
 */
export function generateEditorialSuggestions(
  pillars: EditorialPillar[],
  periodDays: number = 30,
  existingIdeas: ContentIdea[] = []
): EditorialSuggestion[] {
  if (pillars.length === 0) return []

  const suggestions: EditorialSuggestion[] = []
  const today = new Date()

  // Normalize percentages to sum to 100
  const totalPct = pillars.reduce((sum, p) => sum + (p.percentage || 0), 0)
  const normalizedPillars = pillars.map((p) => ({
    ...p,
    normalizedPct: totalPct > 0 ? (p.percentage / totalPct) : (1 / pillars.length),
  }))

  for (const pillar of normalizedPillars) {
    // Calculate total items for this pillar in the period
    const weeklyFreq = parseFrequency(pillar.posting_frequency)
    const totalItemsFromFreq = Math.ceil((periodDays / 7) * weeklyFreq)

    // Also consider percentage-based distribution
    const totalItemsFromPct = Math.ceil(periodDays * pillar.normalizedPct * 0.5) // 0.5 = baseline density

    // Use the higher of the two calculations, capped at reasonable limits
    const totalItems = Math.min(
      Math.max(totalItemsFromFreq, totalItemsFromPct, 1),
      periodDays // Never exceed 1 per day
    )

    // Calculate interval between posts
    const interval = Math.max(1, Math.floor(periodDays / totalItems))

    const usedTopics = new Set(existingIdeas.filter(idea => idea.pillar_id === pillar.id).map(idea => idea.title.trim().toLowerCase()))
    for (let i = 0; i < totalItems; i++) {
      const dayOffset = i * interval
      if (dayOffset >= periodDays) break

      const suggestedDate = new Date(today)
      suggestedDate.setDate(suggestedDate.getDate() + dayOffset)

      // Check if there's already an idea for this slot
      const existingIdea = existingIdeas.find(
        (idea) =>
          idea.pillar_id === pillar.id &&
          idea.status !== 'discarded'
      )

      const format = getRotatedFormat(pillar.content_formats, i)
      const availableTopics = pillar.example_topics.filter(topic => !usedTopics.has(topic.trim().toLowerCase()))
      if (!availableTopics.length) continue
      const topic = getRotatedTopic(availableTopics, i)
      usedTopics.add(topic.trim().toLowerCase())

      suggestions.push({
        pillar_id: pillar.id,
        pillar_name: pillar.name,
        pillar_color: pillar.color,
        suggested_format: format,
        suggested_date: suggestedDate.toISOString().split('T')[0],
        example_topics: [topic, ...pillar.example_topics.filter((t) => t !== topic).slice(0, 2)],
      })
    }
  }

  // Sort by date
  suggestions.sort((a, b) => a.suggested_date.localeCompare(b.suggested_date))

  return suggestions
}

/**
 * Generates a pillar distribution summary.
 */
export function getPillarDistribution(pillars: EditorialPillar[]): {
  pillar: EditorialPillar
  weeklyPosts: number
  monthlyPosts: number
  percentage: number
}[] {
  const totalPct = pillars.reduce((sum, p) => sum + (p.percentage || 0), 0)

  return pillars.map((p) => {
    const weeklyPosts = parseFrequency(p.posting_frequency)
    return {
      pillar: p,
      weeklyPosts,
      monthlyPosts: Math.round(weeklyPosts * 4.3),
      percentage: totalPct > 0 ? Math.round((p.percentage / totalPct) * 100) : Math.round(100 / pillars.length),
    }
  })
}
