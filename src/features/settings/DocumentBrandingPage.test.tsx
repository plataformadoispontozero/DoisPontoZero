import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {describe,it,expect,vi,beforeEach} from 'vitest'
const state=vi.hoisted(()=>({update:vi.fn(),generate:vi.fn(),branding:{agency_id:'agency',display_name:'Dois.Zero',primary_color:'#c84408',secondary_color:'#333333',accent_color:'#ff8800'},documents:{agency_id:'agency',header_style:'centered_logo',footer_text:'Documento gerado via Creative Agency OS',show_logo:true,show_watermark:true,watermark_opacity:.05,page_format:'A4',document_font:'Helvetica'}}))
vi.mock('./hooks/useAgencySettings',()=>({useAgencyBranding:()=>({branding:state.branding,isLoading:false,isError:false}),useAgencyDocumentSettings:()=>({documentSettings:state.documents,updateDocumentSettings:state.update,isLoading:false,isError:false})}))
vi.mock('@/components/pdf/PdfPreview',()=>({PdfPreview:()=> <div>PDF renderizado pelo visualizador</div>}))
vi.mock('@/features/briefing/pdf/generateBriefingPdf',()=>({generateBriefingPdfBlob:state.generate}))
import {DocumentBrandingPage} from './DocumentBrandingPage'
describe('document branding uses generated briefing PDF',()=>{
 beforeEach(()=>{state.generate.mockReset();state.update.mockReset();state.generate.mockResolvedValue({blob:new Blob(['pdf']),blobUrl:'blob:preview'});URL.revokeObjectURL=vi.fn()})
 it('generates the canonical PDF with official logo, central symbol and saved parameters',async()=>{
  render(<DocumentBrandingPage/>);fireEvent.click(screen.getByRole('button',{name:'Atualizar prévia PDF'}))
  await waitFor(()=>expect(state.generate).toHaveBeenCalledOnce())
  expect(state.generate.mock.calls[0][0].branding).toMatchObject({logoUrl:'/pdf-brand/wordmark.jpg',symbolUrl:'/pdf-brand/symbol.jpg',showWatermark:true,watermarkOpacity:.05,pageFormat:'A4',documentFont:'Helvetica',headerStyle:'centered_logo',footerText:'Documento gerado via 2.0'})
  expect(await screen.findByText('PDF renderizado pelo visualizador')).toBeInTheDocument()
  expect(state.update).not.toHaveBeenCalled()
 })
 it('shows a retryable generation error without reporting a saved PDF',async()=>{
  state.generate.mockRejectedValue(new Error('failed'));render(<DocumentBrandingPage/>);fireEvent.click(screen.getByRole('button',{name:'Atualizar prévia PDF'}))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gerar a prévia')
  expect(screen.getByRole('button',{name:'Atualizar prévia PDF'})).toBeEnabled()
 })
})
