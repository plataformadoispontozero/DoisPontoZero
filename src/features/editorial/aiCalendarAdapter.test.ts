import {describe,it,expect} from 'vitest'
import {adaptAiCalendar,type AiCalendarResult} from './aiCalendarAdapter'
const context={objective:'Informar',audience:'Clientes',tone:'Direto',positioning:'Atendimento',restrictions:''}
const result=():AiCalendarResult=>({provider:'gemini',model:'configured-model',requiresReview:true,items:[{date:'2026-11-03',format:'post',title:'Planejamento',headline:'Planeje o próximo passo',support:'Confira os pontos essenciais.',caption:'Leia as informações aprovadas para organizar seu planejamento e esclarecer dúvidas com a equipe.',visual:'Título legível e espaço em branco.'}]})
describe('AI calendar boundary',()=>{
 it('keeps model provenance and review requirement in canonical drafts',()=>{const item=adaptAiCalendar(result(),context,'2026-11',{post:1,carousel:0,reels:0})[0];expect(item.editorial?.rules).toContain('generation:gemini');expect(item.copy).toContain('Legenda:');expect(item.editorial?.postConcept?.headline).toBe('Planeje o próximo passo')})
 it('rejects wrong formats/dates and never falls back to a rules draft',()=>{const data=result();data.items[0].date='2026-12-01';expect(()=>adaptAiCalendar(data,context,'2026-11',{post:1,carousel:0,reels:0})).toThrow(/datas/);expect(()=>adaptAiCalendar(result(),context,'2026-11',{post:0,carousel:1,reels:0})).toThrow(/mix/)})
 it('rejects forbidden terms and prior month themes',()=>{expect(()=>adaptAiCalendar(result(),{...context,forbiddenTerms:['planejamento']},'2026-11',{post:1,carousel:0,reels:0})).toThrow(/proibido/);expect(()=>adaptAiCalendar(result(),context,'2026-11',{post:1,carousel:0,reels:0},[{clientId:'current',month:'2026-10',item:{date:'2026-10-03',format:'post',title:'Planejamento',copy:'old'}}])).toThrow(/mês anterior/)})
})
