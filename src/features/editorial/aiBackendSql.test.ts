// @vitest-environment node
import {it,expect} from 'vitest'
import {PGlite} from '@electric-sql/pglite'
import migrationSql from '../../../supabase/migrations/20261022151239_editorial_ai_connections.sql?raw'
it('stores ciphertext privately and reserves at most thirty calls per agency UTC day',async()=>{
 const db=new PGlite()
 try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA private;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE TABLE public.agencies(id uuid PRIMARY KEY);`)
 await db.exec(migrationSql)
 const agency='11111111-1111-4111-8111-111111111111',user='22222222-2222-4222-8222-222222222222'
 await db.query('INSERT INTO public.agencies VALUES($1)',[agency]);await db.query('INSERT INTO auth.users VALUES($1)',[user])
 await db.query("SELECT public.editorial_ai_secret('save',$1,$2,$3)",[agency,user,'ciphertext-never-plaintext-01234567890'])
 expect((await db.query<{data:{ciphertext:string}}>("SELECT public.editorial_ai_secret('read',$1) data",[agency])).rows[0].data.ciphertext).toContain('ciphertext')
 for(let i=0;i<30;i++)expect((await db.query<{data:{allowed:boolean}}>("SELECT public.editorial_ai_secret('reserve',$1,$2) data",[agency,user])).rows[0].data.allowed).toBe(true)
 expect((await db.query<{data:{allowed:boolean}}>("SELECT public.editorial_ai_secret('reserve',$1,$2) data",[agency,user])).rows[0].data.allowed).toBe(false)
 await db.exec('SET ROLE authenticated')
 await expect(db.query("SELECT public.editorial_ai_secret('read',$1)",[agency])).rejects.toThrow(/permission denied/)
 await expect(db.query('SELECT * FROM private.editorial_ai_configurations')).rejects.toThrow(/permission denied/)
 }finally{await db.close()}
})
