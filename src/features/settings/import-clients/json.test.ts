import {describe,it,expect} from 'vitest'
import {parseClientJson,readClientImportFile} from './json'
import {autoMapping,previewCsv} from './csv'

describe('client JSON import review',()=>{
 it.each([(rows:unknown)=>rows,(rows:unknown)=>({clients:rows}),(rows:unknown)=>({data:rows}),(rows:unknown)=>({data:{clients:rows}})])('accepts supported export envelopes without creating records',wrap=>{
  const document=parseClientJson(JSON.stringify(wrap([{id:'legacy-1',name:'Cliente São José',status:'ativo',profile:{city:'Natal',monthly_content_count:12}}])))
  const rows=previewCsv(document,autoMapping(document.headers),[])
  expect(rows[0].errors).toEqual([])
  expect(rows[0].data).toMatchObject({name:'Cliente São José',slug:'cliente-sao-jose',status:'active',profile:{source_id:'legacy-1',city:'Natal',monthly_content_count:12}})
 })
 it('combines optional fields across rows and keeps duplicate validation',()=>{
  const document=parseClientJson(JSON.stringify([{name:'Mesmo Nome',profile:{city:'Natal'}},{name:'Mesmo Nome',city:null}]))
  expect(document.records.every(r=>r.cells.length===document.headers.length)).toBe(true)
  const rows=previewCsv(document,autoMapping(document.headers),[{id:'existing',name:'Mesmo Nome',slug:'mesmo-nome'}])
  expect(rows[0].duplicate?.id).toBe('existing')
  expect(rows[1].errors.join()).toContain('Slug repetido')
 })
 it.each(['{}','[]','[null]','{"data":"invalid"}','[{"name":{"value":"nested"}}]','[{"name":"Cliente","profile":{"tone":[]}}]'])('rejects unsupported JSON %s',input=>expect(()=>parseClientJson(input)).toThrow())
 it('accepts more than 500 records and 100 fields, rejects more than 512',()=>{
  expect(parseClientJson(JSON.stringify(Array.from({length:501},()=>({name:'Cliente'})))).records).toHaveLength(501)
  expect(()=>parseClientJson(JSON.stringify([Object.fromEntries(Array.from({length:513},(_,i)=>['field'+i,'value']))]))).toThrow('512')
 })
 it('reads JSON and CSV files into the same document contract',async()=>{
  const file=(name:string,text:string)=>({name,type:'',size:text.length,arrayBuffer:async()=>new TextEncoder().encode(text).buffer}) as File
  expect((await readClientImportFile(file('clients.JSON','[{"name":"Cliente"}]'))).headers).toEqual(['name'])
  expect((await readClientImportFile(file('clients.csv','name\nCliente'))).headers).toEqual(['name'])
 })
})
