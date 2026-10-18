// Controlled UI fixture only. Not an application entry or a real media connection.
import {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter,Link,useLocation} from 'react-router-dom'
import {OfficeMiniBar} from '../../src/features/office/OfficeMiniBar'
import {OfficeVoiceContext} from '../../src/features/office/OfficeVoiceContext'
import {initialVoice,type VoiceSnapshot} from '../../src/features/office/voiceState'
import '../../src/styles/index.css'
function Fixture(){const [voice,setVoice]=useState<VoiceSnapshot>({...initialVoice,roomId:'qa-room',roomName:'Squad Criativo',state:'connected',participants:[{id:'qa',name:'Alice QA',speaking:true,microphone:true,quality:'excellent'}]});const location=useLocation();return <OfficeVoiceContext.Provider value={{...voice,join:async()=>{},leave:async()=>setVoice(initialVoice),setMicrophone:async microphone=>setVoice(v=>({...v,microphone})),setCamera:async camera=>setVoice(v=>({...v,camera})),setScreenShare:async screenShare=>setVoice(v=>({...v,screenShare})),switchDevice:async()=>true,setOutputVolume:()=>{},startAudio:async()=>setVoice(v=>({...v,audioBlocked:false}))}}><div className="min-h-screen bg-[#101014] p-4 text-white"><h1>Teste controlado · {location.pathname}</h1><Link to="?route=tasks">Navegar</Link><button onClick={()=>setVoice(v=>({...v,state:'reconnecting'}))}>Simular reconexão</button><button onClick={()=>setVoice(v=>({...v,state:'connected'}))}>Restaurar conexão</button><div className="h-[1600px]">Conteúdo da página</div><button className="mb-64">Salvar no fim da página</button><OfficeMiniBar/><nav aria-label="Navegação rápida mobile" className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around bg-zinc-900 md:hidden"><button>Início</button><button>Tarefas</button></nav></div></OfficeVoiceContext.Provider>}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Fixture/></BrowserRouter>)
