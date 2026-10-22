import {ENGINE_VERSION,editorialSignature,normalizeEditorial,renderEditorialCopy,validateEditorialItems,type HistoryEntry} from './campaignEngine'
import type {EditorialContext,MonthlyItem,EditorialTrace,EditorialFormat} from './monthlyPlanner'
export interface AiCalendarItem {date:string;format:EditorialFormat;title:string;headline:string;support:string;caption:string;visual:string;duration?:number;slides?:{headline:string;text:string;visual:string}[];scenes?:{seconds:number;text:string;visual:string;narration?:string;onScreen?:string}[]}
export interface AiCalendarResult {provider:'gemini';model:string;requiresReview:true;items:AiCalendarItem[]}
export function adaptAiCalendar(result:AiCalendarResult,context:EditorialContext,month:string,counts:Record<EditorialFormat,number>,history:HistoryEntry[]=[]):MonthlyItem[]{
 if(result.provider!=='gemini'||result.requiresReview!==true||!Array.isArray(result.items)||!result.items.length||result.items.length>12)throw Error('Resposta da IA inválida. Nenhum calendário foi salvo.')
 const actual={post:0,carousel:0,reels:0},dates=new Set<string>()
 const previous=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7))-2,1)).toISOString().slice(0,7)
 const oldThemes=new Set(history.filter(h=>h.month?.slice(0,7)===previous).map(h=>normalizeEditorial(h.item.editorial?.theme||h.item.title)))
 const items=result.items.map((raw):MonthlyItem=>{
  if(!Object.hasOwn(actual,raw.format))throw Error('Formato de IA não reconhecido.')
  actual[raw.format]++
  const day=Number(raw.date?.slice(8)),days=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate()
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw.date)||raw.date.slice(0,7)!==month||day<1||day>days||dates.has(raw.date))throw Error('A IA devolveu datas repetidas ou fora do mês. Gere novamente.')
  dates.add(raw.date)
  for(const key of ['title','headline','support','caption','visual'] as const)if(typeof raw[key]!=='string'||(key!=='support'&&!raw[key].trim()))throw Error('A IA devolveu conteúdo incompleto.')
  if(raw.headline.length>100||raw.support.length>180||raw.caption.length>2200||oldThemes.has(normalizeEditorial(raw.title)))throw Error('A IA devolveu texto extenso ou tema do mês anterior. Revise a direção e gere novamente.')
  if(raw.format==='carousel'&&(!Array.isArray(raw.slides)||raw.slides.length<5||raw.slides.length>8||raw.slides.some(s=>!s.text?.trim()||!s.visual?.trim()||s.text.length>180)))throw Error('Carrossel de IA deve conter de cinco a oito lâminas completas e objetivas.')
  if(raw.format==='reels'&&(![30,40,50].includes(raw.duration||0)||!raw.scenes?.length||raw.scenes.some(s=>!s.text?.trim()||!s.visual?.trim()||!Number.isFinite(s.seconds)||s.seconds<=0)||raw.scenes.reduce((sum,s)=>sum+s.seconds,0)!==raw.duration))throw Error('Confira o roteiro da IA: cenas completas e duração de 30, 40 ou 50 segundos.')
  const trace:EditorialTrace={version:ENGINE_VERSION,theme:raw.title,pillarId:'ai-monthly',pillar:'Direção mensal',family:'ai-draft',angle:raw.format,journey:'Revisão editorial',objective:context.objective,audience:context.audience,cta:'Conferir chamada para ação',signature:editorialSignature(raw.title,'ai-draft',raw.format),visual:raw.visual,caption:raw.caption,postConcept:{headline:raw.headline,support:raw.support,composition:raw.visual,caption:raw.caption},slides:raw.slides,scenes:raw.scenes,warnings:['Rascunho gerado por IA. Confirme fatos, linguagem e direção antes de aprovar.'],sources:(context.approvedFacts||[]).map(f=>'Informação aprovada: '+f),rules:['generation:gemini','model:'+result.model,'revisao-humana-obrigatoria']}
  const item:MonthlyItem={date:raw.date,format:raw.format,title:raw.title,copy:'',editorial:trace};item.copy=renderEditorialCopy(item);return item
 })
 if((['post','carousel','reels'] as const).some(f=>actual[f]!==counts[f]))throw Error('A IA não respeitou o mix mensal. Nenhum calendário foi salvo.')
 validateEditorialItems(items,context);return items
}
