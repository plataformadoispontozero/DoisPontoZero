import {useState,type ReactNode} from 'react'
import {Pause,Play} from 'lucide-react'
import './presentationHero.css'

export function PresentationHero({title,description,clientName,logo,eyebrow,children,sectionCount,materialCount}:{title:string;description?:string|null;clientName?:string|null;logo?:string;eyebrow:string;children:ReactNode;sectionCount:number;materialCount:number}){
 const [paused,setPaused]=useState(false),[failedLogo,setFailedLogo]=useState<string|null>(null)
 return <section aria-label="Apresentação do cliente" className="presentation-hero" data-paused={paused}>
  <div className="presentation-hero__background" aria-hidden="true"><svg viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" fill="none"><g className="presentation-hero__lines presentation-hero__lines--first">{Array.from({length:14},(_,i)=><path key={i} d={`M -160 ${180+i*26} C 200 ${-100+i*23}, 390 ${820+i*9}, 760 ${430+i*17} S 1180 ${70+i*23}, 1610 ${280+i*22}`} stroke={i%4===0?'#fb923c':'#c5c5cf'} strokeOpacity={i%4===0?'.24':'.09'} strokeWidth="1"/>)}</g><g className="presentation-hero__lines presentation-hero__lines--second">{Array.from({length:8},(_,i)=><path key={i} d={`M -120 ${660+i*28} C 330 ${520+i*18}, 470 ${-100+i*26}, 920 ${120+i*24} S 1220 ${700+i*16}, 1590 ${540+i*22}`} stroke="#fb923c" strokeOpacity=".13" strokeWidth="1"/>)}</g></svg></div>
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
