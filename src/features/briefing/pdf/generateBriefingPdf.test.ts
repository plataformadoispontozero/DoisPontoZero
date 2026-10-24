import {beforeEach,describe,it,expect,vi,afterEach} from 'vitest'
const state=vi.hoisted(()=>({insert:vi.fn(),from:vi.fn(),error:vi.fn(),blob:vi.fn()}))
vi.mock('@react-pdf/renderer',()=>({pdf:()=>({toBlob:state.blob}),StyleSheet:{create:(value:unknown)=>value},Document:'div',Page:'section',View:'div',Text:'span',Image:'img'}))
vi.mock('@/lib/supabase/client',()=>({isSupabaseConfigured:true,supabase:{from:state.from}}))
vi.mock('@/components/ui/Toast',()=>({toast:{error:state.error}}))
import {downloadBriefingPdf} from './generateBriefingPdf'
import type {BriefingPdfModel} from './types'
const model:BriefingPdfModel={agencyId:'real-agency',briefingId:'real-briefing',documentId:'DOC',title:'Briefing',clientName:'Cliente',category:'general',categoryLabel:'Geral',version:1,statusLabel:'Rascunho',formattedDate:'22/10/2026',branding:{agencyName:'Dois.Zero',primaryColor:'#c84408',secondaryColor:'#333333'},sections:[],metadata:{totalQuestions:0,answeredQuestions:0,completionRate:0,generatedAt:'2026-10-22'}}
describe('briefing export record',()=>{
 beforeEach(()=>{vi.useFakeTimers();state.insert.mockReset();state.from.mockReset();state.error.mockReset();state.blob.mockResolvedValue(new Blob(['pdf']));state.insert.mockResolvedValue({error:null});state.from.mockReturnValue({insert:state.insert});URL.createObjectURL=vi.fn(()=> 'blob:export');URL.revokeObjectURL=vi.fn();vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})})
 afterEach(()=>{vi.runOnlyPendingTimers();vi.useRealTimers();vi.restoreAllMocks()})
 it('records the actual agency and briefing after triggering download',async()=>{
  await downloadBriefingPdf(model)
  expect(state.from.mock.calls.map(call=>call[0])).toEqual(['briefing_exports','briefing_activity'])
  expect(state.insert.mock.calls.every(call=>call[0].agency_id==='real-agency')).toBe(true)
  expect(state.insert.mock.calls[1][0]).toMatchObject({briefing_id:'real-briefing',action:'pdf_exported'})
  expect(state.error).not.toHaveBeenCalled()
 })
 it('reports history failure separately after an already successful download',async()=>{
  state.insert.mockResolvedValue({error:{code:'42501'}})
  await expect(downloadBriefingPdf(model)).resolves.toBeUndefined()
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
  expect(state.error).toHaveBeenCalledWith(expect.stringContaining('O PDF foi baixado, mas não foi possível registrar'))
 })
})
