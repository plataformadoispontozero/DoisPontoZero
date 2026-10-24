import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {beforeEach,describe,expect,it,vi} from 'vitest'
import {ClientPresentationDrivePicker} from './ClientPresentationDrivePicker'
const request=vi.hoisted(()=>vi.fn())
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency'}))
vi.mock('@/features/integrations/driveProduction',()=>({googleDriveRequest:request}))
const props={clientId:'client',presentationId:'presentation',sectionId:'section',onLinked:vi.fn(),onCancel:vi.fn()}
beforeEach(()=>{vi.clearAllMocks()})
describe('seleção Drive por cliente',()=>{
 it('carrega raiz automaticamente e lista somente a pasta aberta antes de vincular',async()=>{
  request.mockResolvedValueOnce({folder:{id:'root',name:'Cliente'},rootId:'root',nextPageToken:null,files:[{id:'folder',name:'OUTUBRO',mimeType:'application/vnd.google-apps.folder'}]}).mockResolvedValueOnce({folder:{id:'folder',name:'OUTUBRO'},rootId:'root',nextPageToken:'page2',files:[{id:'image',name:'Arte.webp',mimeType:'image/webp'}]}).mockResolvedValueOnce({assets:[]});
  render(<ClientPresentationDrivePicker {...props}/>);fireEvent.click(await screen.findByRole('button',{name:'📁 OUTUBRO'}));fireEvent.click(await screen.findByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Vincular selecionados (1)'}));await waitFor(()=>expect(props.onLinked).toHaveBeenCalled());expect(request).toHaveBeenNthCalledWith(1,'client-drive-list',{agencyId:'agency',clientId:'client'},{});expect(request).toHaveBeenLastCalledWith('presentation-drive-link',{agencyId:'agency',clientId:'client'},{presentationId:'presentation',sectionId:'section',folderId:'folder',fileIds:['image']});
 })
 it('apresenta falha e permite nova consulta',async()=>{request.mockRejectedValueOnce(Error('Pasta indisponível')).mockResolvedValueOnce({folder:{id:'root',name:'Cliente'},rootId:'root',nextPageToken:null,files:[]});render(<ClientPresentationDrivePicker {...props}/>);expect(await screen.findByRole('alert')).toHaveTextContent('Pasta indisponível');fireEvent.click(screen.getByRole('button',{name:'Tentar novamente'}));expect(await screen.findByText('Esta pasta está vazia.')).toBeInTheDocument();})
 it('vincula em lote as imagens da pasta selecionada sem marcar cada arquivo',async()=>{request.mockResolvedValueOnce({folder:{id:'carousel',name:'Carrossel'},rootId:'root',nextPageToken:null,files:[{id:'slide-1',name:'01.webp',mimeType:'image/webp'},{id:'slide-2',name:'02.png',mimeType:'image/png'},{id:'doc',name:'brief.pdf',mimeType:'application/pdf'}]}).mockResolvedValueOnce({assets:[]});render(<ClientPresentationDrivePicker {...props}/>);fireEvent.click(await screen.findByRole('button',{name:/Selecionar esta pasta de carrossel \(2\)/}));await waitFor(()=>expect(props.onLinked).toHaveBeenCalled());expect(request).toHaveBeenLastCalledWith('presentation-drive-link',{agencyId:'agency',clientId:'client'},{presentationId:'presentation',sectionId:'section',folderId:'carousel',fileIds:['slide-1','slide-2']})})
})
