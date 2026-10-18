import {renderHook,act} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {beforeEach,expect,it,vi} from 'vitest'
import {useCreateTask} from './useTasks'

const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('@/lib/supabase/client',()=>({isSupabaseConfigured:true,supabase:{rpc}}))

function wrapper({children}:any){return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>}
beforeEach(()=>{vi.clearAllMocks();rpc.mockResolvedValue({data:'task-created',error:null})})

it('creates a task through one transactional RPC and sends the stable idempotency key',async()=>{
 const {result}=renderHook(()=>useCreateTask(),{wrapper})
 const input={
  agencyId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',projectId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  boardId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',requestId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  form:{title:'[Design] Peça de teste',description:'Descrição',priority:'normal' as const,column_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',due_date:null,start_date:null,assignee_ids:['ffffffff-ffff-4fff-8fff-ffffffffffff','ffffffff-ffff-4fff-8fff-ffffffffffff'],parent_task_id:null},
 }
 await act(async()=>{await result.current.mutateAsync(input)})
 expect(rpc).toHaveBeenCalledTimes(1)
 expect(rpc).toHaveBeenCalledWith('create_task_with_assignees',expect.objectContaining({
  p_agency_id:input.agencyId,p_project_id:input.projectId,p_board_id:input.boardId,
  p_title:input.form.title,p_request_id:input.requestId,p_assignee_ids:['ffffffff-ffff-4fff-8fff-ffffffffffff'],
 }))
})

it('surfaces transaction errors without reporting success',async()=>{
 rpc.mockResolvedValue({data:null,error:{message:'Responsável fora do projeto'}})
 const {result}=renderHook(()=>useCreateTask(),{wrapper})
 await act(async()=>{await expect(result.current.mutateAsync({agencyId:'a',projectId:'p',boardId:'b',requestId:'r',form:{title:'Tarefa',description:'',priority:'normal',column_id:'c',due_date:null,start_date:null,assignee_ids:[],parent_task_id:null}})).rejects.toMatchObject({message:'Responsável fora do projeto'})})
})
