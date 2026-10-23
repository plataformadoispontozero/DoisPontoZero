import {useState,type ReactNode} from 'react'
import {Pause,Play} from 'lucide-react'
import './presentationHero.css'

export function PresentationHero({title,description,clientName,logo,eyebrow,children,sectionCount,materialCount,backgroundImage,backgroundColor}:{backgroundImage?:string;backgroundColor?:string;title:string;description?:string|null;clientName?:string|null;logo?:string;eyebrow:string;children:ReactNode;sectionCount:number;materialCount:number}){
 const color=backgroundColor||'#101014';
 const rgb=/^#[0-9a-f]{6}$/i.test(color)?[1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16)):[];
 const lightBackground=rgb.length===3&&(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114)>165;
 const generatedParts=title.split(' - ')
 const displayTitle=clientName&&generatedParts.length===3&&/^relatório mensal$/i.test(generatedParts[0].trim())&&generatedParts[1].trim()===clientName&&/\/\s*\d{4}$/.test(generatedParts[2])?generatedParts[0].trim():title
 const period=clientName&&eyebrow.startsWith(`${clientName} · `)?eyebrow.slice(clientName.length+3):eyebrow
 const [paused,setPaused]=useState(false),[failedLogo,setFailedLogo]=useState<string|null>(null)
 return <section aria-label="Apresentação do cliente" className="presentation-hero" style={{backgroundColor:backgroundColor||"#101014"}} data-paused={paused} data-has-image={!!backgroundImage} data-light-background={lightBackground}>
  <div className="presentation-hero__background" aria-hidden="true">{backgroundImage?<img src={backgroundImage} alt="" onError={event=>{event.currentTarget.style.visibility="hidden"}} className="presentation-hero__cover-image"/>:<div className="presentation-hero__grid"/>}</div>
  <div className="presentation-hero__content">
   {logo&&failedLogo!==logo?<img src={logo} alt={`Logo de ${clientName||'cliente'}`} onError={()=>setFailedLogo(logo)} className="presentation-hero__logo"/>:clientName&&<p className="presentation-hero__client">{clientName}</p>}
   <p className="presentation-hero__eyebrow"><span aria-hidden="true"/>{period}</p>
   <h1 data-detailed={displayTitle.length>45} aria-label={title} title={title} className="presentation-hero__title">{displayTitle}</h1>
   <p className="mx-auto max-w-xl whitespace-pre-wrap text-base leading-relaxed text-zinc-400 @2xl:text-lg">{description||'Explore os materiais e compartilhe seu retorno em cada entrega.'}</p>
   <div className="flex flex-wrap items-center justify-center gap-4">{children}</div>
   <div className="flex flex-wrap justify-center gap-8 border-t border-white/10 pt-6 text-xs text-zinc-500"><span>{sectionCount} {sectionCount===1?'seção':'seções'}</span><span>{materialCount} {materialCount===1?'material':'materiais'}</span></div>
  </div>
  <button type="button" className="presentation-hero__motion" onClick={()=>setPaused(value=>!value)} aria-label={paused?'Retomar animação de fundo':'Pausar animação de fundo'}>{paused?<Play aria-hidden="true" size={13}/>:<Pause aria-hidden="true" size={13}/>}<span>{paused?'Retomar movimento':'Pausar movimento'}</span></button>
 </section>
}
