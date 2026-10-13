import { useState } from 'react'
import { ArrowUpRight, FileText, Film, Folder, Image as ImageIcon } from 'lucide-react'
import { OfficialBrandLogo } from '@/components/shared/OfficialBrandLogo'
import type { Presentation } from '@/types/presentations'

export interface PreviewSection {
  id: string
  section_type: string
  title: string
  description?: string | null
  position: number
  content?: { text?: string; subtitle?: string; list?: unknown[] }
}
export interface PreviewAsset {
  id: string
  section_id?: string | null
  title: string
  description?: string | null
  position?: number
  web_view_link?: string | null
  thumbnail_reference?: string | null
  mime_type?: string | null
  file_reference?: {
    web_view_link?: string | null
    thumbnail_reference?: string | null
    mime_type?: string | null
  }
}
export type PreviewPresentation = Pick<Presentation, 'title' | 'description' | 'period_month' | 'period_year' | 'client_name' | 'client_logo_url' | 'published_at'> & { agency_name?: string }

function safeUrl(value?: string | null) {
  if (!value) return undefined
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : undefined } catch { return undefined }
}
const labels: Record<string, string> = {
  cover: 'Apresentação', overview: 'Visão geral', objectives: 'Direção & objetivos', deliverables: 'Entregas', gallery: 'Galeria', video: 'Vídeo & movimento', results: 'Resultados', insights: 'Aprendizados', next_steps: 'Próximos passos', closing: 'Encerramento', custom: 'Em destaque',
}

export function PresentationMedia({ asset }: { asset: PreviewAsset }) {
  const [failedImage, setFailedImage] = useState(false)
  const thumbnail = safeUrl(asset.thumbnail_reference || asset.file_reference?.thumbnail_reference)
  const link = safeUrl(asset.web_view_link || asset.file_reference?.web_view_link)
  const mime = asset.mime_type || asset.file_reference?.mime_type || ''
  const isVideo = mime.startsWith('video/')
  const isFolder = mime === 'application/vnd.google-apps.folder'
  const Icon = isVideo ? Film : isFolder ? Folder : mime.startsWith('image/') ? ImageIcon : FileText
  const mediaLabel = isVideo ? 'Vídeo' : isFolder ? 'Pasta' : mime.startsWith('image/') ? 'Imagem' : 'Material'
  return <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#171719]">
    <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-[#101012] sm:min-h-80">
      {thumbnail && !failedImage ? <img src={thumbnail} alt={asset.title} loading="lazy" onError={() => setFailedImage(true)} className="max-h-[72vh] w-full object-contain" /> : <div className="flex flex-col items-center gap-4 px-8 py-16 text-center"><Icon aria-hidden="true" className="h-12 w-12 text-orange-400" /><p className="text-sm text-zinc-400">{isVideo ? 'Abra o vídeo original para assistir.' : isFolder ? 'Explore os materiais desta pasta.' : 'Prévia de imagem não disponível.'}</p></div>}
      <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/80 px-3 py-1 text-xs text-white">{mediaLabel}</span>
    </div>
    <div className="space-y-3 p-5 sm:p-6"><h3 className="break-words text-lg font-semibold text-white">{asset.title}</h3>{asset.description && <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{asset.description}</p>}{link ? <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400">{isFolder ? 'Abrir pasta no Drive' : 'Abrir material no Drive'}<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a> : <p className="text-xs text-zinc-400">Link do material indisponível.</p>}</div>
  </article>
}

export function PresentationPreview({ presentation, sections, assets }: { presentation: PreviewPresentation; sections: PreviewSection[]; assets: PreviewAsset[] }) {
  const orderedSections = [...sections].sort((a, b) => a.position - b.position)
  const orderedAssets = [...assets].sort((a, b) => (a.position || 0) - (b.position || 0))
  const logo = safeUrl(presentation.client_logo_url)
  const month = presentation.period_month >= 1 && presentation.period_month <= 12 ? new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, presentation.period_month - 1, 1))) : 'Período'
  const unassignedAssets = orderedAssets.filter(asset => !orderedSections.some(section => section.id === asset.section_id))
  return <div className="overflow-hidden rounded-2xl bg-[#101012] text-white selection:bg-orange-600">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-10"><div className="w-36"><OfficialBrandLogo src="/agency/official-logo.webp" name="Dois.Zero" /></div><span className="text-xs uppercase tracking-[0.16em] text-zinc-400">{presentation.agency_name || 'Apresentação criativa'}</span></header>
    <main className="mx-auto max-w-6xl px-6 sm:px-10">
      <div className="relative border-b border-white/10 py-16 sm:py-24"><div aria-hidden="true" className="pointer-events-none absolute -right-16 top-8 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl" /><div className="relative max-w-4xl space-y-6">{logo && <img src={logo} alt={`Logo de ${presentation.client_name || 'cliente'}`} className="max-h-20 max-w-52 rounded-lg object-contain" />}<p className="text-sm font-medium uppercase tracking-[0.16em] text-orange-400">{presentation.client_name || 'Apresentação do projeto'} · {month} / {presentation.period_year}</p><h1 className="break-words text-3xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{presentation.title}</h1>{presentation.description && <p className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-zinc-300 sm:text-lg">{presentation.description}</p>}<div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 text-sm text-zinc-400"><span>{orderedSections.length} {orderedSections.length === 1 ? 'seção' : 'seções'}</span><span>{assets.length} {assets.length === 1 ? 'material' : 'materiais'}</span></div></div></div>
      {orderedSections.length === 0 && <p className="py-16 text-zinc-400">Esta apresentação ainda não possui seções.</p>}
      {orderedSections.map((section, index) => { const media = orderedAssets.filter(asset => asset.section_id === section.id); return <section key={section.id} className="border-b border-white/10 py-12 sm:py-16"><div className="mb-8 flex gap-4 sm:gap-7"><span className="pt-1 text-sm font-medium text-orange-400">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 space-y-4"><p className="text-xs uppercase tracking-[0.16em] text-zinc-400">{labels[section.section_type] || 'Seção'}</p><h2 className="break-words text-2xl font-semibold tracking-tight sm:text-4xl">{section.title}</h2>{section.content?.subtitle && <p className="text-xl text-orange-300">{section.content.subtitle}</p>}{section.description && <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-zinc-300">{section.description}</p>}{section.content?.text && <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-zinc-300">{section.content.text}</p>}{Array.isArray(section.content?.list) && <ul className="grid gap-3 sm:grid-cols-2">{section.content.list.filter((item): item is string => typeof item === 'string').map((item, i) => <li key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-zinc-200">{item}</li>)}</ul>}</div></div>{media.length > 0 && <div className={`grid gap-6 ${media.length > 1 ? 'md:grid-cols-2' : ''}`}>{media.map(asset => <PresentationMedia key={asset.id} asset={asset} />)}</div>}</section> })}
      {unassignedAssets.length > 0 && <section className="space-y-8 border-b border-white/10 py-12"><h2 className="text-2xl font-semibold">Materiais complementares</h2><div className="grid gap-6 md:grid-cols-2">{unassignedAssets.map(asset => <PresentationMedia key={asset.id} asset={asset} />)}</div></section>}
      <footer className="flex flex-wrap items-center justify-between gap-5 py-10 text-sm text-zinc-400"><span>{presentation.client_name || presentation.title}</span><span>Dois.Zero · Estratégia e criação</span></footer>
    </main>
  </div>
}
