import {describe,it,expect} from 'vitest'
import {summarizeDepartmentWorkload} from './workload'
describe('department workload from real task facts',()=>{
 it('counts only canonical active queues, overdue dates and missing assignees',()=>{
  const rows=summarizeDepartmentWorkload([
   {title:'[Design] Arte',status:'in_progress',due_date:'2026-10-20',task_assignees:[{user_id:'member'}]},
   {title:'[Videomaker] Reels',status:'open',due_date:'2026-10-22'},
   {title:'[Social Media] Copy',status:'review'},
   {title:'[Design] Concluída',status:'done'},
   {title:'[Design] Arquivada',status:'open',archived_at:'2026-10-20'},
   {title:'Outra tarefa',status:'open'},
  ],new Date(2026,9,22,12))
  expect(rows[0]).toMatchObject({pending:1,overdue:1,unassigned:0,inProgress:1})
  expect(rows[1]).toMatchObject({pending:1,overdue:0,unassigned:1})
  expect(rows[2].pending).toBe(1);expect(rows[3].pending).toBe(0)
 })
 it('marks capped queries without pretending to know the complete queue',()=>{expect(summarizeDepartmentWorkload(Array.from({length:1001},()=>({title:'[Design] Arte',status:'open'})))[0]).toMatchObject({pending:1000,limited:true})})
})
