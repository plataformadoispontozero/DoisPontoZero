import type {Presentation} from '@/types/presentations'

export function nextPresentationPeriod(month:number,year:number){
 return month===12?{month:1,year:year+1}:{month:month+1,year}
}

export function reusablePresentation(source:Presentation,month:number,year:number,title:string){
 if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(year)||year<2020||year>9999||!title.trim())throw new Error('Confira o título e o período da nova apresentação.')
 return {
  title:title.trim(),client_id:source.client_id,client_name:source.client_name,
  description:source.description||undefined,period_month:month,period_year:year,
  sections_snapshot:[...(source.sections||[])].sort((a,b)=>a.position-b.position).map(section=>({
   section_type:section.section_type,title:section.title,description:section.description,
   content:{...(['grid','carousel'].includes(section.content.media_layout)?{media_layout:section.content.media_layout}:{}),...(typeof section.content.text==='string'?{text:section.content.text}:{}),...(typeof section.content.subtitle==='string'?{subtitle:section.content.subtitle}:{}),...(Array.isArray(section.content.list)?{list:section.content.list.filter((value:unknown)=>typeof value==='string')}:{} )},
  })),
 }
}
