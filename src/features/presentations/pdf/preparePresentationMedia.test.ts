import {it,expect} from 'vitest'
import {pdfImageSources,preparePresentationMedia} from './preparePresentationMedia'
import type {PresentationPdfModel} from './types'
it('exports section artwork and Drive thumbnails while rejecting unsafe sources and identifying missing previews',async()=>{
 const model={sections:[{id:'section',title:'Entrega',content:{images:[{src:'https://example.invalid/art.svg',alt:'Arte teste'},{src:'javascript:alert(1)',alt:'unsafe'}]}}],assets:[{section_id:'section',title:'Material Drive',file_reference:{mime_type:'image/png',thumbnail_reference:'https://example.invalid/thumbnail.png'}}]} as unknown as PresentationPdfModel
 expect(pdfImageSources(model)[0].images).toHaveLength(2)
 const prepared=await preparePresentationMedia(model,async src=>{if(src.endsWith('.png'))throw Error('denied');return 'data:image/jpeg;base64,test'})
 expect(prepared.mediaWarnings).toBe(1);expect(prepared.sections[0].content.printImages).toEqual([{title:'Arte teste',src:'data:image/jpeg;base64,test'},{title:'Material Drive',src:''}]);expect(model.sections[0].content.printImages).toBeUndefined()
})
