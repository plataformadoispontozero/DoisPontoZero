import {beforeEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {OfficeMiniBar} from './OfficeMiniBar'
import {OfficeVoiceContext,type OfficeVoiceValue} from './OfficeVoiceContext'
import {initialVoice} from './voiceState'
const flag=vi.hoisted(()=>({officeControlsEnabled:true}))
vi.mock('./officeFeature',()=>flag)
const actions={join:vi.fn(),leave:vi.fn(),setMicrophone:vi.fn(),setCamera:vi.fn(),setScreenShare:vi.fn(),switchDevice:vi.fn(),setOutputVolume:vi.fn(),startAudio:vi.fn()}
function app(value:Partial<OfficeVoiceValue>={}){return <MemoryRouter><OfficeVoiceContext.Provider value={{...initialVoice,...actions,...value}}><OfficeMiniBar/></OfficeVoiceContext.Provider></MemoryRouter>}
beforeEach(()=>{cleanup();vi.clearAllMocks();flag.officeControlsEnabled=true})
it('does not join or capture media when idle or disabled',()=>{const r=render(app());expect(screen.queryByRole('complementary')).toBeNull();r.rerender(app({state:'connected',roomId:'a'}));expect(screen.getByRole('complementary')).toBeVisible();flag.officeControlsEnabled=false;r.rerender(app({state:'connected',roomId:'a'}));expect(screen.queryByRole('complementary')).toBeNull();expect(actions.join).not.toHaveBeenCalled();expect(actions.setMicrophone).not.toHaveBeenCalled()})
it('shows real room, speaker and controls without starting media implicitly',()=>{render(app({roomId:'a',roomName:'Squad',state:'connected',participants:[{id:'one',name:'Alice',speaking:true,microphone:true,quality:'good'}]}));expect(screen.getByRole('status')).toHaveTextContent('Conectado · 1 na sala');expect(screen.getByText('Falando: Alice')).toBeVisible();expect(screen.getByRole('link',{name:'Abrir Escritório Digital'})).toHaveAttribute('href','/office');fireEvent.click(screen.getByRole('button',{name:'Ligar microfone da sala'}));expect(actions.setMicrophone).toHaveBeenCalledWith(true);fireEvent.click(screen.getByRole('button',{name:'Sair da sala de voz'}));expect(actions.leave).toHaveBeenCalledOnce()})
it('disables microphone while reconnecting and shows actionable errors and blocked playback',()=>{const r=render(app({roomId:'a',state:'reconnecting',microphone:true}));expect(screen.getByRole('status')).toHaveTextContent('Reconectando');expect(screen.getByRole('button',{name:'Desligar microfone da sala'})).toBeDisabled();r.rerender(app({state:'error',error:'Conexão encerrada',audioBlocked:true}));expect(screen.getByRole('alert')).toHaveTextContent('Conexão encerrada');expect(screen.queryByText('Falando:')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Ativar áudio da sala'}));expect(actions.startAudio).toHaveBeenCalledOnce()})
