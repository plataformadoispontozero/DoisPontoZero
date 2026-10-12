import React from 'react'
import {describe,it,expect,vi,beforeEach} from 'vitest'
import {renderHook,waitFor,act} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
const state=vi.hoisted(()=>({result:{data:[] as unknown[],error:null as {message:string}|null},select:vi.fn()}))
vi.mock('@/features/auth/AuthProvider',()=>({useAuth:()=>({activeAgency:{agencyId:'agency-real'}})}))
vi.mock('@/lib/supabase/client',()=>({isSupabaseConfigured:true,supabase:{from:()=>{const builder:any={};for(const key of ['select','eq','ilike','insert','single'])builder[key]=(...args:unknown[])=>{if(key==='select')state.select(...args);return builder};builder.then=(resolve:any)=>Promise.resolve(state.result).then(resolve);return builder}}}))
import {useDriveFiles,useAddDriveFileReference} from '@/features/drive/hooks/useDrive'
function wrapper({children}:{children:React.ReactNode}){return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>}
beforeEach(()=>{state.result={data:[],error:null};state.select.mockClear()})
describe('real Drive reference persistence',()=>{
 it('returns empty when the configured agency has no files instead of invented demo media',async()=>{const {result}=renderHook(()=>useDriveFiles(),{wrapper});await waitFor(()=>expect(result.current.isSuccess).toBe(true));expect(result.current.data).toEqual([])})
 it('surfaces read permission failures rather than fictional media',async()=>{state.result.error={message:'permission denied'};const {result}=renderHook(()=>useDriveFiles(),{wrapper});await waitFor(()=>expect(result.current.isError).toBe(true));expect(result.current.data).toBeUndefined()})
 it('rejects failed inserts instead of reporting an unsaved reference as success',async()=>{state.result.error={message:'insert denied'};const {result}=renderHook(()=>useAddDriveFileReference(),{wrapper});await act(async()=>{await expect(result.current.mutateAsync({name:'Art',mime_type:'image/webp',web_view_link:'https://drive.google.com/file/d/realFileId12345678901234/view'})).rejects.toMatchObject({message:'insert denied'})})})
})
