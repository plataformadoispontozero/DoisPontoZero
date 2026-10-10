// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: BRIEFING STUDIO
// 5 Official Initial Templates (Branding, Social Media, Motion, Audiovisual, Campanha)
// ============================================================

import type { BriefingTemplate, BriefingSection, BriefingQuestion } from '@/types/briefing'

export interface InitialTemplateDefinition {
  id: string
  name: string
  description: string
  category: BriefingTemplate['category']
  sections: {
    id: string
    title: string
    description?: string
    questions: {
      id: string
      question_key: string
      label: string
      description?: string
      question_type: BriefingQuestion['question_type']
      is_required: boolean
      options?: { id: string; label: string; value: string }[]
      placeholder?: string
    }[]
  }[]
}

export const INITIAL_BRIEFING_TEMPLATES: InitialTemplateDefinition[] = [
  // ------------------------------------------------------------
  // TEMPLATE 01: BRANDING & IDENTIDADE VISUAL
  // ------------------------------------------------------------
  {
    id: 'tpl-branding-v1',
    name: 'Branding & Identidade Visual',
    description: 'Manual de marca completo, posicionamento, tom e universo visual para novas marcas ou redesign.',
    category: 'branding',
    sections: [
      {
        id: 'sec-br-1',
        title: 'Sobre a Empresa',
        description: 'Contexto institucional e história da empresa.',
        questions: [
          {
            id: 'q-br-1-1',
            question_key: 'company_story',
            label: 'História e Origem da Empresa',
            description: 'Como surgiu a empresa, qual o propósito central e principais marcos?',
            question_type: 'long_text',
            is_required: true,
            placeholder: 'Descreva a fundação, motivação e trajetória...',
          },
          {
            id: 'q-br-1-2',
            question_key: 'mission_vision_values',
            label: 'Missão, Visão e Valores',
            question_type: 'long_text',
            is_required: true,
            placeholder: 'Princípios inegociáveis que regem a organização...',
          },
        ],
      },
      {
        id: 'sec-br-2',
        title: 'Posicionamento de Mercado',
        description: 'Diferencial competitivo e proposta de valor.',
        questions: [
          {
            id: 'q-br-2-1',
            question_key: 'value_proposition',
            label: 'Qual a principal proposta de valor única?',
            question_type: 'long_text',
            is_required: true,
            placeholder: 'O que a marca entrega que nenhum concorrente entrega igual?',
          },
          {
            id: 'q-br-2-2',
            question_key: 'brand_archetype',
            label: 'Arquétipo Predominante',
            question_type: 'single_choice',
            is_required: false,
            options: [
              { id: '1', label: 'O Criador (Inovação, imaginação)', value: 'criador' },
              { id: '2', label: 'O Sábio (Conhecimento, verdade)', value: 'sabio' },
              { id: '3', label: 'O Herói (Superação, determinação)', value: 'heroi' },
              { id: '4', label: 'O Explorador (Liberdade, descoberta)', value: 'explorador' },
              { id: '5', label: 'O Mago (Transformação, visão)', value: 'mago' },
              { id: '6', label: 'O Soberano (Liderança, prestígio)', value: 'soberano' },
            ],
          },
        ],
      },
      {
        id: 'sec-br-3',
        title: 'Público-Alvo & Persona',
        questions: [
          {
            id: 'q-br-3-1',
            question_key: 'target_audience_profile',
            label: 'Perfil Demográfico e Comportamental',
            description: 'Faixa etária, hábitos, aspirações e dores do cliente ideal.',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-br-4',
        title: 'Personalidade da Marca',
        questions: [
          {
            id: 'q-br-4-1',
            question_key: 'brand_attributes',
            label: 'Atributos de Personalidade (3 a 5 palavras-chave)',
            description: 'Ex: Sofisticada, acolhedora, disruptiva, tecnológica.',
            question_type: 'short_text',
            is_required: true,
          },
          {
            id: 'q-br-4-2',
            question_key: 'tone_of_voice',
            label: 'Tom de Voz Desejado',
            question_type: 'single_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Formal e Institucional', value: 'formal' },
              { id: '2', label: 'Próximo, Descontraído e Amigável', value: 'amigavel' },
              { id: '3', label: 'Técnico e Especialista', value: 'tecnico' },
              { id: '4', label: 'Provocativo e Ousado', value: 'ousado' },
            ],
          },
        ],
      },
      {
        id: 'sec-br-5',
        title: 'Referências Visuais',
        questions: [
          {
            id: 'q-br-5-1',
            question_key: 'visual_references_links',
            label: 'Links de Referência (Pinterest, Behance, Moodboard)',
            question_type: 'url',
            is_required: false,
          },
          {
            id: 'q-br-5-2',
            question_key: 'visual_likes_dislikes',
            label: 'O que agrada e o que NÃO agrada visualmente?',
            question_type: 'long_text',
            is_required: false,
          },
        ],
      },
      {
        id: 'sec-br-6',
        title: 'Concorrentes',
        questions: [
          {
            id: 'q-br-6-1',
            question_key: 'main_competitors',
            label: 'Principais Concorrentes Diretos e Indiretos',
            description: 'Cite marcas de referência no mesmo nicho ou modelos análogos.',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-br-7',
        title: 'Objetivos do Projeto',
        questions: [
          {
            id: 'q-br-7-1',
            question_key: 'branding_main_goal',
            label: 'Qual o principal sucesso esperado com a nova marca?',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-br-8',
        title: 'Entregáveis',
        questions: [
          {
            id: 'q-br-8-1',
            question_key: 'deliverables_list',
            label: 'Entregáveis Solicitados',
            question_type: 'multiple_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Logo Principal + Variações', value: 'logo' },
              { id: '2', label: 'Manual de Identidade Visual', value: 'manual' },
              { id: '3', label: 'Paleta Cromática & Tipografia', value: 'colors_typo' },
              { id: '4', label: 'Papelaria Institucional (Cartão, Envelope, Papel Timbrado)', value: 'papelaria' },
              { id: '5', label: 'Templates para Redes Sociais', value: 'social_templates' },
              { id: '6', label: 'Brand Guidelines de Aplicação Digital', value: 'brand_guidelines' },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------
  // TEMPLATE 02: SOCIAL MEDIA
  // ------------------------------------------------------------
  {
    id: 'tpl-social-v1',
    name: 'Social Media & Gestão de Conteúdo',
    description: 'Estratégia de conteúdo mensal, tom de voz, formatos e calendário editorial.',
    category: 'social_media',
    sections: [
      {
        id: 'sec-sm-1',
        title: 'Informações da Marca',
        questions: [
          {
            id: 'q-sm-1-1',
            question_key: 'brand_summary',
            label: 'Resumo da Marca para Redes Sociais',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-sm-2',
        title: 'Objetivos nas Redes Sociais',
        questions: [
          {
            id: 'q-sm-2-1',
            question_key: 'social_goals',
            label: 'Principais Metas Digitais',
            question_type: 'multiple_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Reconhecimento de Marca (Branding)', value: 'awareness' },
              { id: '2', label: 'Engajamento e Comunidade', value: 'engagement' },
              { id: '3', label: 'Geração de Leads Qualificados', value: 'leads' },
              { id: '4', label: 'Conversão Direta e Vendas', value: 'sales' },
              { id: '5', label: 'Autoridade e Liderança de Opinião', value: 'authority' },
            ],
          },
        ],
      },
      {
        id: 'sec-sm-3',
        title: 'Público-Alvo',
        questions: [
          {
            id: 'q-sm-3-1',
            question_key: 'social_audience',
            label: 'Com quem estamos falando nas redes?',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-sm-4',
        title: 'Tom de Voz',
        questions: [
          {
            id: 'q-sm-4-1',
            question_key: 'voice_characteristics',
            label: 'Como a marca se comunica nas legendas e comentários?',
            question_type: 'short_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-sm-5',
        title: 'Produtos e Serviços',
        questions: [
          {
            id: 'q-sm-5-1',
            question_key: 'featured_products',
            label: 'Produtos ou serviços prioritários a divulgar',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-sm-6',
        title: 'Concorrentes',
        questions: [
          {
            id: 'q-sm-6-1',
            question_key: 'social_competitors',
            label: 'Perfis concorrentes ou referências de mercado (@handles)',
            question_type: 'short_text',
            is_required: false,
          },
        ],
      },
      {
        id: 'sec-sm-7',
        title: 'Referências de Conteúdo',
        questions: [
          {
            id: 'q-sm-7-1',
            question_key: 'content_benchmarks',
            label: 'Perfis que a marca admira em formato ou estética',
            question_type: 'long_text',
            is_required: false,
          },
        ],
      },
      {
        id: 'sec-sm-8',
        title: 'Restrições de Comunicação',
        questions: [
          {
            id: 'q-sm-8-1',
            question_key: 'taboos_and_restrictions',
            label: 'Termos, temas ou abordagens proibidas na comunicação',
            question_type: 'long_text',
            is_required: false,
          },
        ],
      },
      {
        id: 'sec-sm-9',
        title: 'Frequência de Publicações',
        questions: [
          {
            id: 'q-sm-9-1',
            question_key: 'monthly_post_volume',
            label: 'Volume esperado de posts mensais',
            question_type: 'number',
            is_required: true,
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------
  // TEMPLATE 03: MOTION DESIGN
  // ------------------------------------------------------------
  {
    id: 'tpl-motion-v1',
    name: 'Motion Design & Animação',
    description: 'Animações gráficas 2D/3D, vinhetas, reels animados e assets em movimento.',
    category: 'motion',
    sections: [
      {
        id: 'sec-mo-1',
        title: 'Objetivo da Animação',
        questions: [
          {
            id: 'q-mo-1-1',
            question_key: 'motion_purpose',
            label: 'Finalidade principal da peça animada',
            question_type: 'short_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-mo-2',
        title: 'Formato',
        questions: [
          {
            id: 'q-mo-2-1',
            question_key: 'aspect_ratio',
            label: 'Aspect Ratio / Formato de Exibição',
            question_type: 'multiple_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Vertical 9:16 (Stories, Reels, TikTok)', value: 'vertical_9_16' },
              { id: '2', label: 'Horizontal 16:9 (YouTube, TV, Site)', value: 'horizontal_16_9' },
              { id: '3', label: 'Quadrado 1:1 (Feed Instagram, LinkedIn)', value: 'square_1_1' },
              { id: '4', label: 'Widescreen 21:9 (Eventos, Painéis LED)', value: 'wide_21_9' },
            ],
          },
        ],
      },
      {
        id: 'sec-mo-3',
        title: 'Duração',
        questions: [
          {
            id: 'q-mo-3-1',
            question_key: 'duration_seconds',
            label: 'Duração estimada em segundos',
            question_type: 'number',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-mo-4',
        title: 'Roteiro & Mensagem',
        questions: [
          {
            id: 'q-mo-4-1',
            question_key: 'motion_script',
            label: 'Roteiro ou ideias de cenas estruturadas',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-mo-5',
        title: 'Referências Visuais',
        questions: [
          {
            id: 'q-mo-5-1',
            question_key: 'motion_benchmarks',
            label: 'Links de vídeos ou animações com ritmo desejado',
            question_type: 'url',
            is_required: false,
          },
        ],
      },
      {
        id: 'sec-mo-6',
        title: 'Identidade Visual & Assets',
        questions: [
          {
            id: 'q-mo-6-1',
            question_key: 'brand_assets_ready',
            label: 'Logotipo vetorial e guia de cores disponíveis?',
            question_type: 'single_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Sim, assets completos em vetor (.AI, .SVG)', value: 'yes' },
              { id: '2', label: 'Parcialmente, precisaremos criar/adaptar', value: 'partial' },
              { id: '3', label: 'Não, criar do zero', value: 'no' },
            ],
          },
        ],
      },
      {
        id: 'sec-mo-7',
        title: 'Trilha e Locução',
        questions: [
          {
            id: 'q-mo-7-1',
            question_key: 'audio_requirements',
            label: 'Necessidade de áudio',
            question_type: 'multiple_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Trilha Sonora Licenciada', value: 'soundtrack' },
              { id: '2', label: 'Efeitos Sonoros (SFX / Foley)', value: 'sfx' },
              { id: '3', label: 'Locução Profissional em Estúdio', value: 'voiceover' },
              { id: '4', label: 'Apenas Legendas Sincronizadas', value: 'subtitles' },
            ],
          },
        ],
      },
      {
        id: 'sec-mo-8',
        title: 'Formatos de Entrega',
        questions: [
          {
            id: 'q-mo-8-1',
            question_key: 'export_codecs',
            label: 'Codecs e entregáveis',
            question_type: 'multiple_choice',
            is_required: true,
            options: [
              { id: '1', label: 'MP4 (H.264 / H.265 Otimizado Web)', value: 'mp4' },
              { id: '2', label: 'ProRes 422 / 4444 (Master Alta Resolução)', value: 'prores' },
              { id: '3', label: 'Alpha Transparente (MOV ProRes 4444 ou WebM)', value: 'alpha' },
              { id: '4', label: 'Lottie JSON para Web / App', value: 'lottie' },
            ],
          },
        ],
      },
      {
        id: 'sec-mo-9',
        title: 'Prazos',
        questions: [
          {
            id: 'q-mo-9-1',
            question_key: 'delivery_deadline',
            label: 'Data final de entrega desejada',
            question_type: 'date',
            is_required: true,
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------
  // TEMPLATE 04: AUDIOVISUAL
  // ------------------------------------------------------------
  {
    id: 'tpl-audio-v1',
    name: 'Produção Audiovisual & Vídeo',
    description: 'Planejamento de diárias, captação, direção, elenco, locações e edição de filmes.',
    category: 'audiovisual',
    sections: [
      {
        id: 'sec-av-1',
        title: 'Objetivo da Produção',
        questions: [
          {
            id: 'q-av-1-1',
            question_key: 'video_goal',
            label: 'Propósito do filme publicitário ou corporativo',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-av-2',
        title: 'Tipo de Vídeo',
        questions: [
          {
            id: 'q-av-2-1',
            question_key: 'production_type',
            label: 'Gênero da Produção',
            question_type: 'single_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Comercial Publicitário (TV / Web)', value: 'comercial' },
              { id: '2', label: 'Institucional / Manifesto de Marca', value: 'manifesto' },
              { id: '3', label: 'Estudo de Caso / Depoimentos (Case)', value: 'case' },
              { id: '4', label: 'Cobertura de Evento Especial', value: 'evento' },
              { id: '5', label: 'Vídeo Treinamento / Educacional', value: 'educacional' },
            ],
          },
        ],
      },
      {
        id: 'sec-av-3',
        title: 'Local & Cenário',
        questions: [
          {
            id: 'q-av-3-1',
            question_key: 'shoot_location',
            label: 'Locação da Filmagem',
            description: 'Sede do cliente, externa, estúdio com fundo infinito, etc.',
            question_type: 'short_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-av-4',
        title: 'Participantes & Elenco',
        questions: [
          {
            id: 'q-av-4-1',
            question_key: 'talent_cast',
            label: 'Quem estará em cena?',
            description: 'Colaboradores internos, atores contratados, influenciadores...',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-av-5',
        title: 'Roteiro & Mensagem Principal',
        questions: [
          {
            id: 'q-av-5-1',
            question_key: 'av_script_notes',
            label: 'Pontos-chave do discurso ou roteiro base',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-av-6',
        title: 'Equipamentos Necessários',
        questions: [
          {
            id: 'q-av-6-1',
            question_key: 'gear_requirements',
            label: 'Necessidades técnicas específicas',
            question_type: 'multiple_choice',
            is_required: false,
            options: [
              { id: '1', label: 'Câmera Cinema 4K/6K', value: 'cinema_cam' },
              { id: '2', label: 'Drone / Captação Aérea Homologada', value: 'drone' },
              { id: '3', label: 'Iluminação de Estúdio / HMI', value: 'lighting' },
              { id: '4', label: 'Captação de Áudio Direto com Lapela/Boom', value: 'boom' },
              { id: '5', label: 'Teleprompter Profissional', value: 'teleprompter' },
            ],
          },
        ],
      },
      {
        id: 'sec-av-7',
        title: 'Referências de Estilo',
        questions: [
          {
            id: 'q-av-7-1',
            question_key: 'av_benchmarks',
            label: 'Vídeos de referência (Links do YouTube/Vimeo)',
            question_type: 'url',
            is_required: false,
          },
        ],
      },
      {
        id: 'sec-av-8',
        title: 'Datas & Diárias',
        questions: [
          {
            id: 'q-av-8-1',
            question_key: 'shoot_dates',
            label: 'Data prevista para a gravação',
            question_type: 'date',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-av-9',
        title: 'Entregáveis & Cortes',
        questions: [
          {
            id: 'q-av-9-1',
            question_key: 'av_deliverables',
            label: 'Versões e cortes solicitados',
            question_type: 'multiple_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Filme Principal Completo', value: 'main_cut' },
              { id: '2', label: 'Teaser de 15s / 30s para Reels', value: 'teaser_reels' },
              { id: '3', label: 'Pílulas Curtas para Histórias', value: 'stories_cuts' },
              { id: '4', label: 'Backup de Material Bruto (RAW Footage)', value: 'raw_backup' },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------
  // TEMPLATE 05: CAMPANHA INTEGRADA
  // ------------------------------------------------------------
  {
    id: 'tpl-campaign-v1',
    name: 'Campanha Publicitária Integrada',
    description: 'Campanhas 360°, lançamento de produtos, ações comemorativas e brand awareness.',
    category: 'campaign',
    sections: [
      {
        id: 'sec-cp-1',
        title: 'Objetivo da Campanha',
        questions: [
          {
            id: 'q-cp-1-1',
            question_key: 'campaign_objective',
            label: 'Objetivo Estratégico da Campanha',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-cp-2',
        title: 'Público da Ação',
        questions: [
          {
            id: 'q-cp-2-1',
            question_key: 'campaign_audience',
            label: 'Segmentação e Perfil do Público',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-cp-3',
        title: 'Mensagem Principal & Big Idea',
        questions: [
          {
            id: 'q-cp-3-1',
            question_key: 'core_message',
            label: 'Qual o conceito central / mensagem que deve ficar na mente do público?',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-cp-4',
        title: 'Canais de Veiculação',
        questions: [
          {
            id: 'q-cp-4-1',
            question_key: 'campaign_channels',
            label: 'Canais Planejados',
            question_type: 'multiple_choice',
            is_required: true,
            options: [
              { id: '1', label: 'Redes Sociais Orgânicas (Instagram, TikTok, LinkedIn)', value: 'social_organic' },
              { id: '2', label: 'Mídia Paga Digital (Meta Ads, Google Ads, TikTok Ads)', value: 'paid_digital' },
              { id: '3', label: 'OOH (Out of Home, Outdoors, Telas Digitais)', value: 'ooh' },
              { id: '4', label: 'E-mail Marketing & CRM', value: 'email' },
              { id: '5', label: 'Imprensa & Relações Públicas (PR)', value: 'pr' },
              { id: '6', label: 'Pontos de Venda (PDV)', value: 'pdv' },
            ],
          },
        ],
      },
      {
        id: 'sec-cp-5',
        title: 'Orçamento Estimado',
        questions: [
          {
            id: 'q-cp-5-1',
            question_key: 'estimated_budget',
            label: 'Orçamento total disponível para a campanha (R$)',
            question_type: 'short_text',
            is_required: false,
          },
        ],
      },
      {
        id: 'sec-cp-6',
        title: 'Cronograma & Lançamento',
        questions: [
          {
            id: 'q-cp-6-1',
            question_key: 'launch_date',
            label: 'Data de Lançamento / Go-Live',
            question_type: 'date',
            is_required: true,
          },
        ],
      },
      {
        id: 'sec-cp-7',
        title: 'Referências e Benchmarks',
        questions: [
          {
            id: 'q-cp-7-1',
            question_key: 'campaign_references',
            label: 'Campanhas memoráveis de referência',
            question_type: 'long_text',
            is_required: false,
          },
        ],
      },
      {
        id: 'sec-cp-8',
        title: 'Indicadores de Sucesso (KPIs)',
        questions: [
          {
            id: 'q-cp-8-1',
            question_key: 'campaign_kpis',
            label: 'Quais métricas definirão o sucesso da campanha?',
            question_type: 'long_text',
            is_required: true,
          },
        ],
      },
    ],
  },
]
