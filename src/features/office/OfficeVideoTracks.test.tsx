import {fireEvent,render,screen,within} from '@testing-library/react'
import {beforeEach,describe,expect,it,vi} from 'vitest'
import {Track} from 'livekit-client'
import {OfficeVideoTracks} from './OfficeVideoTracks'
const state=vi.hoisted(()=>({tracks:[] as any[],participants:[] as any[]}))
vi.mock('@livekit/components-react',()=>({useTracks:()=>state.tracks,VideoTrack:({trackRef,className,style}:any)=><video data-testid={`video-${trackRef.publication.trackSid}`} className={className} style={style}/>}))
vi.mock('./OfficeVoiceContext',()=>({useOfficeVoice:()=>({participants:state.participants})}))
const track=(identity:string,name:string,source:Track.Source,sid:string)=>({participant:{identity,name,isLocal:false},source,publication:{trackSid:sid}})
beforeEach(()=>{state.tracks=[];state.participants=[]})
describe('office presentation layout',()=>{
 it('keeps a screen large and contained with camera tiles in a separate responsive rail',()=>{
  state.tracks=[track('one','Alice',Track.Source.Camera,'cam-one'),track('two','Bob',Track.Source.Camera,'cam-two'),track('one','Alice',Track.Source.ScreenShare,'screen-one')]
  render(<OfficeVideoTracks/>);
  const stage=screen.getByRole('figure',{name:'Tela compartilhada por Alice'}),rail=screen.getByRole('complementary',{name:'Participantes da apresentação'})
  expect(within(stage).getByTestId('video-screen-one')).toHaveClass('object-contain');expect(within(stage).getByTestId('video-screen-one')).toHaveClass('h-[62vh]','min-h-72','max-h-[52rem]')
  expect(within(rail).getByTestId('video-cam-one')).toBeInTheDocument();expect(within(rail).getByTestId('video-cam-two')).toBeInTheDocument();expect(within(rail).queryByTestId('video-screen-one')).not.toBeInTheDocument();expect(rail).toHaveClass('lg:flex-col','overflow-x-auto')
 })
 it('lets the user choose another active screen and recovers when that share stops',()=>{
  state.tracks=[track('one','Alice',Track.Source.ScreenShare,'screen-one'),track('two','Bob',Track.Source.ScreenShare,'screen-two')]
  const view=render(<OfficeVideoTracks/>);fireEvent.click(screen.getByRole('button',{name:'Ver tela de Bob'}));expect(screen.getByRole('figure',{name:'Tela compartilhada por Bob'})).toBeInTheDocument()
  state.tracks=[state.tracks[0]];view.rerender(<OfficeVideoTracks/>);expect(screen.getByRole('figure',{name:'Tela compartilhada por Alice'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Ver tela de Bob'})).not.toBeInTheDocument();expect(screen.queryByRole('complementary')).not.toBeInTheDocument();expect(screen.getByRole('figure',{name:'Tela compartilhada por Alice'}).parentElement).not.toHaveClass('lg:grid-cols-[minmax(0,1fr)_13rem]')
 })
 it('uses the camera grid without a screen and renders nothing with no published video',()=>{
  state.tracks=[track('one','Alice',Track.Source.Camera,'cam-one')];const view=render(<OfficeVideoTracks/>);expect(screen.getByRole('region',{name:'Vídeos compartilhados na sala'})).toBeInTheDocument();expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  state.tracks=[];view.rerender(<OfficeVideoTracks/>);expect(view.container).toBeEmptyDOMElement()
 })
 it('shows a camera-off participant without publishing or starting a device',()=>{
  state.tracks=[track('one','',Track.Source.ScreenShare,'screen-one')];state.participants=[{id:'one',speaking:true},{id:'two',speaking:false}]
  render(<OfficeVideoTracks names={new Map([['two','Beatriz']])} localParticipantId="one"/>);expect(within(screen.getByRole('complementary')).getByText('Beatriz')).toBeInTheDocument();expect(within(screen.getByRole('complementary')).getByText('Você')).toBeInTheDocument();expect(screen.getAllByText('Câmera desligada')).toHaveLength(1);expect(screen.getByText('Falando')).toBeInTheDocument();expect(screen.getAllByTestId(/video-/)).toHaveLength(1)
 })
})
