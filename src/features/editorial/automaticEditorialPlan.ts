import type { EditorialContext, EditorialFormat } from './monthlyPlanner';

export const MAX_MONTHLY_MATERIALS = 12;
/** A material is one Post, complete carousel, or Reels script — never one slide. */
export function automaticFormatCounts(contractedVolume?: number): Record<EditorialFormat, number> {
 const total=typeof contractedVolume==='number'&&Number.isFinite(contractedVolume)&&contractedVolume>0?Math.max(1,Math.min(MAX_MONTHLY_MATERIALS,Math.floor(contractedVolume))):MAX_MONTHLY_MATERIALS;
 if(total===1)return {post:1,carousel:0,reels:0};
 if(total===2)return {post:1,carousel:1,reels:0};
 const reels=Math.max(1,Math.floor(total/4)),carousel=Math.max(1,Math.floor(total/3));
 return {post:total-reels-carousel,carousel,reels};
}
export function automaticEditorialContext(context:EditorialContext):EditorialContext {
 return {...context,planningMode:'automatic',carouselSlides:5,reelsScenes:3,reelsSeconds:30};
}
export const automaticReelsDuration=(index:number)=>[30,40,50][index%3];
