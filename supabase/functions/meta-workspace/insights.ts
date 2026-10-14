export const INSIGHT_PERIODS = ['last_7d','last_30d','last_90d'] as const
export function insightPeriod(value: unknown) {
 if(value===undefined)return 'last_30d'
 if(!INSIGHT_PERIODS.includes(value as typeof INSIGHT_PERIODS[number]))throw Error('Período inválido')
 return value as typeof INSIGHT_PERIODS[number]
}
export function insightParameters(period: string,level:'account'|'campaign') {
 return {date_preset:period,level,limit:'100',fields:`${level==='campaign'?'campaign_id,campaign_name,':''}account_currency,date_start,date_stop,spend,impressions,reach,clicks,cpc,ctr,cpm,frequency,actions`}
}
