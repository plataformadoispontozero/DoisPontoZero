import type { ClientProfile } from '../clients/clientProfile';
import type { EditorialContext } from './monthlyPlanner';
import type { HistoryEntry, PillarInput } from './campaignEngine';
export interface SuggestedTopic { text: string; source: string }
export interface LegacyEditorialSource { id: string; payload: Record<string, unknown> }
const text = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 500) : '';
export function suggestEditorialTopics(profile: ClientProfile, briefs: LegacyEditorialSource[], strategies: LegacyEditorialSource[]): SuggestedTopic[] {
 const suggestions: SuggestedTopic[] = [];
 const add = (value: unknown, source: string) => { const candidate = text(value); if(candidate && !suggestions.some(s=>s.text.toLocaleLowerCase()===candidate.toLocaleLowerCase())) suggestions.push({text:candidate,source}); };
 const latestStrategy = strategies[0];
 if(latestStrategy){ const summary=latestStrategy.payload.resumo_extraido; if(summary&&typeof summary==='object'&&!Array.isArray(summary)) {const s=summary as Record<string,unknown>;add(s.foco_q1,'Foco da primeira quinzena da estratégia histórica');add(s.foco_q2,'Foco da segunda quinzena da estratégia histórica');} }
 const latestBrief=briefs[0];
 if(latestBrief){ for(const key of ['produtos_servicos','dores_principais','objecoes_comuns']){const v=text(latestBrief.payload[key]);if(v)add(`${key==='produtos_servicos'?'Entenda os serviços':key==='dores_principais'?'Orientações sobre':'Dúvidas sobre'}: ${v}`,'Sugestão baseada no briefing histórico');} }
 const niche=text(profile.niche);
 if(niche){add(`Como escolher serviços de ${niche}`,'Sugestão baseada no nicho do cadastro');add(`Dúvidas frequentes sobre ${niche}`,'Sugestão baseada no nicho do cadastro');}
 const positioning=text(profile.positioning||profile.differential);
 if(positioning)add(`O que considerar sobre ${positioning}`,'Sugestão baseada no posicionamento do cadastro');
 return suggestions.slice(0,8);
}
export function missingEditorialInputs(context: EditorialContext, pillars: PillarInput[]): string[] {
 const missing:string[]=[];
 if(!context.objective.trim())missing.push('objetivo do mês');
 if(!context.audience.trim())missing.push('público-alvo');
 if(!context.topics?.some(t=>t.trim())&&!pillars.some(p=>p.percentage>0&&p.example_topics.some(t=>t.trim())))missing.push('temas revisados do mês ou pilares com temas');
 return missing;
}

export function legacyCalendarHistory(clientId:string, records:LegacyEditorialSource[]):HistoryEntry[] {
 return records.flatMap(record=>{
  const pieces=record.payload.conteudo_estruturado;
  if(!Array.isArray(pieces))return [];
  return pieces.flatMap((piece,index)=>{
   if(!piece||typeof piece!=='object')return [];
   const value=piece as Record<string,unknown>;
   // Only structured original themes/titles are used; narrative blobs are not interpreted as approved facts.
   const titles=[text(value.tema),text(value.headline)].filter(Boolean);
   return [...new Set(titles)].map(title=>({clientId,campaignId:`legacy:${record.id}:${index}`,state:'historical',item:{date:'',format:'post' as const,title,copy:''}}));
  });
 });
}
