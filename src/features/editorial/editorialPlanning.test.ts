import {describe,it,expect} from 'vitest'
import {editorialBatches,explicitEditorialPlan,monthlyCommand} from './editorialPlanning'
describe('monthly strategy planning',()=>{
 it('uses the requested mix even when it is above twelve materials',()=>{
  const plan=explicitEditorialPlan('18 materiais: 10 reels, 4 posts e 4 carrosséis',12)!
  expect(plan.total).toBe(18);expect(plan.formatCounts).toEqual({post:4,reels:10,carousel:4})
  const batches=editorialBatches(plan.formatCounts)
  expect(batches).toHaveLength(5);expect(batches.every(b=>b.post+b.reels+b.carousel<=4)).toBe(true)
  expect(batches.reduce((sum,b)=>sum+b.reels,0)).toBe(10)
 })
 it('requires the AI to propose a mix when the command only gives a strategy',()=>{
  expect(explicitEditorialPlan('Priorizar vídeos curtos para apresentar a equipe e os serviços.',12)).toBeNull()
 })
 it('rejects conflicts and keeps seasonal commitments in the actual command',()=>{
  expect(()=>explicitEditorialPlan('12 materiais: 8 reels e 8 posts')).toThrow(/soma/)
  expect(monthlyCommand({objective:'',audience:'',tone:'',positioning:'',restrictions:'',monthlyDirection:'Foco nos serviços',seasonalDates:'20/11: campanha institucional'})).toContain('20/11: campanha institucional')
  expect(()=>editorialBatches({post:91,reels:0,carousel:0})).toThrow(/90/)
 })
})
