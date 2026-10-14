import {it,expect} from 'vitest'
import {release,reconcileReleasePhases} from './releaseEvidence'
it('shows delivered evidence without completing phases that still require operational acceptance',()=>{
 const phases=reconcileReleasePhases([{id:'phase-04',status:'completed',historical_claims:['Previous audit']},{id:'phase-09',status:'completed'},{id:'phase-05',status:'in_progress'}])
 expect(phases[0].status).toBe('in_progress');expect(phases[0].pending_requirements?.length).toBeGreaterThan(0);expect(phases[1].pending_requirements?.join(' ')).toContain('ads_read');expect(phases[2]).toEqual({id:'phase-05',status:'in_progress'});expect(release.deliveries.some(d=>d.title.toLowerCase().includes('proposta'))).toBe(false)
})
