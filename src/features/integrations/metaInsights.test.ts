import {it,expect} from 'vitest'
import {insightPeriod,insightParameters} from '../../../supabase/functions/meta-workspace/insights'
it('accepts only supported periods and requests campaign identities separately from deduplicated account totals',()=>{
 expect(insightPeriod(undefined)).toBe('last_30d');for(const period of ['last_7d','last_30d','last_90d'])expect(insightPeriod(period)).toBe(period);for(const invalid of ['all','../../me',{},null])expect(()=>insightPeriod(invalid)).toThrow(/inválido/)
 expect(insightParameters('last_7d','campaign').fields).toContain('campaign_id,campaign_name');expect(insightParameters('last_7d','account').fields).not.toContain('campaign_id');expect(insightParameters('last_7d','account').fields).toContain('account_currency')
})
