// @vitest-environment node
import {PGlite} from '@electric-sql/pglite'
import {it,expect} from 'vitest'
import {setupOfficeDatabase,a,b,owner,room} from '@/features/office/officeDatabase.fixture'
it('controlled restore preserves data, authorized RPCs and tenant/anonymous restrictions',async()=>{
 const original=await setupOfficeDatabase();let restored:PGlite|undefined
 try{
  await original.exec(`select set_config('test.uid','${owner}',false);set role authenticated;`)
  await original.query('select office_configure_room($1,$2,true)',[a,room])
  await original.exec('reset role')
  const backup=await original.dumpDataDir('none')
  expect(backup.size).toBeGreaterThan(0)
  restored=await PGlite.create({loadDataDir:backup})
  await restored.exec(`select set_config('test.uid','${owner}',false);set role authenticated;`)
  const own=await restored.query<{data:{id:string}[]}>('select office_directory($1) data',[a])
  expect(own.rows[0].data.map(row=>row.id)).toContain(room)
  expect((await restored.query('select office_directory($1) data',[b])).rows[0]).toEqual({data:[]})
  await restored.exec('reset role')
  expect((await restored.query("select has_function_privilege('anon','office_directory(uuid)','execute') allowed")).rows[0]).toEqual({allowed:false})
  expect((await restored.query('select office_enabled from chat_channels where id=$1',[room])).rows[0]).toEqual({office_enabled:true})
 }finally{await restored?.close();await original.close()}
},30000)
