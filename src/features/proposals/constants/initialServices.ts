// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: CATALOG OF AGENCY SERVICES
// Initial default services for agency service catalog
// ============================================================

import type { AgencyService } from '@/types/proposals'

export const DEFAULT_AGENCY_SERVICES: AgencyService[] = [
  {
    id: 'service-social-media',
    agency_id: 'demo-agency',
    name: 'Gestão Completa de Redes Sociais',
    description: 'Planejamento editorial, redação, design de peças estáticas e carrosséis, agendamento e monitoramento mensal.',
    category: 'Social Media',
    pricing_model: 'monthly',
    base_price_cents: 350000, // R$ 3.500,00
    currency: 'BRL',
    estimated_duration: 'Recorrente Mensal',
    is_active: true,
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'service-branding-identity',
    agency_id: 'demo-agency',
    name: 'Criação de Identidade Visual e Branding',
    description: 'Manual de marca, logotipo, paleta de cores, tipografia, aplicações de marca e guia de voz.',
    category: 'Branding & Design',
    pricing_model: 'fixed',
    base_price_cents: 850000, // R$ 8.500,00
    currency: 'BRL',
    estimated_duration: '30 dias úteis',
    is_active: true,
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'service-motion-graphics',
    agency_id: 'demo-agency',
    name: 'Produção de Motion Graphics & Animação 2D',
    description: 'Animação de vinhetas, vídeos explicativos, reels animados e pacote de gráficos para mídias sociais.',
    category: 'Motion Design',
    pricing_model: 'unit',
    base_price_cents: 180000, // R$ 1.800,00
    currency: 'BRL',
    estimated_duration: '5 dias por vídeo',
    is_active: true,
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'service-video-production',
    agency_id: 'demo-agency',
    name: 'Produção Audiovisual & Captação no Local',
    description: 'Diária de gravação com câmera de alta resolução, iluminação profissional e áudio direcionado.',
    category: 'Audiovisual',
    pricing_model: 'unit',
    base_price_cents: 450000, // R$ 4.500,00
    currency: 'BRL',
    estimated_duration: '1 diária de 8h',
    is_active: true,
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'service-paid-traffic',
    agency_id: 'demo-agency',
    name: 'Gestão de Tráfego Pago & Ads (Meta & Google)',
    description: 'Setup de Pixel, criação de campanhas de alta conversão, otimização semanal e relatórios de ROI.',
    category: 'Performance',
    pricing_model: 'monthly',
    base_price_cents: 250000, // R$ 2.500,00
    currency: 'BRL',
    estimated_duration: 'Recorrente Mensal',
    is_active: true,
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'service-strategic-planning',
    agency_id: 'demo-agency',
    name: 'Consultoria & Planejamento Estratégico de Conteúdo',
    description: 'Diagnóstico de posicionamento, mapeamento de persona, benchmarking competitivo e plano de ação.',
    category: 'Estratégia',
    pricing_model: 'fixed',
    base_price_cents: 400000, // R$ 4.000,00
    currency: 'BRL',
    estimated_duration: '15 dias úteis',
    is_active: true,
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'service-copywriting',
    agency_id: 'demo-agency',
    name: 'Redação Publicitária & Copywriting de Vendas',
    description: 'Criação de textos persuassivos para landing pages, e-mails comerciais e roteiros de anúncios.',
    category: 'Redação',
    pricing_model: 'hourly',
    base_price_cents: 25000, // R$ 250,00 / hora
    currency: 'BRL',
    estimated_duration: 'Sob demanda',
    is_active: true,
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
]
