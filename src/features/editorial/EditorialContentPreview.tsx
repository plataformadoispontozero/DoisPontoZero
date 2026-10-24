import { useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthlyItem } from './monthlyPlanner';

interface Panel { headline: string; text: string; seconds?: number; narration?: string }
function content(item: MonthlyItem) {
  const trace = item.editorial;
  const captionMatch = item.copy.match(/(?:^|\n)Legenda:\s*([\s\S]*)$/i);
  const caption = trace?.postConcept?.caption || trace?.caption || captionMatch?.[1] || '';
  const artwork = item.copy.split(/\nLegenda:/i)[0];
  let panels: Panel[] = [];
  if (item.format === 'carousel' && trace?.slides?.length) {
    panels = trace.slides.map(slide => ({ headline: slide.headline || '', text: slide.text }));
  } else if (item.format === 'reels' && trace?.scenes?.length) {
    panels = trace.scenes.map(scene => ({ headline: scene.onScreen || '', text: scene.text, seconds: scene.seconds, narration: scene.narration }));
  } else if (item.format !== 'post') {
    const pattern = item.format === 'carousel' ? /(?:^|\n)(?:Slide|Lâmina)\s+\d+\s*:\s*/i : /(?:^|\n)Cena\s+\d+(?:\s*\(\d+s\))?\s*:\s*/i;
    panels = artwork.split(pattern).filter(part => part.trim()).map(text => ({ headline: '', text: text.trim() }));
  }
  if (!panels.length) {
    const headline = trace?.postConcept?.headline || artwork.match(/(?:^|\n)Texto da arte:\s*([^\n]*)/i)?.[1] || item.title;
    const support = trace?.postConcept?.support || artwork.match(/(?:^|\n)Apoio:\s*([^\n]*)/i)?.[1] || (captionMatch ? '' : artwork);
    panels = [{ headline, text: support === headline ? '' : support }];
  }
  return { panels, caption, hashtags: trace?.hashtags };
}

export function EditorialContentPreview({ item, client }: { item: MonthlyItem; client: string }) {
  const { panels, caption, hashtags } = content(item);
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const viewportId = useId();
  function move(next: number) {
    const target = Math.min(panels.length - 1, Math.max(0, next));
    const element = viewport.current?.children[target] as HTMLElement | undefined;
    element?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest', inline: 'start' });
  }
  return <div className="min-w-0">
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-sm font-bold text-orange-300">{client.slice(0, 2).toUpperCase()}</span>
      <span className="min-w-0 truncate text-sm font-medium">{client}</span>
      <span className="ml-auto shrink-0 text-xs text-[#B8B8C0]">Prévia de conteúdo</span>
    </div>
    <div className={`mx-auto p-4 sm:p-6 ${item.format === 'reels' ? 'max-w-[340px]' : 'max-w-[460px]'}`}>
      <div ref={viewport} id={viewportId} tabIndex={panels.length > 1 ? 0 : undefined} role="region" aria-label={item.format === 'reels' ? 'Cenas do Reels' : item.format === 'carousel' ? 'Lâminas do carrossel' : 'Texto do post'}
        onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(active + (event.key === 'ArrowRight' ? 1 : -1)); } }}
        onScroll={() => { const node = viewport.current; if (node && node.clientWidth) setActive(Math.round(node.scrollLeft / node.clientWidth)); }}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-white/15 bg-[#19191f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 [scrollbar-width:thin]">
        {panels.map((panel, index) => <section key={index} aria-label={`${item.format === 'reels' ? 'Cena' : 'Lâmina'} ${index + 1} de ${panels.length}`} className={`relative flex w-full shrink-0 snap-start flex-col justify-center overflow-y-auto p-7 sm:p-9 ${item.format === 'reels' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}>
          <div className="mb-auto flex items-center justify-between gap-3 pt-1 text-xs font-medium uppercase tracking-widest text-orange-300">
            <span>{item.format === 'reels' ? `Cena ${index + 1}` : item.format === 'carousel' ? `Lâmina ${index + 1}` : 'Post'}</span>
            {panel.seconds !== undefined && <span>{panel.seconds}s</span>}
          </div>
          <div className="my-8 space-y-5 break-words">
            {panel.headline && <p className="text-2xl font-semibold leading-tight sm:text-3xl">{panel.headline}</p>}
            {panel.text && panel.text !== panel.headline && <p className="whitespace-pre-wrap text-base leading-relaxed text-[#e0e0e6] sm:text-lg">{panel.text}</p>}
            {panel.narration && panel.narration !== panel.text && <div className="border-t border-white/15 pt-4"><span className="text-xs text-orange-300">Narração</span><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#e0e0e6]">{panel.narration}</p></div>}
          </div>
          <p className="mt-auto border-t border-white/10 pt-4 text-xs text-[#B8B8C0]">{client}</p>
        </section>)}
      </div>
      {panels.length > 1 && <div className="mt-3 flex items-center justify-between gap-3">
        <button type="button" aria-label="Anterior" aria-controls={viewportId} disabled={active === 0} onClick={() => move(active - 1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><ChevronLeft size={20} /></button>
        <span aria-live="polite" className="text-sm text-[#B8B8C0]">{active + 1} / {panels.length}</span>
        <button type="button" aria-label="Próximo" aria-controls={viewportId} disabled={active >= panels.length - 1} onClick={() => move(active + 1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><ChevronRight size={20} /></button>
      </div>}
    </div>
    <div className="space-y-2 border-t border-white/10 px-5 py-5 sm:px-6">
      <h3 className="text-sm font-semibold">Legenda</h3>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#dedee5]">{caption || 'Legenda não informada neste material.'}</p>
      {hashtags && !caption.includes(hashtags) && <p className="whitespace-pre-wrap break-words text-sm text-orange-300">{hashtags}</p>}
    </div>
  </div>;
}
