// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS — FASE 03
// CRM & Client Management Tests
// ============================================================

import { describe, it, expect } from 'vitest'

describe('CRM & Client Hub — Domain Logic', () => {
  it('generates a clean slug from client brand name', () => {
    const generateSlug = (name: string) =>
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    expect(generateSlug('Studio Vertex')).toBe('studio-vertex')
    expect(generateSlug('Aura Cosméticos & Perfumaria')).toBe('aura-cosmeticos-perfumaria')
    expect(generateSlug('Nexus Tech B2B')).toBe('nexus-tech-b2b')
  })

  it('filters clients correctly by status and search term', () => {
    const clients = [
      { id: '1', name: 'Studio Vertex', slug: 'studio-vertex', status: 'active' },
      { id: '2', name: 'Nexus Tech', slug: 'nexus-tech', status: 'active' },
      { id: '3', name: 'Lumina Finanças', slug: 'lumina-financas', status: 'inactive' },
    ]

    // Filter by active
    const active = clients.filter((c) => c.status === 'active')
    expect(active.length).toBe(2)

    // Filter by search
    const query = 'nexus'
    const searched = clients.filter((c) => c.name.toLowerCase().includes(query))
    expect(searched.length).toBe(1)
    expect(searched[0].slug).toBe('nexus-tech')
  })
})
