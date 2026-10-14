import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChatPage } from './ChatPage'
vi.mock('./hooks/useRoomPresence',()=>({useRoomPresence:()=>({data:[],isError:false,isFetching:false})}))
const state = vi.hoisted(() => ({ canCreate:true, loading: false, error: null as Error | null, create: vi.fn(), direct: vi.fn() }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAgencyId: () => 'agency',usePermission:(key:string)=>key!=='chat.create_channels'||state.canCreate }))
vi.mock('../squads/hooks/useSquads', () => ({ useSquads: () => ({ data: [] }) }))
vi.mock('../projects/hooks/useProjects', () => ({ useProjects: () => ({ data: [] }) }))
vi.mock('./hooks/useChat', () => ({
 useChannels: () => ({data: []}), useConversations: () => ({data: []}), useMessages: () => ({data: []}),
 useSendMessage: () => ({}), useAddReaction: () => ({}), useMarkChatRead: () => ({ mutate: vi.fn() }),
 useChatMembers: () => ({data: [{id:'member-1',name:'Designer'}],isLoading:state.loading,error:state.error}),
 useStartDirect: () => ({mutateAsync:state.direct,isPending:false}),
 useCreateChannel: () => ({mutateAsync:state.create,isPending:false}),
}))
beforeEach(() => { state.canCreate=true;state.loading=false;state.error=null;state.create.mockReset();state.direct.mockReset();state.create.mockResolvedValue({id:'channel'}); })
function mount(){render(<MemoryRouter><ChatPage/></MemoryRouter>)}
describe('Chat selectors', () => {
 it('blocks room creation when its permission is revoked',()=>{state.canCreate=false;mount();expect(screen.getByRole('button',{name:'Criar novo canal'})).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'Criar sala de trabalho'}));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(state.create).not.toHaveBeenCalled()})
 it('blocks direct selection while members are loading', () => {state.loading=true;mount();expect(screen.getByRole('combobox',{name:'Iniciar mensagem direta'})).toBeDisabled()})
 it('does not send private participants into a public channel', async () => {
 mount();fireEvent.click(screen.getByRole('button',{name:'Criar novo canal'}));
 fireEvent.change(screen.getByPlaceholderText('ex: squad-design ou proj-rebranding'),{target:{value:'Equipe'}});
 const selectors=screen.getAllByRole('combobox');fireEvent.change(selectors[2],{target:{value:'private'}});
 fireEvent.click(screen.getByRole('checkbox'));fireEvent.change(selectors[2],{target:{value:'agency'}});
 fireEvent.click(screen.getByRole('button',{name:'Criar Canal'}));
 await waitFor(()=>expect(state.create).toHaveBeenCalledWith(expect.objectContaining({visibility:'agency',members:[]})))
 })
 it('shows backend error and retains member selection to retry', async () => {
 state.direct.mockRejectedValue({message:'Membro não está ativo'});mount();
 fireEvent.change(screen.getByRole('combobox',{name:'Iniciar mensagem direta'}),{target:{value:'member-1'}});
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Membro não está ativo'));
 expect(screen.getByRole('combobox',{name:'Iniciar mensagem direta'})).toHaveValue('member-1');
 expect(screen.getByRole('button',{name:'Tentar abrir conversa novamente'})).toBeEnabled();
 })
})
