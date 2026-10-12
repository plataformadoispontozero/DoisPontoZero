import {describe,it,expect} from 'vitest'
import {generateEditorialSuggestions} from './editorialEngine'
import type {EditorialPillar,ContentIdea} from '@/types/strategy'
const pillar:EditorialPillar={id:'p',agency_id:'a',strategy_id:'s',name:'Planejamento',description:null,color:'#fff',icon:'Layers',percentage:100,position:0,content_formats:['post'],posting_frequency:'diário',example_topics:['Planejamento','Rotina','Consultoria'],created_at:'',updated_at:''}
describe('legacy strategy history',()=>{
 it('excludes discarded ideas and does not repeat topics within the generated preview',()=>{
  const existing={pillar_id:'p',title:'Planejamento',status:'discarded'} as ContentIdea
  const suggestions=generateEditorialSuggestions([pillar],30,[existing])
  expect(suggestions).toHaveLength(2)
  expect(new Set(suggestions.map(s=>s.example_topics[0])).size).toBe(2)
  expect(suggestions.every(s=>s.example_topics[0]!=='Planejamento')).toBe(true)
 })
 it('does not manufacture a fallback when every approved topic was used',()=>{
  const existing=pillar.example_topics.map(title=>({pillar_id:'p',title,status:'discarded'} as ContentIdea))
  expect(generateEditorialSuggestions([pillar],30,existing)).toEqual([])
 })
})
