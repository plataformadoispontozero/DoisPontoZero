import type {Task} from '@/types/projects'
export interface ProductionTiming {task_id:string;briefing_received_at:string|null;calendar_approved_at:string|null;production_due_at:string|null;production_finished_at:string|null}
export const PRODUCTION_HOURS=48
export function productionState(task:Pick<Task,'status'|'due_date'>,timing:ProductionTiming|undefined,now=Date.now()){
 const due=timing?.production_due_at?Date.parse(timing.production_due_at):NaN
 const finished=timing?.production_finished_at?Date.parse(timing.production_finished_at):NaN
 if(task.status==='review'||task.status==='done')return {label:Number.isFinite(due)&&Number.isFinite(finished)&&finished>due?'Produção entregue com atraso':task.status==='review'?'Produção em revisão':'Concluída',tone:Number.isFinite(due)&&Number.isFinite(finished)&&finished>due?'late':'done',remaining:null}
 if(!Number.isFinite(due))return {label:'Aprovação sem data registrada',tone:'unknown',remaining:null}
 const remaining=(due-now)/3600000
 return {label:remaining<=0?`Atrasada · ${Math.ceil(-remaining)}h`:remaining<=6?`Prazo urgente · ${Math.ceil(remaining)}h`:remaining<=24?`Curto prazo · ${Math.ceil(remaining)}h`:`Médio prazo · ${Math.ceil(remaining)}h`,tone:remaining<=0?'late':remaining<=6?'urgent':remaining<=24?'short':'medium',remaining}
}
export function productionDate(value:string|null|undefined,zone='America/Sao_Paulo'){if(!value||!Number.isFinite(Date.parse(value)))return 'Não registrado';return new Intl.DateTimeFormat('pt-BR',{timeZone:zone,dateStyle:'short',timeStyle:'short'}).format(new Date(value))}
