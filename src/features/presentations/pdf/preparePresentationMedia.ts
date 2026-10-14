import type {PresentationPdfModel} from './types'
function safeSource(src:string){try{return new URL(src).protocol==='https:'?src:''}catch{return ''}}
export function pdfImageSources(model:PresentationPdfModel){return model.sections.map(section=>({sectionId:section.id,images:[...(Array.isArray(section.content?.images)?section.content.images:[]).map((image:{src:string;alt:string})=>({src:safeSource(image.src),title:image.alt||section.title})).filter((image:{src:string})=>image.src),...model.assets.filter(asset=>asset.section_id===section.id&&asset.file_reference?.mime_type?.startsWith('image/')).map(asset=>({src:safeSource(asset.file_reference?.thumbnail_reference||''),title:asset.title}))].slice(0,20)}))}
async function raster(src:string):Promise<string>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000)
 try{const response=await fetch(src,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Imagem indisponível');const blob=await response.blob();if(blob.size>25*1024*1024)throw Error('Imagem muito grande');const url=URL.createObjectURL(blob)
 try{const image=new Image();image.src=url;await image.decode();const scale=Math.min(1,2000/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const context=canvas.getContext('2d');if(!context)throw Error('Prévia indisponível');context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',0.94)}finally{URL.revokeObjectURL(url)}}finally{clearTimeout(timer)}
}
export async function preparePresentationMedia(model:PresentationPdfModel,load=raster){
 const assigned=new Set(model.sections.map(section=>section.id));const missing=model.assets.filter(asset=>!asset.section_id||!assigned.has(asset.section_id));
 const normalized={...model,sections:[...model.sections],assets:model.assets.map(asset=>missing.includes(asset)?{...asset,section_id:'pdf-unassigned'}:asset)}
 if(missing.length)normalized.sections.push({id:'pdf-unassigned',title:'Materiais da apresentação',content:{},position:model.sections.length,agency_id:'',presentation_id:model.presentationId,section_type:'gallery',created_at:'',updated_at:''})
 const source=pdfImageSources(normalized),sections=[];let failures=0
 for(const section of normalized.sections){const images=source.find(s=>s.sectionId===section.id)?.images||[],prepared:Array<{title:string;src:string}>=[];
  for(let index=0;index<images.length;index+=3){const batch=await Promise.all(images.slice(index,index+3).map(async image=>{try{if(!image.src)throw Error('Sem prévia');return {title:image.title,src:await load(image.src)}}catch{failures++;return {title:image.title,src:''}}}));prepared.push(...batch)}
  sections.push({...section,content:{...section.content,printImages:prepared}})
 }
 return {...model,sections,mediaWarnings:failures}
}
