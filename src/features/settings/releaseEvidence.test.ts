import {it,expect} from 'vitest'
import {release,reconcileReleasePhases} from './releaseEvidence'
it('shows delivered evidence without completing phases that still require operational acceptance',()=>{
 const phases=reconcileReleasePhases([{id:'phase-04',status:'completed',historical_claims:['Previous audit']},{id:'phase-09',status:'completed'},{id:'phase-05',status:'in_progress'}])
 expect(phases[0].status).toBe('in_progress');expect(phases[0].pending_requirements?.length).toBeGreaterThan(0);expect(phases[1].pending_requirements?.join(' ')).toContain('ads_read');expect(phases[2].completed_requirements?.join(' ')).toContain('Rotina privada por hora');expect(release.deliveries.some(d=>d.title.toLowerCase().includes('proposta'))).toBe(false)
})

it('preserves other phase acceptance criteria when a new delivery is added',()=>{const [phase]=reconcileReleasePhases([{id:'phase-05',pending_requirements:['Upload de avatar com membro real'],completed_requirements:['Perfil individual']}]);expect(phase.pending_requirements).toContain('Upload de avatar com membro real');expect(phase.completed_requirements).toContain('Perfil individual')})
