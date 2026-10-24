import {describe,it,expect} from 'vitest'
import {nextPresentationPeriod,reusablePresentation} from './presentationReuse'
import type {Presentation} from '@/types/presentations'

const source:Presentation={id:'old',agency_id:'agency',client_id:'client',title:'Campanha',period_month:12,period_year:2026,status:'published',public_token:'old-public-link',published_at:'2026-12-01',created_at:'',updated_at:'',sections:[{id:'old-section',agency_id:'agency',presentation_id:'old',section_type:'gallery',title:'Entregas',position:0,content:{text:'Direção criativa',images:[{src:'https://example.com/old.png'}],list:['Objetivo',12]},created_at:'',updated_at:''}],assets:[{id:'old-art',agency_id:'agency',presentation_id:'old',title:'Arte anterior',position:0,created_at:''}]}
describe('reaproveitamento mensal',()=>{
 it('avança dezembro para janeiro do ano seguinte',()=>expect(nextPresentationPeriod(12,2026)).toEqual({month:1,year:2027}))
 it('copia estrutura e texto sem identidade, mídia, publicação ou aprovação anterior',()=>{
  const payload=reusablePresentation(source,1,2027,' Novo ciclo ')
  expect(payload).toMatchObject({title:'Novo ciclo',client_id:'client',period_month:1,period_year:2027,sections_snapshot:[{title:'Entregas',content:{text:'Direção criativa',list:['Objetivo']}}]})
  expect(payload).not.toHaveProperty('id');expect(payload).not.toHaveProperty('public_token');expect(payload).not.toHaveProperty('assets');expect(payload.sections_snapshot[0]).not.toHaveProperty('id');expect(payload.sections_snapshot[0].content).not.toHaveProperty('images')
  expect(source.sections?.[0].content.images).toHaveLength(1)
 })
 it('rejeita período e título inválidos',()=>{expect(()=>reusablePresentation(source,13,2027,'Novo')).toThrow();expect(()=>reusablePresentation(source,1,2027,' ')).toThrow()})
})
