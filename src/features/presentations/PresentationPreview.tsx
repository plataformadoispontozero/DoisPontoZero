import {usePresentationImage} from './presentationMedia'
import { useState, useRef } from 'react'
import { Check, ChevronLeft, ChevronRight, X, Maximize2, FileText, Film, Folder, Image as ImageIcon } from 'lucide-react'
import { OfficialBrandLogo } from '@/components/shared/OfficialBrandLogo'
import {Dialog,DialogHeader,DialogTitle,DialogContent} from '@/components/ui/Dialog'
import type { Presentation } from '@/types/presentations'

export interface PreviewSection {
  id: string
  section_type: string
  title: string
  description?: string | null
  position: number
  content?: { text?: string; subtitle?: string; list?: unknown[]; images?: {src:string;alt:string}[] }
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

export type MaterialDecision='approved'|'changes_requested'|'rejected'
export interface MaterialReview {decision:string;note?:string}
export interface ReviewProps {publicToken?:string;onReview?:(assetId:string,decision:MaterialDecision,note:string)=>Promise<void>;reviews?:Record<string,MaterialReview>}
export function highQualityThumbnail(value?:string|null,size=1600){
 const safe=safeUrl(value);if(!safe)return undefined
 const url=new URL(safe)
 if(url.hostname==='googleusercontent.com'||url.hostname.endsWith('.googleusercontent.com'))return safe.replace(/=s\d+(?:-[a-z0-9-]+)?$/i,`=s${size}`).replace(/=w\d+(?:-h\d+)?(?:-[a-z0-9-]+)?$/i,`=s${size}`)
 return safe
}
export function PresentationMedia({asset,onReview,review,publicToken}:{asset:PreviewAsset;publicToken?:string;onReview?:ReviewProps['onReview'];review?:MaterialReview}){
 const [failedImage,setFailedImage]=useState(false),[fallback,setFallback]=useState(false),[expanded,setExpanded]=useState(false)
 const [decision,setDecision]=useState<MaterialDecision|null>(null),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState<MaterialDecision|null>(null)
 const image=usePresentationImage(asset,publicToken)
 const original=image.managed?image.url:safeUrl(asset.thumbnail_reference||asset.file_reference?.thumbnail_reference),thumbnail=image.managed?original:fallback?original:highQualityThumbnail(original)
 const mime=asset.mime_type||asset.file_reference?.mime_type||'',isVideo=mime.startsWith('video/'),isFolder=mime==='application/vnd.google-apps.folder'
 const Icon=isVideo?Film:isFolder?Folder:mime.startsWith('image/')?ImageIcon:FileText
 const label=isVideo?'Vídeo':isFolder?'Pasta':mime.startsWith('image/')?'Imagem':'Material'
 async function submit(value:MaterialDecision){if(!onReview)return;setBusy(true);setError('');try{await onReview(asset.id,value,note.trim());setSaved(value);setDecision(null);setNote('')}catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar a decisão. Tente novamente.')}finally{setBusy(false)}}
 const status=saved||review?.decision,statusLabels:Record<string,string>={approved:'Aprovado',changes_requested:'Ajuste solicitado',rejected:'Reprovado'}
 return <article className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#171719]">
 <div className="relative flex min-h-48 items-center justify-center bg-[#101012]">
 {thumbnail&&!failedImage?<button type="button" aria-label={`Ampliar ${asset.title}`} className="block w-full cursor-zoom-in" onClick={()=>setExpanded(true)}><img src={thumbnail} alt={asset.title} loading="lazy" decoding="async" onError={()=>{if(!fallback&&thumbnail!==original)setFallback(true);else setFailedImage(true)}} className="max-h-[65svh] w-full object-contain"/><span className="absolute bottom-3 right-3 rounded-lg bg-black/70 p-2"><Maximize2 className="h-4 w-4"/></span></button>:<div className="flex flex-col items-center gap-4 px-6 py-16 text-center"><Icon className="h-10 w-10 text-orange-400"/><p className="text-sm text-zinc-400">Prévia do material indisponível.</p></div>}
 <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs text-white">{label}</span></div>
 <div className="space-y-4 p-4 @2xl:p-6"><h3 className="break-words text-base font-semibold text-white">{asset.title}</h3>{asset.description&&<p className="whitespace-pre-wrap text-sm text-zinc-300">{asset.description}</p>}{status&&<p role="status" className="text-sm font-medium text-orange-300">{statusLabels[status]||status}</p>}{review?.note&&<p className="whitespace-pre-wrap text-sm text-zinc-300">{review.note}</p>}
 <div className="flex flex-wrap gap-2">{([{key:'approved',name:'Aprovar',Icon:Check,color:'bg-emerald-600 hover:bg-emerald-500'},{key:'rejected',name:'Reprovar',Icon:X,color:'bg-rose-600 hover:bg-rose-500'}] as const).map(action=><button type="button" key={action.key} disabled={!onReview||busy} onClick={()=>{setError('');if(action.key==='approved')void submit(action.key);else {setDecision(action.key);setNote('')}}} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${action.color}`}><action.Icon className="h-4 w-4"/>{action.name}</button>)}</div>{!onReview&&<p className="text-xs text-zinc-400">As decisões são registradas no link de aprovação enviado ao cliente.</p>}{error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}</div>
 <Dialog open={expanded} onOpenChange={setExpanded} className="max-w-5xl"><DialogHeader onClose={()=>setExpanded(false)}><DialogTitle>{asset.title}</DialogTitle></DialogHeader><DialogContent><img src={image.managed?original:highQualityThumbnail(original,2400)} alt={`Visualização ampliada de ${asset.title}`} onError={e=>{if(e.currentTarget.src!==original&&original)e.currentTarget.src=original}} className="max-h-[75vh] w-full object-contain"/></DialogContent></Dialog>
 <Dialog open={!!decision} onOpenChange={open=>{if(!open&&!busy)setDecision(null)}}><DialogHeader onClose={()=>{if(!busy)setDecision(null)}}><DialogTitle>{'Reprovar material'}</DialogTitle></DialogHeader><DialogContent><label className="block space-y-2 text-sm">Por que o material foi reprovado?<textarea autoFocus maxLength={3000} value={note} onChange={e=>setNote(e.target.value)} className="block min-h-32 w-full rounded-lg border border-white/15 bg-black/20 p-3"/></label>{error&&<p role="alert" className="mt-3 text-rose-300">{error}</p>}<button disabled={busy||!note.trim()} onClick={()=>decision&&void submit(decision)} className="mt-4 rounded-lg bg-orange-600 px-4 py-3 text-white disabled:opacity-50">{busy?'Salvando…':'Enviar retorno'}</button></DialogContent></Dialog>
 </article>
}

function sectionImages(section: PreviewSection) {
 return Array.isArray(section.content?.images) ? section.content.images.slice(0,20).filter(image => image && typeof image.src === 'string' && safeUrl(image.src)) : [];
}


export function PresentationGallery({assets,publicToken,onReview,reviews}:{assets:PreviewAsset[]}&ReviewProps){
 const [index,setIndex]=useState(0),gesture=useRef<{x:number;y:number;id:number}|null>(null),swiped=useRef(false)
 const current=Math.min(index,Math.max(0,assets.length-1)),asset=assets[current]
 if(!asset)return null
 const move=(delta:number)=>setIndex(i=>(Math.min(i,assets.length-1)+delta+assets.length)%assets.length)
 const button='flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400'
 return <div role="region" aria-label="Galeria de materiais" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1)}}} className="min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
  {assets.length>1&&<div className="mb-3 flex items-center justify-between gap-3"><button type="button" aria-label="Imagem anterior" className={button} onClick={()=>move(-1)}><ChevronLeft aria-hidden="true" className="h-5 w-5"/></button><p role="status" className="text-sm text-zinc-300">{current+1} de {assets.length}</p><button type="button" aria-label="Próxima imagem" className={button} onClick={()=>move(1)}><ChevronRight aria-hidden="true" className="h-5 w-5"/></button></div>}
  <div style={{touchAction:'pan-y'}} onPointerDown={e=>{if(e.isPrimary&&e.button===0&&(e.target as Element).closest('img')){swiped.current=false;gesture.current={x:e.clientX,y:e.clientY,id:e.pointerId}}}} onPointerCancel={()=>{gesture.current=null}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(!start||start.id!==e.pointerId)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.abs(x)>60&&Math.abs(x)>Math.abs(y)*1.5){swiped.current=true;move(x<0?1:-1)}}} onClickCapture={e=>{if(swiped.current){e.preventDefault();e.stopPropagation();swiped.current=false}}} onDragStart={e=>e.preventDefault()}><PresentationMedia key={asset.id} asset={asset} publicToken={publicToken} onReview={onReview} review={reviews?.[asset.id]}/></div>
  {assets.length>1&&<p className="mt-2 text-center text-xs text-zinc-400">Use as setas ou arraste a imagem para os lados. Pelo teclado, foque a galeria e use as setas.</p>}
 </div>
}
export function PresentationPreview({ presentation, sections, assets,onReview,reviews,publicToken }: { presentation: PreviewPresentation; sections: PreviewSection[]; assets: PreviewAsset[] } & ReviewProps) {
  const materialCount = assets.length + sections.reduce((n,s)=>n+sectionImages(s).length,0)
  const orderedSections = [...sections].sort((a, b) => a.position - b.position)
  const orderedAssets = [...assets].sort((a, b) => (a.position || 0) - (b.position || 0))
  const logo = safeUrl(presentation.client_logo_url)
  const month = presentation.period_month >= 1 && presentation.period_month <= 12 ? new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, presentation.period_month - 1, 1))) : 'Período'
  const unassignedAssets = orderedAssets.filter(asset => !orderedSections.some(section => section.id === asset.section_id))
  return <div data-testid="presentation-preview" className="@container overflow-hidden rounded-2xl bg-[#101012] text-white selection:bg-orange-600">
    <header className="flex flex-col items-start justify-between @2xl:flex-row @2xl:items-center gap-4 border-b border-white/10 px-4 py-5 @2xl:px-8"><div className="w-44 shrink-0"><OfficialBrandLogo src="/agency/official-logo.webp" name="Dois.Zero" /></div><span className="text-xs uppercase tracking-[0.16em] text-zinc-400">{presentation.agency_name || 'Apresentação criativa'}</span></header>
    <main className="mx-auto max-w-6xl px-4 @2xl:px-8">
      <div className="relative border-b border-white/10 py-10 @2xl:py-20"><div aria-hidden="true" className="pointer-events-none absolute -right-16 top-8 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl" /><div className="relative max-w-4xl space-y-6">{logo && <img src={logo} alt={`Logo de ${presentation.client_name || 'cliente'}`} className="max-h-20 max-w-52 rounded-lg object-contain" />}<p className="text-sm font-medium uppercase tracking-[0.16em] text-orange-400">{presentation.client_name || 'Apresentação do projeto'} · {month} / {presentation.period_year}</p><h1 className="break-words text-2xl font-semibold leading-tight tracking-tight @2xl:text-5xl @3xl:text-6xl">{presentation.title}</h1>{presentation.description && <p className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-zinc-300 @2xl:text-lg">{presentation.description}</p>}<div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 text-sm text-zinc-400"><span>{orderedSections.length} {orderedSections.length === 1 ? 'seção' : 'seções'}</span><span>{materialCount} {materialCount===1?'material':'materiais'}</span></div></div></div>
      {orderedSections.length === 0 && <p className="py-16 text-zinc-400">Esta apresentação ainda não possui seções.</p>}
      {orderedSections.map((section, index) => { const media = orderedAssets.filter(asset => asset.section_id === section.id); return <section key={section.id} className="border-b border-white/10 py-12 @2xl:py-16"><div className="mb-8 flex gap-4 @2xl:gap-7"><span className="pt-1 text-sm font-medium text-orange-400">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 space-y-4"><p className="text-xs uppercase tracking-[0.16em] text-zinc-400">{labels[section.section_type] || 'Seção'}</p><h2 className="break-words text-2xl font-semibold tracking-tight @2xl:text-4xl">{section.title}</h2>{section.content?.subtitle && <p className="text-xl text-orange-300">{section.content.subtitle}</p>}{section.description && <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-zinc-300">{section.description}</p>}{section.content?.text && <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-zinc-300">{section.content.text}</p>}{Array.isArray(section.content?.list) && <ul className="grid gap-3 @2xl:grid-cols-2">{section.content.list.filter((item): item is string => typeof item === 'string').map((item, i) => <li key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-zinc-200">{item}</li>)}</ul>}</div></div>{sectionImages(section).length>0&&<div className="mb-8 grid gap-6 @3xl:grid-cols-2">{sectionImages(section).map((illustration,i)=><figure key={illustration.src+String(i)} className="overflow-hidden rounded-xl border border-white/10"><img src={safeUrl(illustration.src)} alt={typeof illustration.alt==='string'?illustration.alt:'Ilustração da apresentação'} loading="lazy" className="w-full object-contain"/></figure>)}</div>}{media.length > 0 && <div className="mx-auto max-w-3xl"><PresentationGallery assets={media} publicToken={publicToken} onReview={onReview} reviews={reviews}/></div>}</section> })}
      {unassignedAssets.length > 0 && <section className="space-y-8 border-b border-white/10 py-12"><h2 className="text-2xl font-semibold">Materiais complementares</h2><div className="mx-auto max-w-3xl"><PresentationGallery assets={unassignedAssets} publicToken={publicToken} onReview={onReview} reviews={reviews}/></div></section>}
      <footer className="flex flex-wrap items-center justify-between gap-5 py-10 text-sm text-zinc-400"><span>{presentation.client_name || presentation.title}</span><span>Dois.Zero · Estratégia e criação</span></footer>
    </main>
  </div>
}
