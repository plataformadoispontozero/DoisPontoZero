export type AiProvider='none'|'gemini'|'ollama'
export interface AiConfiguration{provider:AiProvider;model:string;apiKey:string;ollamaUrl:string;allowApprovedData:boolean}
export interface FormatCounts{post:number;carousel:number;reels:number}
export interface AiScene{seconds:number;text:string;visual:string;narration?:string;onScreen?:string}
export interface AiSlide{headline:string;text:string;visual:string}
export interface AiItem{date:string;format:'post'|'carousel'|'reels';title:string;headline:string;support:string;caption:string;visual:string;slides?:AiSlide[];scenes?:AiScene[];duration?:number}
export interface GenerationInput{clientId:string;month:string;direction:string;context:Record<string,unknown>;count:number;formatCounts:FormatCounts;generatedSoFar?:{date:string;title:string}[]}
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
export const validModel=(v:unknown):v is string=>typeof v==='string'&&/^gemini-[a-z0-9][a-z0-9.-]{1,99}$/.test(v)
export function automaticCounts(count:number):FormatCounts{if(count===1)return{post:1,carousel:0,reels:0};if(count===2)return{post:1,carousel:1,reels:0};const reels=Math.max(1,Math.floor(count/4)),carousel=Math.max(1,Math.floor(count/3));return{post:count-reels-carousel,carousel,reels}}
export function localOllamaUrl(v:unknown):string|null{try{if(typeof v!=='string')return null;const u=new URL(v);return u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&!u.username&&!u.password&&!u.search&&!u.hash&&['','/','/api'].includes(u.pathname)?u.origin:null}catch{return null}}
export function configurationFromInput(body:Record<string,unknown>,previous:AiConfiguration|null):AiConfiguration|null{
 if(!['none','gemini','ollama'].includes(String(body.provider))||typeof body.allowApprovedData!=='boolean')return null
 const provider=body.provider as AiProvider,model=typeof body.model==='string'?body.model.trim():''
 const key=typeof body.apiKey==='string'&&body.apiKey.trim()?body.apiKey.trim():previous?.apiKey||''
 const url=body.ollamaUrl===undefined?previous?.ollamaUrl||'http://localhost:11434':localOllamaUrl(body.ollamaUrl)
 if(!url||key.length>512||key.includes('\n')||key.includes('\r'))return null
 if(provider==='gemini'&&(!validModel(model)||key.length<16))return null
 if(provider==='ollama'&&(!/^[a-zA-Z0-9][a-zA-Z0-9:._/-]{0,119}$/.test(model)))return null
 return{provider,model,apiKey:key,ollamaUrl:url,allowApprovedData:body.allowApprovedData}
}
export function publicStatus(config:AiConfiguration|null,secureStorageAvailable:boolean){return{provider:config?.provider||'none',model:config?.model||'',ollamaUrl:config?.ollamaUrl||'http://localhost:11434',apiKeyConfigured:!!config?.apiKey,allowApprovedData:config?.allowApprovedData||false,secureStorageAvailable,generationAvailable:!!(secureStorageAvailable&&config?.provider==='gemini'&&config.apiKey&&validModel(config.model)&&config.allowApprovedData),requiresReview:true}}
const string=(v:unknown,max:number,min=0):v is string=>typeof v==='string'&&v.trim().length>=min&&v.length<=max
export function parseGenerationInput(body:Record<string,unknown>):GenerationInput|null{
 if(typeof body.clientId!=='string'||!UUID.test(body.clientId)||typeof body.month!=='string'||!/^20\d\d-(0[1-9]|1[0-2])$/.test(body.month)||!Number.isInteger(body.count)||Number(body.count)<1||Number(body.count)>12||!string(body.direction,6000,20)||!record(body.context))return null
 const count=Number(body.count),raw=body.formatCounts,counts=raw===undefined?automaticCounts(count):raw
 if(!record(counts)||Object.keys(counts).some(k=>!['post','carousel','reels'].includes(k))||!['post','carousel','reels'].every(k=>Number.isInteger(counts[k])&&Number(counts[k])>=0&&Number(counts[k])<=90)||Number(counts.post)+Number(counts.carousel)+Number(counts.reels)!==count)return null
 const context:Record<string,unknown>={}
 for(const field of ['objective','audience','tone','positioning','restrictions','visualGuidance']){if(body.context[field]!==undefined){if(!string(body.context[field],3000))return null;context[field]=body.context[field]}}
 for(const field of ['approvedFacts','forbiddenTerms','avoidedTopics','topics']){const v=body.context[field];if(v!==undefined){if(!Array.isArray(v)||v.length>40||v.some(x=>!string(x,500,1)))return null;context[field]=v}}
 const generated=body.generatedSoFar;
 if(generated!==undefined&&(!Array.isArray(generated)||generated.length>90||generated.some(v=>!record(v)||!string(v.title,120,3)||typeof v.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.date)||!v.date.startsWith(body.month+'-'))))return null;
 return{clientId:body.clientId,month:body.month,direction:body.direction.trim(),context,count,formatCounts:counts as unknown as FormatCounts,...(generated?{generatedSoFar:generated as {date:string;title:string}[]}:{})}
}
export type ValidationReason='count'|'copy'|'date'|'duplicate_title'|'slides'|'scenes'|'scene_content'|'scene_duration'|'format_counts';
export function validateGeneratedItems(value:unknown,input:GenerationInput,onInvalid?:(reason:ValidationReason)=>void):AiItem[]|null{
 const reject=(reason:ValidationReason)=>{onInvalid?.(reason);return null};
 if(!record(value)||!Array.isArray(value.items)||value.items.length!==input.count)return reject('count')
 const actual={post:0,carousel:0,reels:0},titles=new Set<string>((input.generatedSoFar||[]).map(i=>i.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\W+/g,' ').trim()));const items:AiItem[]=[]
 for(const raw of value.items){
  if(!record(raw)||!['post','carousel','reels'].includes(String(raw.format))||!string(raw.title,120,3)||!string(raw.headline,100,3)||!string(raw.support,180)||!string(raw.caption,2200,20)||!string(raw.visual,1500,3))return reject('copy')
  if(typeof raw.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(raw.date)||!raw.date.startsWith(input.month+'-'))return reject('date')
  const date=new Date(raw.date+'T12:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==raw.date)return reject('date')
  const normalized=raw.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\W+/g,' ').trim();if(titles.has(normalized))return reject('duplicate_title');titles.add(normalized);
  const item:AiItem={date:raw.date,format:raw.format as AiItem['format'],title:raw.title.trim(),headline:raw.headline.trim(),support:raw.support.trim(),caption:raw.caption.trim(),visual:raw.visual.trim()};actual[item.format]++
  if(item.format==='carousel'){
   if(!Array.isArray(raw.slides)||raw.slides.length<5||raw.slides.length>8||raw.slides.some(s=>!record(s)||!string(s.headline,100,3)||!string(s.text,180)||!string(s.visual,1500,3)))return reject('slides')
   item.slides=raw.slides.map(s=>({headline:s.headline.trim(),text:s.text.trim(),visual:s.visual.trim()}))
  }
  if(item.format==='reels'){
   if(![30,40,50].includes(Number(raw.duration))||!Array.isArray(raw.scenes)||raw.scenes.length<3||raw.scenes.length>5)return reject('scenes')
   let duration=0;const scenes:AiScene[]=[]
   for(const s of raw.scenes){if(!record(s)||!Number.isInteger(s.seconds)||Number(s.seconds)<1||Number(s.seconds)>50||!string(s.text,500,3)||!string(s.visual,1500,3)||(s.narration!==undefined&&!string(s.narration,1000))||(s.onScreen!==undefined&&!string(s.onScreen,180)))return reject('scene_content');duration+=Number(s.seconds);scenes.push({seconds:Number(s.seconds),text:s.text,visual:s.visual,...(typeof s.narration==='string'?{narration:s.narration}:{}),...(typeof s.onScreen==='string'?{onScreen:s.onScreen}:{})})}
   if(duration!==raw.duration)return reject('scene_duration');item.duration=duration;item.scenes=scenes
  }
  items.push(item)
 }
 if(actual.post!==input.formatCounts.post||actual.carousel!==input.formatCounts.carousel||actual.reels!==input.formatCounts.reels)return reject('format_counts')
 return items
}

