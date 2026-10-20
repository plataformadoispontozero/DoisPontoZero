import {PresentationHero} from './PresentationHero'
import {PresentationReel} from './PresentationReel'
import {usePresentationImage} from './presentationMedia'
import { useState, useRef, useId } from 'react'
import { ArrowDown, ArrowUpRight, Check, ChevronLeft, ChevronRight, X, Pencil, MessageSquare, Maximize2, FileText, Film, Folder, Image as ImageIcon } from 'lucide-react'
import { OfficialBrandLogo } from '@/components/shared/OfficialBrandLogo'
import {Dialog,DialogHeader,DialogTitle,DialogContent} from '@/components/ui/Dialog'
import type { Presentation } from '@/types/presentations'

export interface PreviewSection {
  id: string
  section_type: string
  title: string
  description?: string | null
  position: number
  content?: { text?: string; subtitle?: string; list?: unknown[]; images?: {src:string;alt:string}[]; media_layout?: string }
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
 const [decision,setDecision]=useState<MaterialDecision|null>(null),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState<MaterialReview|null>(null),[editingReview,setEditingReview]=useState(false)
 const image=usePresentationImage(asset,publicToken)
 const fullImage=usePresentationImage(asset,publicToken,{enabled:expanded,full:true})
 const original=image.managed?image.url:safeUrl(asset.thumbnail_reference||asset.file_reference?.thumbnail_reference),thumbnail=image.managed?original:fallback?original:highQualityThumbnail(original)
 const mime=asset.mime_type||asset.file_reference?.mime_type||'',isVideo=mime.startsWith('video/'),isFolder=mime==='application/vnd.google-apps.folder'
 const Icon=isVideo?Film:isFolder?Folder:mime.startsWith('image/')?ImageIcon:FileText
 const label=isVideo?'Vídeo':isFolder?'Pasta':mime.startsWith('image/')?'Imagem':'Material'
 async function submit(value:MaterialDecision,valueNote=note){if(!onReview)return;const submittedNote=valueNote.trim();setBusy(true);setError('');try{await onReview(asset.id,value,submittedNote);setSaved({decision:value,note:submittedNote});setDecision(null);setNote('');setEditingReview(false)}catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar a decisão. Tente novamente.')}finally{setBusy(false)}}
 const currentReview=saved||review,status=currentReview?.decision,statusLabels:Record<string,string>={approved:'Aprovado',changes_requested:'Ajuste solicitado',rejected:'Reprovado'}
 return <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#171719]">
 <div className="relative flex min-h-48 items-center justify-center bg-[#101012]">
 {isVideo&&image.managed?<PresentationReel assetId={asset.id} title={asset.title} poster={thumbnail} publicToken={publicToken}/>:thumbnail&&!failedImage?<button type="button" aria-label={`Ampliar ${asset.title}`} className="block w-full cursor-zoom-in" onClick={()=>setExpanded(true)}><img src={thumbnail} alt={asset.title} loading="lazy" decoding="async" onError={()=>{if(!fallback&&thumbnail!==original)setFallback(true);else setFailedImage(true)}} className="max-h-[65svh] w-full object-contain"/><span className="absolute bottom-3 right-3 rounded-lg bg-black/70 p-2"><Maximize2 className="h-4 w-4"/></span></button>:<div className="flex flex-col items-center gap-4 px-6 py-16 text-center"><Icon className="h-10 w-10 text-orange-400"/><p role="status" className="text-sm text-zinc-400">{image.managed&&!image.error&&!failedImage?'Carregando material…':'Prévia do material indisponível.'}</p>{image.error&&<button type="button" className="text-sm text-orange-300 underline" onClick={()=>{setFailedImage(false);void image.retry()}}>Tentar novamente</button>}</div>}
 <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs text-white">{label}</span></div>
 <div className="flex flex-1 flex-col gap-4 p-4 @2xl:p-6"><h3 className="break-words text-base font-semibold text-white">{asset.title}</h3>{asset.description&&<p className="whitespace-pre-wrap text-sm text-zinc-300">{asset.description}</p>}{status&&<p role="status" className={`text-sm font-medium ${status==='approved'?'text-emerald-300':status==='rejected'?'text-rose-300':'text-amber-300'}`}>{statusLabels[status]||status}</p>}{currentReview?.note&&<div className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="mb-2 text-xs text-zinc-400">Retorno do cliente</p><p className="whitespace-pre-wrap text-sm text-zinc-200">{currentReview.note}</p></div>}
 <div className="mt-auto grid grid-cols-2 gap-2">{([{key:'approved',name:'Aprovar',Icon:Check,color:'bg-emerald-600 hover:bg-emerald-500'},{key:'rejected',name:'Reprovar',Icon:X,color:'bg-rose-600 hover:bg-rose-500'},{key:'changes_requested',name:'Solicitar ajuste',Icon:MessageSquare,color:'bg-amber-700 hover:bg-amber-600'}] as const).map(action=><button type="button" key={action.key} disabled={!onReview||busy} onClick={()=>{setError('');setEditingReview(false);if(action.key==='approved')void submit(action.key,'');else {setDecision(action.key);setNote('')}}} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${action.key==='changes_requested'?'col-span-2':''} ${action.color}`}><action.Icon className="h-4 w-4"/>{action.name}</button>)}</div>{onReview&&currentReview&&<button type="button" disabled={busy} className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-zinc-300 underline underline-offset-4 hover:text-white" onClick={()=>{setEditingReview(true);setError('');setDecision(currentReview.decision as MaterialDecision);setNote(currentReview.note||'')}}><Pencil className="h-3.5 w-3.5"/>Editar retorno</button>}{!onReview&&<p className="text-xs text-zinc-400">As decisões são registradas no link de aprovação enviado ao cliente.</p>}{error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}</div>
 <Dialog open={expanded} onOpenChange={setExpanded} className="max-w-5xl"><DialogHeader onClose={()=>setExpanded(false)}><DialogTitle>{asset.title}</DialogTitle></DialogHeader><DialogContent><img src={image.managed?(fullImage.url||original):highQualityThumbnail(original,2400)} alt={`Visualização ampliada de ${asset.title}`} onError={e=>{if(e.currentTarget.src!==original&&original)e.currentTarget.src=original}} className="max-h-[75vh] w-full object-contain"/></DialogContent></Dialog>
 <Dialog open={!!decision} onOpenChange={open=>{if(!open&&!busy)setDecision(null)}}><DialogHeader onClose={()=>{if(!busy)setDecision(null)}}><DialogTitle>{editingReview?'Editar retorno':decision==='changes_requested'?'Solicitar ajuste':'Reprovar material'}</DialogTitle></DialogHeader><DialogContent>{editingReview&&<label className="mb-4 grid gap-2 text-sm">Decisão<select value={decision||'changes_requested'} onChange={e=>setDecision(e.target.value as MaterialDecision)} className="rounded-lg border border-white/15 bg-[#19191f] p-3"><option value="approved">Aprovado</option><option value="changes_requested">Ajuste solicitado</option><option value="rejected">Reprovado</option></select></label>}<label className="block space-y-2 text-sm">{editingReview?'Comentário para a equipe':decision==='changes_requested'?'Qual ajuste precisa ser feito?':'Por que o material foi reprovado?'}<textarea autoFocus maxLength={3000} value={note} onChange={e=>setNote(e.target.value)} className="block min-h-32 w-full rounded-lg border border-white/15 bg-black/20 p-3"/></label><p className="mt-3 text-xs text-zinc-400">O retorno mais recente aparece no card. As avaliações anteriores ficam no histórico da equipe.</p>{error&&<p role="alert" className="mt-3 text-rose-300">{error}</p>}<button disabled={busy||(decision!=='approved'&&!note.trim())} onClick={()=>decision&&void submit(decision)} className="mt-4 rounded-lg bg-orange-600 px-4 py-3 text-white disabled:opacity-50">{busy?'Salvando…':editingReview?'Salvar retorno':'Enviar retorno'}</button></DialogContent></Dialog>
 </article>
}

function sectionImages(section: PreviewSection) {
 return Array.isArray(section.content?.images) ? section.content.images.slice(0,20).filter(image => image && typeof image.src === 'string' && safeUrl(image.src)) : [];
}


export function PresentationGallery({assets,publicToken,onReview,reviews,layout='grid'}:{assets:PreviewAsset[];layout?:string}&ReviewProps){
 const [index,setIndex]=useState(0),gesture=useRef<{x:number;y:number;id:number}|null>(null),swiped=useRef(false)
 const current=Math.min(index,Math.max(0,assets.length-1)),asset=assets[current]
 if(!asset)return null
 if(layout==='grid')return <div role="region" aria-label="Galeria de materiais" className="grid min-w-0 items-stretch gap-6 @2xl:grid-cols-2 @5xl:grid-cols-3">{assets.map(item=><PresentationMedia key={item.id} asset={item} publicToken={publicToken} onReview={onReview} review={reviews?.[item.id]}/>)}</div>
 if(layout==='carousel')return <div role="region" aria-label="Carrossel de artes" className="flex gap-4 overflow-x-auto pb-5 snap-x snap-mandatory">{[...assets].sort((a,b)=>a.title.localeCompare(b.title,'pt-BR',{numeric:true,sensitivity:'base'})).map((item,i)=><div key={item.id} className="w-[85%] shrink-0 snap-start @2xl:w-[45%] @5xl:w-[31%]"><p className="mb-2 text-xs text-orange-300">Lâmina {i+1}</p><PresentationMedia asset={item} publicToken={publicToken} onReview={onReview} review={reviews?.[item.id]}/></div>)}</div>
 const move=(delta:number)=>setIndex(i=>(Math.min(i,assets.length-1)+delta+assets.length)%assets.length)
 const button='flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400'
 return <div role="region" aria-label="Galeria de materiais" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1)}}} className="min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
  {assets.length>1&&<div className="mb-3 flex items-center justify-between gap-3"><button type="button" aria-label="Imagem anterior" className={button} onClick={()=>move(-1)}><ChevronLeft aria-hidden="true" className="h-5 w-5"/></button><p role="status" className="text-sm text-zinc-300">{current+1} de {assets.length}</p><button type="button" aria-label="Próxima imagem" className={button} onClick={()=>move(1)}><ChevronRight aria-hidden="true" className="h-5 w-5"/></button></div>}
  <div style={{touchAction:'pan-y'}} onPointerDown={e=>{if(e.isPrimary&&e.button===0&&(e.target as Element).closest('img')){swiped.current=false;gesture.current={x:e.clientX,y:e.clientY,id:e.pointerId}}}} onPointerCancel={()=>{gesture.current=null}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(!start||start.id!==e.pointerId)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.abs(x)>60&&Math.abs(x)>Math.abs(y)*1.5){swiped.current=true;move(x<0?1:-1)}}} onClickCapture={e=>{if(swiped.current){e.preventDefault();e.stopPropagation();swiped.current=false}}} onDragStart={e=>e.preventDefault()}><PresentationMedia key={asset.id} asset={asset} publicToken={publicToken} onReview={onReview} review={reviews?.[asset.id]}/></div>
  {assets.length>1&&<p className="mt-2 text-center text-xs text-zinc-400">Use as setas ou arraste a imagem para os lados. Pelo teclado, foque a galeria e use as setas.</p>}
 </div>
}
export function PresentationPreview({ presentation, sections, assets,onReview,reviews,publicToken }: { presentation: PreviewPresentation; sections: PreviewSection[]; assets: PreviewAsset[] } & ReviewProps) {
 const prefix=useId().replace(/:/g,''),sectionId=(i:number)=>`${prefix}-section-${i}`,materialsId=`${prefix}-materials`
 const materialCount=assets.length+sections.reduce((n,s)=>n+sectionImages(s).length,0)
 const orderedSections=[...sections].sort((a,b)=>a.position-b.position),orderedAssets=[...assets].sort((a,b)=>(a.position||0)-(b.position||0))
 const unassignedAssets=orderedAssets.filter(asset=>!orderedSections.some(section=>section.id===asset.section_id))
 const logo=safeUrl(presentation.client_logo_url)
 const month=presentation.period_month>=1&&presentation.period_month<=12?new Intl.DateTimeFormat('pt-BR',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,presentation.period_month-1,1))):'Período'
 const firstMaterialSection=orderedSections.findIndex(s=>orderedAssets.some(a=>a.section_id===s.id)||sectionImages(s).length>0)
 const materialTarget=firstMaterialSection>=0?sectionId(firstMaterialSection):unassignedAssets.length?materialsId:orderedSections.length?sectionId(0):undefined
 const linkClass='inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#111113]'
 return <div data-testid="presentation-preview" className="@container overflow-clip rounded-2xl bg-[#111113] text-white selection:bg-orange-600">
  <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 @2xl:px-10"><div className="w-36"><OfficialBrandLogo src="/agency/official-logo.webp" name="Dois.Zero"/></div><span className="hidden text-xs uppercase tracking-[0.16em] text-zinc-400 @2xl:inline">{presentation.agency_name||'Estratégia & criação'}</span>{materialTarget&&<a href={`#${materialTarget}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-orange-300">Explorar materiais <ArrowUpRight className="h-4 w-4"/></a>}</header>
  <main>
   <PresentationHero title={presentation.title} description={presentation.description} clientName={presentation.client_name} logo={logo} eyebrow={`${presentation.client_name||'Apresentação do projeto'} · ${month} / ${presentation.period_year}`} sectionCount={orderedSections.length} materialCount={materialCount}>
    {materialTarget&&<a href={`#${materialTarget}`} className={`${linkClass} bg-orange-600 text-white hover:bg-orange-500`}>Conhecer as entregas <ArrowDown className="h-4 w-4"/></a>}
    {orderedSections.length>0&&<a href={`#${sectionId(0)}`} className={`${linkClass} border border-white/20 hover:bg-white/5`}>Ver apresentação</a>}
   </PresentationHero>
   <div className="mx-auto max-w-7xl px-5 @2xl:px-10">
   {orderedSections.length>0&&<nav aria-label="Seções da apresentação" className="flex gap-2 overflow-x-auto border-b border-white/10 py-5">{orderedSections.map((section,index)=><a key={section.id} href={`#${sectionId(index)}`} className="flex min-h-11 shrink-0 items-center gap-3 rounded-full border border-white/10 px-4 text-xs text-zinc-300 hover:border-orange-400/60 focus-visible:ring-2 focus-visible:ring-orange-400"><span className="text-orange-300">{String(index+1).padStart(2,'0')}</span>{section.title}</a>)}</nav>}
   {orderedSections.length===0&&<p className="py-16 text-zinc-400">Esta apresentação ainda não possui seções.</p>}
   {orderedSections.map((section,index)=>{const media=orderedAssets.filter(asset=>asset.section_id===section.id);return <section key={section.id} id={sectionId(index)} className="scroll-mt-6 border-b border-white/10 py-14 @2xl:py-20"><div className="mb-10 grid gap-6 @3xl:grid-cols-[0.38fr_1fr]"><div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-zinc-400"><span className="text-orange-300">{String(index+1).padStart(2,'0')}</span>{labels[section.section_type]||'Seção'}</div><div className="min-w-0 space-y-5"><h2 className="break-words text-3xl font-semibold tracking-tight @2xl:text-5xl">{section.title}</h2>{section.content?.subtitle&&<p className="text-xl text-orange-300">{section.content.subtitle}</p>}{section.description&&<p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-zinc-300">{section.description}</p>}{section.content?.text&&<p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-zinc-300">{section.content.text}</p>}{Array.isArray(section.content?.list)&&<ul className="grid gap-3 @2xl:grid-cols-2">{section.content.list.filter((item):item is string=>typeof item==='string').map((item,i)=><li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 p-4 text-zinc-200"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-orange-300"/>{item}</li>)}</ul>}</div></div>{sectionImages(section).length>0&&<div className="mb-8 grid gap-6 @3xl:grid-cols-2">{sectionImages(section).map((illustration,i)=><figure key={illustration.src+String(i)} className="overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1e]"><img src={safeUrl(illustration.src)} alt={typeof illustration.alt==='string'?illustration.alt:'Ilustração da apresentação'} loading="lazy" className="w-full object-contain"/></figure>)}</div>}{media.length>0&&<div className="mx-auto max-w-4xl"><PresentationGallery assets={media} layout={section.content?.media_layout||'grid'} publicToken={publicToken} onReview={onReview} reviews={reviews}/></div>}</section>})}
   {unassignedAssets.length>0&&<section id={materialsId} className="scroll-mt-6 space-y-8 border-b border-white/10 py-14 @2xl:py-20"><p className="text-xs uppercase tracking-[0.16em] text-orange-300">Mais do projeto</p><h2 className="text-3xl font-semibold @2xl:text-5xl">Materiais complementares</h2><div className="mx-auto max-w-4xl"><PresentationGallery assets={unassignedAssets} publicToken={publicToken} onReview={onReview} reviews={reviews}/></div></section>}
   {assets.length>0&&materialTarget&&<aside className="my-12 flex flex-col justify-between gap-7 rounded-2xl border border-orange-400/25 bg-[#201a17] p-7 @2xl:flex-row @2xl:items-center @2xl:p-10"><div className="space-y-3"><p className="text-xs uppercase tracking-[0.16em] text-orange-300">Próximo passo</p><p className="text-2xl font-semibold">{onReview?'Seu retorno faz parte da entrega.':'Conheça cada detalhe da entrega.'}</p><p className="max-w-xl text-sm leading-relaxed text-zinc-300">{onReview?'Abra cada material para avaliar. As decisões e os comentários são registrados individualmente.':'Navegue pelos materiais e amplie as imagens. A aprovação fica disponível no link enviado ao cliente.'}</p></div><a href={`#${materialTarget}`} className={`${linkClass} shrink-0 bg-orange-600 hover:bg-orange-500`}>{onReview?'Revisar materiais':'Voltar aos materiais'}<ArrowUpRight className="h-4 w-4"/></a></aside>}
   <footer className="flex flex-wrap items-center justify-between gap-5 py-9 text-xs text-zinc-400"><span>{presentation.client_name||presentation.title}</span><span>Dois.Zero · Estratégia e criação</span></footer>
   </div>
  </main>
 </div>
}
