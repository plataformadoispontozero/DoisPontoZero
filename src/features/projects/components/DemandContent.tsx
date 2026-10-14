import {useLayoutEffect,useRef,useState} from 'react';
import {PencilLine,Check} from 'lucide-react';
import {parseDemandContent} from './parseDemandContent';
export function DemandContent({value,title='',onChange,onSave}:{value:string;title?:string;onChange?:(value:string)=>void;onSave?:()=>void}) {
 const [editing,setEditing]=useState(false);
 const editor=useRef<HTMLTextAreaElement>(null);
 const parsed=parseDemandContent(value,title);
 useLayoutEffect(()=>{const field=editor.current;if(!field)return;field.style.height='auto';field.style.height=`${Math.max(420,field.scrollHeight)}px`;},[value,editing]);
 const count=parsed.blocks.filter(b=>b.kind==='slide'||b.kind==='scene').length;
 return <section aria-label="Conteúdo da demanda" className="space-y-4 rounded-2xl border border-white/10 bg-[#14141A] p-4 sm:p-6">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-[#F8F9FC]">Conteúdo da demanda</h2><p className="mt-1 text-sm text-zinc-400">Copy, roteiro e orientação para produzir a peça.</p></div><div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-200">{parsed.kind}{count>0?` · ${count} ${parsed.kind==='Carrossel'?'lâminas':'cenas'}`:''}</span>{onChange&&<button type="button" onClick={()=>setEditing(!editing)} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:border-orange-400">{editing?<Check size={15}/>:<PencilLine size={15}/>} {editing?'Concluir edição':'Editar conteúdo'}</button>}</div></div>
  {editing?<div className="space-y-2"><label htmlFor="demand-description" className="block text-sm text-zinc-300">Texto completo da demanda</label><textarea id="demand-description" ref={editor} value={value} onChange={event=>onChange?.(event.target.value)} onBlur={onSave} rows={16} className="w-full min-h-[420px] resize-y rounded-xl border border-white/20 bg-[#19191f] p-4 text-base leading-7 text-white focus:border-orange-500 focus:outline-none" placeholder="Escreva a copy, o roteiro e a direção visual…"/><p className="text-xs text-zinc-400">As alterações são salvas ao sair do campo. Nenhum trecho do texto é cortado.</p></div>:<div className="space-y-4">
   {parsed.intro&&<article className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">{parsed.kind==='Carrossel'?'Legenda e contexto':parsed.kind==='Post'?'Conteúdo do post':'Contexto e orientações'}</h3><p className="whitespace-pre-wrap break-words text-base leading-7 text-zinc-100">{parsed.intro}</p></article>}
   {parsed.blocks.map((block,index)=><article key={index} className={`rounded-xl border p-4 sm:p-5 ${block.kind==='slide'||block.kind==='scene'?'border-orange-500/20 bg-orange-500/[0.04]':'border-white/10 bg-white/[0.02]'}`}><h3 className="mb-3 text-sm font-semibold text-orange-200">{block.label}</h3><p className="whitespace-pre-wrap break-words text-base leading-7 text-zinc-100">{block.body||'Sem texto neste bloco.'}</p></article>)}
   {!value.trim()&&<p className="text-sm text-zinc-400">Nenhum conteúdo informado. Adicione a copy, o roteiro ou as orientações desta demanda.</p>}
  </div>}
 </section>;
}
