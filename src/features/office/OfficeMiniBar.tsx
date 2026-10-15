import {Link} from 'react-router-dom'
import {Mic,MicOff,LogOut,Headphones} from 'lucide-react'
import {useOfficeVoice} from './OfficeVoiceContext'
import {officeControlsEnabled} from './officeFeature'

export function OfficeMiniBar(){
 const voice=useOfficeVoice()
 if(!officeControlsEnabled||(!voice.roomId&&!voice.error))return null
 const connected=voice.state==='connected'
 const speakers=connected?voice.participants.filter(p=>p.speaking).map(p=>p.name):[]
 const status={idle:'Desconectado',connecting:'Conectando…',connected:'Conectado',reconnecting:'Reconectando…',error:'Desconectado'}[voice.state]
 const button='flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50'
 return <aside aria-label="Controles globais da sala de voz" className="fixed inset-x-3 bottom-20 z-30 rounded-xl border border-orange-500/30 bg-[#1C1C24] p-3 shadow-xl md:bottom-4 md:left-[calc(var(--office-sidebar-width,248px)+2rem)] md:right-8">
  <div className="flex items-center gap-2 sm:gap-3">
   <Link to="/office" aria-label="Abrir Escritório Digital" className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
    <span className="flex items-center gap-2 text-sm font-semibold"><Headphones aria-hidden="true" className="h-4 w-4 shrink-0 text-orange-400"/><span className="truncate">{voice.roomName||'Escritório Digital'}</span></span>
    <span role="status" className="block truncate text-xs text-zinc-400">{status}{connected?` · ${voice.participants.length} na sala`:''}</span>
    {speakers.length>0&&<span className="block truncate text-xs text-emerald-300">Falando: {speakers.join(', ')}</span>}
   </Link>
   {voice.roomId&&<><button type="button" aria-label={voice.microphone?'Desligar microfone da sala':'Ligar microfone da sala'} aria-pressed={voice.microphone} disabled={!connected||voice.microphoneBusy} className={button} onClick={()=>void voice.setMicrophone(!voice.microphone)}>{voice.microphone?<Mic aria-hidden="true" className="h-4 w-4"/>:<MicOff aria-hidden="true" className="h-4 w-4"/>}<span className="hidden sm:inline">{voice.microphone?'Microfone ligado':'Microfone desligado'}</span></button><button type="button" aria-label="Sair da sala de voz" className={button+' border-red-400/40 text-red-200'} onClick={()=>void voice.leave()}><LogOut aria-hidden="true" className="h-4 w-4"/><span className="hidden sm:inline">Sair</span></button></>}
  </div>
  {voice.audioBlocked&&<button type="button" className="mt-2 min-h-11 rounded-lg bg-orange-600 px-3 text-sm" onClick={()=>void voice.startAudio()}>Ativar áudio da sala</button>}
  {voice.error&&<p role="alert" className="mt-2 max-h-24 overflow-y-auto text-xs text-red-200">{voice.error} <Link to="/office" className="underline">Voltar às salas</Link></p>}
 </aside>
}
