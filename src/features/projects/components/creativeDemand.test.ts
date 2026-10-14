import {describe,it,expect} from 'vitest'
import {normalizeHashtags,serializeCreativeDemand} from './creativeDemand'
import {parseDemandContent} from './parseDemandContent'
import {clientStage} from './ClientKanbanBoard'
describe('copy structured for creative production',()=>{
 it('preserves complete content and renders each requested block',()=>{const result=serializeCreativeDemand({format:'post',title:'Aurora — TESTE',support:'Apoio completo',cta:'Reserve sua pausa',caption:'Legenda aprovada',hashtags:'#Cafe Cafe, AuroraCafe',direction:'Luz lateral suave',angle:'Plano a 45 graus',sequence:''});expect(normalizeHashtags('#Cafe Cafe, AuroraCafe')).toBe('#Cafe #AuroraCafe');const p=parseDemandContent(result);expect(p.kind).toBe('Post');expect(p.blocks.map(b=>b.label)).toEqual(['Título','Texto de apoio','CTA','Legenda','Hashtags','Direção criativa','Ângulo e enquadramento']);expect(p.blocks.find(b=>b.label==='Ângulo e enquadramento')?.body).toBe('Plano a 45 graus')})
 it('keeps one client at first pending stage without losing individual completion',()=>{expect(clientStage([{status:'done'},{status:'in_progress'},{status:'open'}])).toBe('open');expect(clientStage([{status:'done'},{status:'review'}])).toBe('review');expect(clientStage([{status:'done'}])).toBe('done')})
})
