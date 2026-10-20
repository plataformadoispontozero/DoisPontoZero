import {useState,type ReactNode} from 'react'
import {Pause,Play} from 'lucide-react'
import './presentationHero.css'

export function PresentationHero({title,description,clientName,logo,eyebrow,children,sectionCount,materialCount}:{title:string;description?:string|null;clientName?:string|null;logo?:string;eyebrow:string;children:ReactNode;sectionCount:number;materialCount:number}){
 const [paused,setPaused]=useState(false),[failedLogo,setFailedLogo]=useState<string|null>(null)
 return <section aria-label="Apresentação do cliente" className="presentation-hero" data-paused={paused}>
  <div className="presentation-hero__background" aria-hidden="true"><div className="presentation-hero__grid"/></div>
  <div className="presentation-hero__content">
   {logo&&failedLogo!==logo?<img src={logo} alt={`Logo de ${clientName||'cliente'}`} onError={()=>setFailedLogo(logo)} className="presentation-hero__logo"/>:clientName&&<p className="presentation-hero__client">{clientName}</p>}
   <p className="text-xs font-medium uppercase leading-relaxed tracking-[0.18em] text-orange-300">{eyebrow}</p>
   <h1 className="presentation-hero__title">{title}</h1>
   {description&&<p className="mx-auto max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-zinc-300 @2xl:text-lg">{description}</p>}
   <div className="flex flex-wrap items-center justify-center gap-4">{children}</div>
   <div className="flex flex-wrap justify-center gap-8 pt-2 text-sm text-zinc-400"><span>{sectionCount} {sectionCount===1?'seção':'seções'}</span><span>{materialCount} {materialCount===1?'material':'materiais'}</span></div>
  </div>
  <button type="button" className="presentation-hero__motion" onClick={()=>setPaused(value=>!value)} aria-label={paused?'Retomar animação de fundo':'Pausar animação de fundo'}>{paused?<Play aria-hidden="true" size={13}/>:<Pause aria-hidden="true" size={13}/>}<span>{paused?'Retomar movimento':'Pausar movimento'}</span></button>
 </section>
}
