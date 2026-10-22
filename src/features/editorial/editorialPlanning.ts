import {parseEditorialDirection} from './automaticEditorialPlan'
import type {EditorialContext,EditorialFormat} from './monthlyPlanner'
export type EditorialCounts=Record<EditorialFormat,number>
export interface PreparedEditorialPlan {key:string;total:number;formatCounts:EditorialCounts;reason:string}
export const monthlyCommand=(context:EditorialContext)=>[context.monthlyDirection?.trim(),context.seasonalDates?.trim()?`Datas sazonais solicitadas para a campanha:\n${context.seasonalDates.trim()}`:''].filter(Boolean).join('\n\n')
export function explicitEditorialPlan(direction:string,volume?:number){
 const parsed=parseEditorialDirection(direction,volume)
 if(parsed.error)throw Error(parsed.error)
 return parsed.complete?{total:parsed.total,formatCounts:{post:parsed.formatCounts.post||0,carousel:parsed.formatCounts.carousel||0,reels:parsed.formatCounts.reels||0},reason:'Quantidades especificadas na direção mensal.'}:null
}
/** Small sequential calls preserve the response limits; only the completed campaign is persisted. */
export function editorialBatches(counts:EditorialCounts):EditorialCounts[]{
 const result:EditorialCounts[]=[],remaining={...counts}
 if(Object.values(counts).some(v=>!Number.isInteger(v)||v<0)||Object.values(counts).reduce((a,b)=>a+b,0)<1||Object.values(counts).reduce((a,b)=>a+b,0)>90)throw Error('O plano deve conter de 1 a 90 materiais com quantidades inteiras.')
 while(Object.values(remaining).some(v=>v>0)){
  const batch:EditorialCounts={post:0,carousel:0,reels:0};let available=4
  for(const format of ['post','carousel','reels'] as const){batch[format]=Math.min(remaining[format],available);remaining[format]-=batch[format];available-=batch[format]}
  result.push(batch)
 }
 return result
}