export interface PlanningInput{clientId:string;month:string;direction:string;context:Record<string,unknown>;count:number;requiredCounts:Partial<FormatCounts>}
export interface EditorialAiPlan{total:number;formatCounts:FormatCounts;reason:string}
export function parsePlanningInput(body:Record<string,unknown>):PlanningInput|null{
 const count=body.count===undefined?12:Number(body.count);
 if(!Number.isInteger(count)||count<1||count>90)return null;
 const parsed=parseGenerationInput({...body,count:1,formatCounts:{post:1,carousel:0,reels:0}});if(!parsed)return null;
 const required=body.requiredCounts===undefined?{}:body.requiredCounts;
 if(!record(required)||Object.keys(required).some(k=>!['post','carousel','reels'].includes(k)||!Number.isInteger(required[k])||Number(required[k])<0||Number(required[k])>90)||Object.values(required).reduce((a:number,b)=>a+Number(b),0)>count)return null;
 return{...parsed,count,requiredCounts:required as Partial<FormatCounts>};
}
export function validateEditorialAiPlan(value:unknown,input:PlanningInput):EditorialAiPlan|null{
 if(!record(value)||value.total!==input.count||!record(value.formatCounts)||!string(value.reason,1500,10))return null;
 const counts=value.formatCounts;
 if(Object.keys(counts).length!==3||!['post','carousel','reels'].every(k=>Number.isInteger(counts[k])&&Number(counts[k])>=0&&Number(counts[k])<=90)||Number(counts.post)+Number(counts.carousel)+Number(counts.reels)!==input.count)return null;
 if(Object.entries(input.requiredCounts).some(([k,v])=>counts[k]!==v))return null;
 return{total:input.count,formatCounts:counts as unknown as FormatCounts,reason:value.reason.trim()};
}
