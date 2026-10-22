import {describe,it,expect} from 'vitest'
import {officialBriefingTemplates} from './officialCatalog'
import {INITIAL_BRIEFING_TEMPLATES} from '../constants/initialTemplates'
describe('six briefing service models',()=>{
 it('hides historical/custom/test models and picks one current published version per service',()=>{
  const templates=[{id:'test',category:'social_media',name:'Aurora — MODELO DE TESTE',version:99,status:'published'}, {id:'legacy',category:'custom',name:'Briefing histórico migrado',version:1,status:'published'}, {id:'draft',category:'social_media',name:'Social Media',version:3,status:'draft'}, {id:'official',category:'social_media',name:'Social Media',version:2,status:'published'}, {id:'archived',category:'branding',name:'Branding antigo',version:1,status:'archived'}] as any
  expect(officialBriefingTemplates(templates).map(t=>t.id)).toEqual(['official'])
  expect(templates).toHaveLength(5)
 })
 it('collects approved facts and visual direction without duplicating question keys',()=>{
  expect(INITIAL_BRIEFING_TEMPLATES).toHaveLength(6)
  for(const template of INITIAL_BRIEFING_TEMPLATES){const keys=template.sections.flatMap(s=>s.questions.map(q=>q.question_key));expect(keys).toEqual(expect.arrayContaining(['fatos_aprovados','termos_proibidos','temas_evitar','direcao_visual']));expect(new Set(keys).size).toBe(keys.length)}
 })
})
