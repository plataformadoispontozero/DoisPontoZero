import type { EditorialContext, EditorialFormat } from './monthlyPlanner';

export const MAX_MONTHLY_MATERIALS = 90;
/** A material is one Post, complete carousel, or Reels script — never one slide. */
export function automaticFormatCounts(contractedVolume?: number): Record<EditorialFormat, number> {
 const total=typeof contractedVolume==='number'&&Number.isFinite(contractedVolume)&&contractedVolume>0?Math.max(1,Math.min(MAX_MONTHLY_MATERIALS,Math.floor(contractedVolume))):12;
 if(total===1)return {post:1,carousel:0,reels:0};
 if(total===2)return {post:1,carousel:1,reels:0};
 const reels=Math.max(1,Math.floor(total/4)),carousel=Math.max(1,Math.floor(total/3));
 return {post:total-reels-carousel,carousel,reels};
}
export function automaticEditorialContext(context:EditorialContext):EditorialContext {
 return {...context,planningMode:'automatic',carouselSlides:5,reelsScenes:3,reelsSeconds:30};
}
export const automaticReelsDuration=(index:number)=>[30,40,50][index%3];

export interface DirectionPlan {total:number;formatCounts:Partial<Record<EditorialFormat,number>>;complete:boolean;explicit:boolean;error?:string}
/** Only numeric commands next to material names count; dates and slide/second counts do not. */
export function parseEditorialDirection(direction:string,contractedVolume?:number):DirectionPlan {
 const words:Record<string,number>={cem:100,cento:100,mil:1000,zero:0,um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,catorze:14,quatorze:14,quinze:15,dezesseis:16,dezessete:17,dezoito:18,dezenove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90};
 const text=direction.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(new RegExp('\\b('+Object.keys(words).join('|')+')(?:\\s+e\\s+(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove))?\\b','g'),(_all,a:string,b?:string)=>String(words[a]+(b?words[b]:0)));
 if(/\b\d+[,.]\d+\s*(?:posts?|reels?|carrossel|carrosseis|demandas?|materia(?:l|is)|conteudos?|pecas?)\b/.test(text)||/\b\d{4,}\s*(?:posts?|reels?|carrossel|carrosseis|demandas?|materia(?:l|is)|conteudos?|pecas?)\b/.test(text))return{total:0,formatCounts:{},complete:false,explicit:true,error:'Use quantidades inteiras e no máximo 90 materiais.'};
 const counts:Partial<Record<EditorialFormat,number>>={};let conflict=false;
 const formats:Record<string,EditorialFormat>={post:'post',posts:'post',reel:'reels',reels:'reels',carrossel:'carousel',carrosseis:'carousel'};
 for(const m of text.matchAll(/\b(\d{1,3})\s*(posts?|reels?|carrossel|carrosseis)\b/g)){const key=formats[m[2]],n=Number(m[1]);if(counts[key]!==undefined&&counts[key]!==n)conflict=true;counts[key]=n;}
 const totals=[...text.matchAll(/\b(\d{1,3})\s*(?:demandas?|materia(?:l|is)|conteudos?|pecas?)\b/g)].map(m=>Number(m[1]));
 const sum=Object.values(counts).reduce((a,b)=>a+b,0),explicit=Object.keys(counts).length>0||totals.length>0;
 const total=totals[0]??(sum||Math.min(90,Math.max(1,Math.floor(contractedVolume||12))));
 const complete=Object.keys(counts).length===3||sum===total&&sum>0;
 const error=!explicit&&!!contractedVolume&&contractedVolume>90?'O volume do cadastro excede 90 materiais. Especifique na direção um volume de até 90 para esta campanha.':conflict||totals.some(n=>n!==total)?'A direção contém quantidades conflitantes.':total<1||total>90||sum>90?'Use de 1 a 90 materiais por mês.':sum>total||complete&&sum!==total?'A soma dos formatos não corresponde ao total solicitado.':undefined;
 return{total,formatCounts:counts,complete,explicit,...(error?{error}:{})};
}
