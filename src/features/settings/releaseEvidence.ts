import release from '../../../docs/RELEASE_STATUS.json'
import technicalReport from '../../../docs/PLATFORM_HOMOLOGATION_STATUS.json'
export {release}
export interface TechnicalPhase {id:string;status:string;unit_tests?:number;browser_tests?:number;evidence?:string}
export interface TechnicalReport {scope:string;status:string;phases:TechnicalPhase[]}
export interface ReleasePhase {id:string;status?:string;historical_claims?:string[];completed_requirements?:string[];pending_requirements?:string[];stage?:string;last_verified_at?:string;evidence?:string;technical_homologation?:TechnicalPhase}
export function reconcileReleasePhases(phases:ReleasePhase[],report:TechnicalReport=technicalReport):ReleasePhase[]{
 return phases.map(phase=>{
  const deliveries=release.deliveries.filter(delivery=>delivery.phases.includes(phase.id))
  const pending=[...new Set([...(phase.pending_requirements||[]),...deliveries.flatMap(delivery=>delivery.pending)])]
  const technical=report.scope==='controlled_technical_homologation'&&report.status==='verified'?report.phases.find(p=>p.id===phase.id&&p.status==='verified'&&(p.unit_tests||0)>0&&(p.browser_tests||0)>0&&!!p.evidence):undefined
  if(!deliveries.length&&!technical)return phase
  return {...phase,status:pending.length?'in_progress':technical?'completed':phase.status||'in_progress',stage:technical?'Homologação técnica controlada concluída · critérios reais abaixo':'Publicado · validação operacional pendente',last_verified_at:release.verified_at,evidence:technical?.evidence||release.evidence,technical_homologation:technical,completed_requirements:[...new Set([...(phase.completed_requirements||[]),...deliveries.map(delivery=>delivery.result)])],historical_claims:[...new Set([...(phase.historical_claims||[]),...deliveries.map(delivery=>delivery.result)])],pending_requirements:pending}
 })
}
export function releaseDeliveryLabel(delivery:{pending:string[];technical_status?:string}){return delivery.pending.length?(delivery.technical_status==='verified'?'Homologação técnica controlada concluída · validação real pendente':'Publicado · validação complementar pendente'):'Implementado, testado e publicado'}
