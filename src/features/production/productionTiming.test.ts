import {describe,it,expect} from 'vitest'
import {productionState,productionDate,type ProductionTiming} from './productionTiming'
const due=Date.parse('2026-10-16T10:00:00Z'),task={status:'in_progress' as const,due_date:null},timing:ProductionTiming={task_id:'test',briefing_received_at:'2026-09-01T00:00:00Z',calendar_approved_at:'2026-10-14T10:00:00Z',production_due_at:'2026-10-16T10:00:00Z',production_finished_at:null}
describe('48 elapsed hours from editorial approval',()=>{
 it('does not start the deadline from briefing or creation',()=>{expect(productionState(task,timing,due-48*3600000).remaining).toBe(48);expect(productionState(task,undefined,due).tone).toBe('unknown')})
 it('distinguishes medium, short, urgent and overdue without resetting on movement',()=>{expect(productionState(task,timing,due-30*3600000).tone).toBe('medium');expect(productionState(task,timing,due-20*3600000).tone).toBe('short');expect(productionState(task,timing,due-5*3600000).tone).toBe('urgent');expect(productionState(task,timing,due+3600000).label).toBe('Atrasada · 1h')})
 it('stops in review, retains late delivery evidence and formats agency timezone',()=>{expect(productionState({...task,status:'review'},timing,due+3600000).label).toBe('Produção em revisão');expect(productionState({...task,status:'done'},{...timing,production_finished_at:'2026-10-16T11:00:00Z'},due).tone).toBe('late');expect(productionDate('2026-10-14T10:00:00Z','America/Sao_Paulo')).toContain('07:00')})
})
