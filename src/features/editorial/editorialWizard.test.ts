import { describe, expect, it } from 'vitest';
import { editorialStepIssues } from './editorialWizard';
import { emptyContext } from './monthlyPlanner';
const context = {...emptyContext, objective:'Autoridade', audience:'Empresas', topics:['Serviços']};
const counts = {post:4,reels:4,carousel:2};
describe('preparação editorial',()=>{
 it('aceita direção mensal livre no percurso e na geração Gemini sem lista manual de temas',()=>{
  const direction={...emptyContext,audience:'Público registrado no briefing',monthlyDirection:'Neste mês queremos explicar os serviços cadastrados com foco em reconhecimento da marca.'};
  expect(editorialStepIssues(1,'a','2026-10',direction,counts,[])).toEqual([]);
  expect(editorialStepIssues(2,'a','2026-10',direction,counts,[],'gemini')).toEqual([]);
  expect(editorialStepIssues(2,'a','2026-10',direction,counts,[],'rules')).toContain('objetivo do mês');
 });
 it('exige direção mensal suficiente para IA mesmo quando há temas do planejamento por regras',()=>{
  expect(editorialStepIssues(2,'a','2026-10',{...context,monthlyDirection:'curta'},counts,[],'gemini')).toContain('direção, copy e estratégia do mês com pelo menos 20 caracteres');
 });
 it('permite completar a direção depois de selecionar cliente e mês',()=>expect(editorialStepIssues(0,'a','2026-10',emptyContext,counts,[])).toEqual([]));
 it('impede pular direção incompleta',()=>expect(editorialStepIssues(1,'a','2026-10',emptyContext,counts,[])).toContain('objetivo do mês'));
 it('rejeita mês inválido',()=>expect(editorialStepIssues(0,'a','2026-13',context,counts,[])).not.toEqual([]));
 it('rejeita volumes fracionários e campanha vazia',()=>{expect(editorialStepIssues(2,'a','2026-10',context,{...counts,post:1.5},[])).not.toEqual([]);expect(editorialStepIssues(2,'a','2026-10',context,{post:0,reels:0,carousel:0},[])).not.toEqual([]);});
 it('valida slides e cenas apenas nos formatos utilizados',()=>{expect(editorialStepIssues(2,'a','2026-10',{...context,carouselSlides:2},counts,[])).not.toEqual([]);expect(editorialStepIssues(2,'a','2026-10',{...context,reelsScenes:11},counts,[])).not.toEqual([]);expect(editorialStepIssues(2,'a','2026-10',{...context,reelsScenes:11,carouselSlides:2},{post:1,reels:0,carousel:0},[])).toEqual([]);});
});
