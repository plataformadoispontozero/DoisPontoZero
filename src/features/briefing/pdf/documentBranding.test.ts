import {describe,it,expect} from 'vitest'
import {resolveDocumentPdfBranding} from './documentBranding'
import {initialAgencyBranding,initialAgencyDocumentSettings} from '@/features/settings/hooks/useAgencySettings'
import {transformBriefingToPdfModel} from './transformBriefingToPdfModel'
import type {Briefing} from '@/types/briefing'
describe('canonical briefing PDF settings',()=>{
 it('uses printable official assets and respects the selected document settings',()=>{
  const config=resolveDocumentPdfBranding(initialAgencyBranding,{...initialAgencyDocumentSettings,header_style:'left_logo',page_format:'Letter',document_font:'Courier',show_watermark:false,watermark_opacity:.4})
  expect(config).toMatchObject({logoUrl:'/pdf-brand/wordmark.jpg',symbolUrl:'/pdf-brand/symbol.jpg',headerStyle:'left_logo',pageFormat:'Letter',documentFont:'Courier',showWatermark:false,watermarkOpacity:.2})
  const model=transformBriefingToPdfModel({id:'briefing',agency_id:'agency',title:'Plano',status:'draft',created_at:'2026-10-22',client:{name:'Cliente'}} as Briefing,config)
  expect(model.agencyId).toBe('agency')
  expect(model.branding).toMatchObject(config)
 })
 it('preserves another agency identity instead of replacing it with the platform brand',()=>{
  expect(resolveDocumentPdfBranding({...initialAgencyBranding,display_name:'Agência Externa',logo_dark_path:'https://example.test/logo.png',symbol_path:'https://example.test/symbol.png'},initialAgencyDocumentSettings)).toMatchObject({agencyName:'Agência Externa',logoUrl:'https://example.test/logo.png',symbolUrl:'https://example.test/symbol.png'})
 })
})
