import {ClientAssignmentsTab} from './ClientAssignmentsTab';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ExternalLink, Pencil, CalendarDays, FileText, ArrowRight, MessageCircle, User } from 'lucide-react';
import { useAgencyId, usePermission } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/Toast';
import { useUpdateClient } from '../hooks/useClients';
import { PROFILE_FIELDS } from '../profileFields';
import { readClientProfile, validateClientProfile, type ClientProfile } from '../clientProfile';
import { ClientBriefingsTab } from './ClientBriefingsTab';
import { ClientPresentationsTab } from './ClientPresentationsTab';
import { ClientLegacyPanel } from './ClientLegacyPanel';
import { ClientDrivePanel } from '@/features/integrations/ClientDrivePanel';
import type { Client } from '@/types/projects';

function safeLink(value: unknown) {
 if(typeof value!=='string')return undefined;
 try { const url=new URL(value); return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password ? url.href:undefined; } catch { return undefined; }
}
const actionStyle='rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium hover:border-orange-500 hover:bg-orange-500/10 focus-visible:outline-orange-400';
export function ClientHubModal({client,onClose}:{client:Client;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null), navigate=useNavigate(), agency=useAgencyId();
 const canEdit=usePermission('clients.edit'),canStrategy=usePermission('strategy.view'),canBriefs=usePermission('briefings.view');
 const canPresentations=usePermission('presentations.view');
 const update=useUpdateClient(agency);
 const [section,setSection]=useState('Visão geral'),[editing,setEditing]=useState(false);
 const [draft,setDraft]=useState<ClientProfile>(()=>readClientProfile(client.profile));
 const [logo,setLogo]=useState(client.logo_url||'');
 const profile=readClientProfile(client.profile);
 const campaigns=useQuery({queryKey:['client-profile-campaigns',agency,client.id],enabled:!!supabase&&canStrategy,queryFn:async()=>{
  const {data,error}=await supabase!.from('monthly_editorial_campaigns').select('id,month,status').eq('agency_id',agency).eq('client_id',client.id).order('created_at',{ascending:false}).limit(100);
  if(error)throw error;return data as {id:string;month:string;status:string}[];
 }});
 const contacts=useQuery({queryKey:['client-briefing-contacts',agency,client.id],enabled:!!supabase&&Boolean(agency&&client.id),queryFn:async()=>{
  const {data,error}=await supabase!.from('briefings').select('id,answers:briefing_answers(question:briefing_questions(question_key),answer_value)').eq('agency_id',agency).eq('client_id',client.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error||!data)return null;
  const map:Record<string,string>={};
  for(const ans of (data.answers as {question?:{question_key?:string}|null;answer_value:unknown}[]||[])){
   const key=ans.question?.question_key;
   if(key&&ans.answer_value!==null&&ans.answer_value!==undefined){
    map[key]=typeof ans.answer_value==='string'?ans.answer_value:JSON.stringify(ans.answer_value);
   }
  }
  return {
   responsavel:map['responsavel_cliente']||null,
   whatsapp:map['contato_whatsapp']||null,
   horario:map['melhor_horario_contato']||null,
   reuniao:map['dia_reuniao_mensal']||null,
  };
 }});
 useEffect(()=>{
  const element=dialog.current;if(!element)return;
  element.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=old;};
 },[]);
 async function save(){
  const errors=validateClientProfile(draft);
  if(errors.length){toast.error(errors[0]);return;}
  if(logo&&!safeLink(logo)){toast.error('Use um link HTTP ou HTTPS válido para o logotipo.');return;}
  try {await update.mutateAsync({id:client.id,profile:draft,logo_url:logo||null});setEditing(false);toast.success('Dados do cliente atualizados.');}catch{toast.error('Não foi possível salvar. Verifique a conexão e sua permissão nesta agência.');}
 }
 const display=(key:string)=>{const value=(profile as Record<string,unknown>)[key];return value===undefined||value===''?'Não informado':String(value);};
 return createPortal(<dialog ref={dialog} aria-labelledby="client-hub-title" onCancel={e=>{e.preventDefault();onClose();}} className="fixed inset-0 m-auto h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[1480px] overflow-hidden rounded-2xl border border-white/15 bg-[#111115] p-0 text-white shadow-2xl backdrop:bg-black/80 md:h-[calc(100dvh-3rem)] md:w-[calc(100vw-3rem)]">
 <div className="flex h-full flex-col">
  <header className="shrink-0 border-b border-white/10 bg-gradient-to-r from-[#1a191c] to-orange-950/30 p-4 md:p-6">
   <div className="flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-center gap-4">
     <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-xl font-bold text-orange-400">
      {safeLink(client.logo_url)?<img src={safeLink(client.logo_url)} alt="" className="h-full w-full object-contain p-2"/>:client.name.slice(0,2).toUpperCase()}
     </div>
     <div className="min-w-0"><p className="text-xs text-orange-300">FICHA DO CLIENTE · {client.status==='active'?'Ativo':client.status==='inactive'?'Inativo':'Arquivado'}</p><h2 id="client-hub-title" className="mt-1 break-words text-xl font-bold md:text-3xl">{client.name}</h2><p className="mt-1 text-sm text-zinc-300">{[profile.niche,profile.city].filter(Boolean).join(' · ')||'Complete os dados da marca para orientar a equipe.'}</p></div>
    </div>
    <button aria-label="Fechar ficha do cliente" onClick={onClose} className="shrink-0 rounded-lg p-2 hover:bg-white/10"><X/></button>
   </div>
   <div className="mt-4 flex flex-wrap gap-2">
    {canBriefs&&section!=='Briefings'&&<button className={actionStyle} onClick={()=>{setSection('Briefings');setEditing(false);}}><FileText className="mr-2 inline h-4 w-4"/>Briefings</button>}
    {canEdit&&<button className={actionStyle} onClick={()=>{setDraft(profile);setLogo(client.logo_url||'');setSection('Dados e links');setEditing(true);}}><Pencil className="mr-2 inline h-4 w-4"/>Editar ficha</button>}
    {canStrategy&&<button className="rounded-lg bg-[#c84408] px-4 py-2.5 text-sm font-semibold hover:bg-orange-600" onClick={()=>navigate(`/editorial/new?clientId=${client.id}`)}><CalendarDays className="mr-2 inline h-4 w-4"/>Gerar calendário</button>}
    <button className={actionStyle} onClick={()=>navigate(`/clients/${client.id}/workspace`)}>Abrir jornada <ArrowRight className="ml-2 inline h-4 w-4"/></button>
   </div>
  </header>
  <div className="flex min-h-0 flex-1 flex-col md:flex-row">
   <nav aria-label="Seções da ficha do cliente" className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 p-3 md:w-52 md:flex-col md:border-b-0 md:border-r">
    {['Visão geral','Dados e links','Atribuições','Arquivos no Drive','Histórico',...(canBriefs?['Briefings']:[]),...(canStrategy?['Calendário']:[]),...(canPresentations?['Apresentações']:[])].map(item=><button key={item} aria-current={section===item?'page':undefined} className={`shrink-0 rounded-lg px-4 py-3 text-left text-sm ${section===item?'bg-orange-500/15 text-orange-300':'text-zinc-300 hover:bg-white/5'}`} onClick={()=>{setSection(item);setEditing(false);}}>{item}</button>)}
   </nav>
   <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
    {section==='Atribuições'&&<ClientAssignmentsTab clientId={client.id} agencyId={agency} canEdit={canEdit}/>}
    {section==='Histórico'&&<ClientLegacyPanel clientId={client.id}/>}
    {section==='Arquivos no Drive'&&<ClientDrivePanel clientId={client.id}/>}
    {section==='Briefings'&&<ClientBriefingsTab clientId={client.id} agencyId={agency}/>}
    {section==='Apresentações'&&<ClientPresentationsTab clientId={client.id} clientName={client.name}/>}
    {section==='Calendário'&&<div className="space-y-4"><h3 className="text-xl font-semibold">Calendários do cliente</h3>{campaigns.isError?<p role="alert">Não foi possível carregar os calendários.</p>:campaigns.isPending?<p>Carregando calendários…</p>:!campaigns.data?.length?<p className="text-zinc-300">Nenhum calendário cadastrado nesta plataforma.</p>:campaigns.data.map(c=><button key={c.id} className={`${actionStyle} block w-full text-left`} onClick={()=>navigate(`/editorial?clientId=${client.id}&campaignId=${c.id}`)}>{c.month} · {c.status} <ExternalLink className="ml-2 inline h-4 w-4"/></button>)}<ClientLegacyPanel clientId={client.id} sourceKinds={['calendarios']}/></div>}
    {(section==='Visão geral'||section==='Dados e links')&&<>
     <div className="mb-5 grid grid-cols-2 gap-3">{[['Calendários',canStrategy?(campaigns.isError?'Indisponível':campaigns.data?.length??'…'):'Sem acesso'],['Conteúdos por mês',display('monthly_content_count')]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-zinc-400">{label}</p><p className="mt-2 break-words font-semibold">{value}</p></div>)}</div>
     {section==='Visão geral'&&<section aria-label="Resumo para a equipe" className="space-y-4"><div className="grid gap-4 lg:grid-cols-2">{[['Objetivo do mês','monthly_objective'],['Público-alvo','target_audience'],['Posicionamento','positioning'],['Tom de comunicação','tone']].map(([label,key])=><article key={key} className="rounded-xl border border-white/10 bg-white/[0.025] p-5"><h3 className="text-xs font-medium text-orange-300">{label}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{display(key)}</p></article>)}</div><p className="text-sm text-zinc-400">Consulte Dados e links para a ficha completa. Use as seções ao lado para briefings, arquivos, calendários e aprovações.</p><button className={actionStyle} onClick={()=>setSection('Dados e links')}>Ver ficha completa</button></section>}
     {section==='Dados e links'&&<div className="grid gap-4 lg:grid-cols-2">{['Negócio','Audiência','Posicionamento','Direção editorial','Links',...(section==='Dados e links'?['Origem']:[])].map(group=><section key={group} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-5"><h3 className="mb-4 text-sm font-semibold text-orange-300">{group}</h3><div className="space-y-4">{PROFILE_FIELDS.filter(f=>f.section===group).map(field=>{const value=display(field.key);const link=field.key==='instagram'?safeLink(value)||(value.startsWith('@')?`https://www.instagram.com/${encodeURIComponent(value.slice(1))}/`:undefined):safeLink(value);return <div key={field.key}><label htmlFor={`profile-${field.key}`} className="mb-1 block text-xs text-zinc-400">{field.label}</label>{editing&&group!=='Origem'?<textarea id={`profile-${field.key}`} aria-label={field.label} rows={['target_audience','positioning','differential','structure'].includes(field.key)?3:1} className="w-full rounded-lg border border-white/15 bg-[#15151b] p-2 text-sm text-white focus:border-orange-500 focus:outline-none" value={(draft as Record<string,unknown>)[field.key]===undefined?'':String((draft as Record<string,unknown>)[field.key])} onChange={e=>setDraft(old=>{const next={...old} as Record<string,unknown>;if(!e.target.value)delete next[field.key];else next[field.key]=['average_ticket','monthly_content_count'].includes(field.key)?Number(e.target.value.replace(',','.')):e.target.value;return next as ClientProfile;})}/>:link&&group==='Links'?<a href={link} target="_blank" rel="noreferrer" className="break-all text-sm text-orange-200 underline">Abrir {field.label}<ExternalLink className="ml-1 inline h-3 w-3"/></a>:<p className="whitespace-pre-wrap break-words text-sm text-zinc-100">{value}</p>}</div>;})}{group==='Links'&&<div><label htmlFor="profile-logo" className="mb-1 block text-xs text-zinc-400">Link do logotipo</label>{editing?<input id="profile-logo" aria-label="Link do logotipo" value={logo} onChange={e=>setLogo(e.target.value)} className="w-full rounded-lg border border-white/15 bg-[#15151b] p-2 text-sm"/>:safeLink(client.logo_url)?<a href={safeLink(client.logo_url)} className="text-sm text-orange-200 underline" target="_blank" rel="noreferrer">Abrir logotipo</a>:<p className="text-sm">Não informado</p>}</div>}</div></section>)}</div>}
     {editing&&<div className="sticky bottom-0 mt-5 flex gap-3 rounded-xl border border-orange-500/25 bg-[#19191e] p-4"><button className="rounded-lg bg-[#c84408] px-5 py-3 font-semibold disabled:opacity-50" disabled={update.isPending} onClick={()=>void save()}>{update.isPending?'Salvando…':'Salvar dados do cliente'}</button><button disabled={update.isPending} className={actionStyle} onClick={()=>setEditing(false)}>Cancelar</button></div>}
    </>}
   </main>
  </div>
 </div>
 </dialog>,document.body);
}
