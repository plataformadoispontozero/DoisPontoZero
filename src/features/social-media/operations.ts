import type {MonthlyItem} from '@/features/editorial/monthlyPlanner'
export interface SocialCampaign {id:string;client_id:string;month:string;status:string;project_id:string|null;items:MonthlyItem[]}
export const campaignStages=[{key:'draft',label:'Planejamento'},{key:'pending',label:'Em aprovação'},{key:'changes_requested',label:'Ajustes solicitados'},{key:'approved',label:'Aprovados'},{key:'production',label:'Em produção'}] as const
export function campaignSummary(campaigns:SocialCampaign[]){return {campaigns:campaigns.length,pieces:campaigns.reduce((sum,c)=>sum+(Array.isArray(c.items)?c.items.length:0),0),pending:campaigns.filter(c=>c.status==='pending').length,adjustments:campaigns.filter(c=>c.status==='changes_requested').length}}
export function campaignLink(c:SocialCampaign){return `/editorial?${new URLSearchParams({clientId:c.client_id,campaignId:c.id})}`}
