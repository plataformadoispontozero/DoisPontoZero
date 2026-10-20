import {useState} from 'react'
import {Button} from '@/components/ui/Button'
import {Select} from '@/components/ui/Select'
import type {PresentationSection,PresentationSectionType} from '@/types/presentations'

export function PresentationSectionEditor({section,onSave}:{section:PresentationSection;onSave:(updates:Partial<PresentationSection>)=>Promise<void>}){
 const [layout,setLayout]=useState(section.content?.media_layout||'grid'),[title,setTitle]=useState(section.title),[description,setDescription]=useState(section.description||''),[type,setType]=useState(section.section_type),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false)
 const dirty=layout!==(section.content?.media_layout||'grid')||title!==section.title||description!==(section.description||'')||type!==section.section_type
 async function save(){if(!title.trim()||busy)return;setBusy(true);setError('');setSaved(false);try{await onSave({title:title.trim(),description,section_type:type,content:{...section.content,media_layout:layout}});setSaved(true)}catch(e){setError(e&&typeof e==='object'&&'message'in e?String(e.message):'Não foi possível salvar a seção. Tente novamente.')}finally{setBusy(false)}}
 return <form className="space-y-4" onSubmit={e=>{e.preventDefault();void save()}}>
  <label className="block space-y-2 text-sm">Título da seção<input required maxLength={300} className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white focus:border-orange-500 focus:outline-none" value={title} onChange={e=>{setTitle(e.target.value);setSaved(false)}}/></label>
  <label className="block space-y-2 text-sm">Tipo de layout<Select style={{colorScheme:'dark'}} value={type==='gallery'&&layout==='carousel'?'carousel':['gallery','video'].includes(type)?type:''} onChange={e=>{const value=e.target.value;setType((value==='carousel'?'gallery':value) as PresentationSectionType);setLayout(value==='carousel'?'carousel':'grid');setSaved(false)}}><option value="" disabled>Selecione Post, Reels ou Carrossel</option>{[{type:'gallery',label:'Post'},{type:'carousel',label:'Carrossel'},{type:'video',label:'Reels'}].map(t=><option key={t.type} value={t.type}>{t.label}</option>)}</Select></label>
  {type==='gallery'&&<p className="text-xs text-zinc-400">{layout==='carousel'?'Lâminas em ordem numérica, com setas e arraste lateral.':'Posts individuais em grade.'}</p>}
  <label className="block space-y-2 text-sm">Contexto criativo / texto explicativo<textarea rows={6} maxLength={20000} className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white focus:border-orange-500 focus:outline-none" value={description} placeholder="Explique a ideia, as escolhas visuais e o que foi entregue." onChange={e=>{setDescription(e.target.value);setSaved(false)}}/></label>
  {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
  <div className="flex flex-wrap items-center gap-3"><Button type="submit" loading={busy} disabled={!dirty||!title.trim()}>Salvar seção</Button><p role="status" className="text-xs text-zinc-400">{saved?'Seção salva.':dirty?'Alterações ainda não salvas.':'Edite o texto e salve quando estiver pronto.'}</p></div>
 </form>
}
