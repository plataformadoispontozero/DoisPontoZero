import {renderHook,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {beforeEach,expect,it,vi} from 'vitest'
import {useProjects} from './useProjects'

const {state}=vi.hoisted(()=>({state:{agencyId:'agency-active',from:vi.fn()}}))
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=>state.agencyId}))
vi.mock('@/lib/supabase/client',()=>({isSupabaseConfigured:true,supabase:{from:(...args:unknown[])=>state.from(...args)}}))

function wrapper({children}:any){return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{children}</QueryClientProvider>}

beforeEach(()=>{
 vi.clearAllMocks()
 const query:any={select:vi.fn(()=>query),eq:vi.fn(()=>query),is:vi.fn(()=>query),order:vi.fn(async()=>({data:[],error:null}))}
 state.from.mockReturnValue(query)
})

it('loads projects for the active agency when a caller omits the agency argument',async()=>{
 const {result}=renderHook(()=>useProjects(),{wrapper})
 await waitFor(()=>expect(result.current.isSuccess).toBe(true))
 const query=state.from.mock.results[0].value
 expect(state.from).toHaveBeenCalledWith('projects')
 expect(query.eq).toHaveBeenCalledWith('agency_id','agency-active')
 expect(result.current.data).toEqual([])
})

it('keeps an explicitly supplied agency as the query scope',async()=>{
 renderHook(()=>useProjects('agency-requested'),{wrapper})
 await waitFor(()=>expect(state.from).toHaveBeenCalled())
 const query=state.from.mock.results[0].value
 expect(query.eq).toHaveBeenCalledWith('agency_id','agency-requested')
})
