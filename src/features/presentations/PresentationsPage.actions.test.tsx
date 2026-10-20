import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach,describe,it,expect,vi} from 'vitest'
import {PresentationsPage} from './PresentationsPage'
const mocks=vi.hoisted(()=>({create:vi.fn(),update:vi.fn(),remove:vi.fn(),allowed:true}))
vi.mock('@/features/auth/AuthProvider',()=>({usePermission:()=>mocks.allowed}))
vi.mock('./hooks/usePresentations',()=>({
 usePresentations:()=>({data:[{id:'original',title:'Campanha de dezembro',client_id:'client',client_name:'Aurora',period_month:12,period_year:2026,status:'published',sections:[],assets:[]}],isLoading:false,isError:false}),
 useCreatePresentation:()=>({mutateAsync:mocks.create,isPending:false}),
 useDeletePresentation:()=>({mutateAsync:mocks.remove,isPending:false}),
 useUpdatePresentation:()=>({mutateAsync:mocks.update,isPending:false}),
}))
vi.mock('./presentationMedia',()=>({PresentationAssetThumbnail:()=>null}))
const open=()=>render(<MemoryRouter><PresentationsPage/></MemoryRouter>)
beforeEach(()=>{mocks.allowed=true;mocks.create.mockReset().mockResolvedValue({id:'new-draft'});mocks.update.mockReset().mockResolvedValue({})})
describe('ações das apresentações',()=>{
 it('exige confirmação para mover para Arquivadas e não exclui arquivos',async()=>{
  open();fireEvent.click(screen.getByRole('button',{name:'Arquivar'}));expect(mocks.update).not.toHaveBeenCalled()
  expect(screen.getByText(/arquivos originais do Drive serão preservados/)).toBeVisible()
  fireEvent.click(screen.getByRole('button',{name:'Mover para Arquivadas'}))
  await waitFor(()=>expect(mocks.update).toHaveBeenCalledWith({id:'original',status:'archived'}))
  expect(await screen.findByRole('status')).toHaveTextContent('movida para Arquivadas')
 })
 it('preenche o próximo período e solicita um novo rascunho sem o link antigo',async()=>{
  open();fireEvent.click(screen.getByRole('button',{name:'Reaproveitar'}))
  expect(screen.getByLabelText('Mês')).toHaveValue('1');expect(screen.getByLabelText('Ano')).toHaveValue(2027)
  fireEvent.click(screen.getByRole('button',{name:'Criar rascunho do novo mês'}))
  await waitFor(()=>expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({client_id:'client',period_month:1,period_year:2027,sections_snapshot:[]})))
  expect(mocks.create.mock.calls[0][0]).not.toHaveProperty('public_token')
 })
 it('esconde ações indisponíveis para o perfil',()=>{mocks.allowed=false;open();expect(screen.queryByRole('button',{name:'Arquivar'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Reaproveitar'})).not.toBeInTheDocument()})
})
it('requires the exact title before permanent deletion and calls only the deletion mutation',async()=>{
 mocks.remove.mockResolvedValue('original');open();fireEvent.click(screen.getByRole('button',{name:'Apagar definitivamente'}));expect(screen.getByRole('button',{name:'Excluir definitivamente'})).toBeDisabled();expect(mocks.remove).not.toHaveBeenCalled()
 fireEvent.change(screen.getByLabelText('Digite o título completo para confirmar'),{target:{value:'Campanha de dezembro'}});fireEvent.click(screen.getByRole('button',{name:'Excluir definitivamente'}));await waitFor(()=>expect(mocks.remove).toHaveBeenCalledWith({id:'original',confirmation:'Campanha de dezembro'}));expect(mocks.update).not.toHaveBeenCalled()
})
