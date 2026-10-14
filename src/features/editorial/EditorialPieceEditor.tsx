import {defaultPhotography} from '@/features/production/photographicDirection';
import {PhotographyDirectionFields} from '@/features/production/PhotographyDirectionFields';
import type { MonthlyItem } from './monthlyPlanner';
import { renderEditorialCopy, renderProductionDirection } from './campaignEngine';
export function EditorialPieceEditor({item,disabled,onChange}:{item:MonthlyItem;disabled:boolean;onChange:(item:MonthlyItem)=>void}){
 const trace=item.editorial;
 const style='mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 p-3 text-sm';
 function update(next:NonNullable<MonthlyItem['editorial']>){const changed={...item,editorial:{...next,humanEdited:true}};changed.editorial.visual=renderProductionDirection(changed);changed.copy=renderEditorialCopy(changed);onChange(changed);}
 function field(label:string,value:string,change:(value:string)=>void,rows=3){return <label className="block text-sm">{label}<textarea aria-label={label} className={style} rows={rows} value={value} disabled={disabled} onChange={e=>change(e.target.value)}/></label>;}
 if(!trace||(!trace.slides?.length&&!trace.scenes?.length&&!trace.postConcept))return <div className="space-y-3">{field('Copy completa',item.copy,copy=>onChange({...item,copy,editorial:trace?{...trace,humanEdited:true}:undefined}))}{trace&&<>{field('Direção visual geral',trace.visual,visual=>onChange({...item,editorial:{...trace,visual,humanEdited:true}}))}<PhotographyDirectionFields value={trace.photography||defaultPhotography(false)} copy={item.title} disabled={disabled} onChange={photography=>update({...trace,photography})}/></>}</div>;
 return <div className="space-y-5">
 {trace.slides?.map((slide,i)=><section key={i} className="space-y-3 rounded-xl border border-white/10 p-4"><h3 className="font-semibold text-orange-300">Lâmina {i+1}</h3>{field(`Título da lâmina ${i+1}`,slide.headline||'',headline=>update({...trace,slides:trace.slides!.map((s,n)=>n===i?{...s,headline}:s)}),2)}{field(`Texto da lâmina ${i+1}`,slide.text,text=>update({...trace,slides:trace.slides!.map((s,n)=>n===i?{...s,text}:s)}))}{field(`Direção visual da lâmina ${i+1}`,slide.visual,visual=>update({...trace,slides:trace.slides!.map((s,n)=>n===i?{...s,visual}:s)}))}</section>)}
 {trace.scenes?.map((scene,i)=><section key={i} className="space-y-3 rounded-xl border border-white/10 p-4"><h3 className="font-semibold text-orange-300">Cena {i+1} · {scene.seconds}s</h3>{field(`Fala da cena ${i+1}`,scene.text,text=>update({...trace,scenes:trace.scenes!.map((s,n)=>n===i?{...s,text,narration:text}:s)}))}{field(`Texto na tela da cena ${i+1}`,scene.onScreen||'',onScreen=>update({...trace,scenes:trace.scenes!.map((s,n)=>n===i?{...s,onScreen}:s)}),2)}{field(`Visual da cena ${i+1}`,scene.visual,visual=>update({...trace,scenes:trace.scenes!.map((s,n)=>n===i?{...s,visual}:s)}))}{field(`Câmera da cena ${i+1}`,scene.camera||'',camera=>update({...trace,scenes:trace.scenes!.map((s,n)=>n===i?{...s,camera}:s)}),2)}{field(`Áudio da cena ${i+1}`,scene.audio||'',audio=>update({...trace,scenes:trace.scenes!.map((s,n)=>n===i?{...s,audio}:s)}),2)}</section>)}
 {trace.postConcept&&<section className="space-y-3">{field('Headline do post',trace.postConcept.headline,headline=>update({...trace,postConcept:{...trace.postConcept!,headline}}),2)}{field('Texto de apoio do post',trace.postConcept.support,support=>update({...trace,postConcept:{...trace.postConcept!,support}}))}{field('Composição do post',trace.postConcept.composition,composition=>update({...trace,postConcept:{...trace.postConcept!,composition}}))}</section>}
 {field('CTA',trace.cta,cta=>update({...trace,cta}),2)}
 {field('Hashtags',trace.hashtags||'',hashtags=>update({...trace,hashtags}),2)}
 {field('Ângulo criativo',trace.angle,angle=>update({...trace,angle}),2)}
 {field('Legenda completa',trace.postConcept?.caption||trace.caption||item.copy,caption=>update({...trace,caption,postConcept:trace.postConcept?{...trace.postConcept,caption}:undefined}),5)}
 <PhotographyDirectionFields value={trace.photography||defaultPhotography(false)} copy={trace.postConcept?.headline||item.title} disabled={disabled} onChange={photography=>update({...trace,photography})}/>
 {field('Direção visual geral',trace.visual.split('\nRoteiro técnico:')[0].split('\nDireção fotográfica:\n')[0],visual=>update({...trace,visual}))}
 <details><summary className="cursor-pointer">Copy completa para aprovação</summary><p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">{item.copy}</p></details>
 </div>;
}
