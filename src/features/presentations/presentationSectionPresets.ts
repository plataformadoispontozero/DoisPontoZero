import type { PresentationSectionType } from '@/types/presentations';
export const presentationSectionPresets = [
  { value: 'cover', label: 'Capa', type: 'cover', kind: '', layout: 'grid' },
  { value: 'overview', label: 'Visão geral', type: 'overview', kind: '', layout: 'grid' },
  { value: 'concept', label: 'Conceito', type: 'custom', kind: 'concept', layout: 'grid' },
  { value: 'positioning', label: 'Posicionamento', type: 'custom', kind: 'positioning', layout: 'grid' },
  { value: 'objectives', label: 'Objetivos do mês', type: 'objectives', kind: '', layout: 'grid' },
  { value: 'gallery', label: 'Post', type: 'gallery', kind: '', layout: 'grid' },
  { value: 'carousel', label: 'Carrossel', type: 'gallery', kind: '', layout: 'carousel' },
  { value: 'video', label: 'Reels', type: 'video', kind: '', layout: 'grid' },
  { value: 'closing', label: 'Conclusões', type: 'closing', kind: '', layout: 'grid' },
] as const;
export function presentationSectionPreset(value: string) { return presentationSectionPresets.find(preset => preset.value === value); }
export function presentationSectionValue(section: {section_type: PresentationSectionType; content?: Record<string, unknown>}) {
  if (section.section_type === 'gallery' && section.content?.media_layout === 'carousel') return 'carousel';
  if (section.section_type === 'custom' && ['concept', 'positioning'].includes(String(section.content?.section_kind))) return String(section.content?.section_kind);
  return section.section_type;
}
