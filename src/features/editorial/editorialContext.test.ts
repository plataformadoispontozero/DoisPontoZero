import {describe,it,expect} from 'vitest';
import {suggestEditorialTopics,missingEditorialInputs,legacyCalendarHistory} from './editorialContext';
import {generateCampaignPlan} from './campaignEngine';
import {emptyContext} from './monthlyPlanner';
describe('client editorial readiness',()=>{
 it('reports missing themes even when profile has objective and audience',()=>{
  expect(missingEditorialInputs({...emptyContext,objective:'Contatos',audience:'Empresas'},[])).toEqual(['temas revisados do mês ou pilares com temas']);
  expect(missingEditorialInputs(emptyContext,[])).toHaveLength(3);
 });
 it('proposes topics from vetted historical fields and identifies their sources without approving facts',()=>{
  const suggestions=suggestEditorialTopics({niche:'Engenharia'},[{id:'b',payload:{produtos_servicos:'Reformas',persona_descricao:'Empresas'}}],[{id:'s',payload:{resumo_extraido:{foco_q1:'Planejamento comercial',foco_q2:'Dúvidas de contratação'},texto_estrategia:'Não transformar este texto livre em fatos'}}]);
  expect(suggestions[0]).toEqual({text:'Planejamento comercial',source:expect.stringMatching(/histórica/)});
  expect(suggestions.some(s=>s.text.includes('Reformas'))).toBe(true);
  expect(suggestions.some(s=>s.text.includes('texto livre'))).toBe(false);
 });
 it('allows reviewed profile suggestions to generate exact quantities and configurable slides/scenes',()=>{
  const context={...emptyContext,objective:'Atrair novos clientes',audience:'Empresas que precisam reformar',tone:'Profissional',positioning:'Engenharia comercial',topics:suggestEditorialTopics({niche:'Engenharia'},[],[]).map(s=>s.text),carouselSlides:7,reelsScenes:5,reelsSeconds:30};
  expect(missingEditorialInputs(context,[])).toEqual([]);
  const plan=generateCampaignPlan('2026-11','Cliente auditado',context,{post:4,reels:4,carousel:4},{clientId:'audit'});
  expect(plan).toHaveLength(12);
  for(const item of plan){if(item.format==='carousel')expect(item.editorial?.slides).toHaveLength(7);if(item.format==='reels'){expect(item.editorial?.scenes).toHaveLength(5);expect(item.editorial!.scenes!.reduce((sum,s)=>sum+s.seconds,0)).toBe(30);}}
  expect(context.approvedFacts).toBeUndefined();
 });
 it('requires actual topic-bearing positive pillars and never infers themes for an empty profile',()=>{
  expect(suggestEditorialTopics({},[],[])).toEqual([]);
  expect(missingEditorialInputs({...emptyContext,objective:'O',audience:'A'},[{id:'p',name:'P',percentage:100,example_topics:[],content_formats:[]}])).toHaveLength(1);
 });
});

it('includes rejected historical structured topics in reuse checks and does not ingest arbitrary text blobs',()=>{
 const history=legacyCalendarHistory('a',[{id:'old',payload:{status:'reprovado',conteudo_estruturado:[{tema:'Dúvidas frequentes sobre Engenharia',headline:'Como escolher serviços de Engenharia'}]}},{id:'blob',payload:{conteudo_gerado:'Confidencial'}}]);
 expect(history).toHaveLength(2);expect(history.every(x=>x.clientId==='a'&&x.state==='historical')).toBe(true);
 const context={...emptyContext,objective:'Contatos',audience:'Empresas',topics:['Dúvidas frequentes sobre Engenharia','Como escolher serviços de Engenharia']};
 expect(()=>generateCampaignPlan('2026-11','Cliente',context,{post:1,reels:0,carousel:0},{clientId:'a',history})).toThrow(/esgotado/);
 expect(generateCampaignPlan('2026-11','Outro cliente',context,{post:1,reels:0,carousel:0},{clientId:'b',history})).toHaveLength(1);
});
