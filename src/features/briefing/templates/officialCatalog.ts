import type { BriefingTemplate } from '@/types/briefing'
import { INITIAL_BRIEFING_TEMPLATES } from '../constants/initialTemplates'
export function officialBriefingTemplates(templates:BriefingTemplate[]){
 return INITIAL_BRIEFING_TEMPLATES.flatMap(starter=>{
  const candidate=templates.filter(t=>t.category===starter.category&&t.status!=='archived'&&!/teste|fict[ií]cio|hist[oó]rico migrado/i.test(t.name)).sort((a,b)=>Number(b.status==='published')-Number(a.status==='published')||b.version-a.version||String(b.updated_at).localeCompare(String(a.updated_at)))[0]
  return candidate?[candidate]:[]
 })
}
