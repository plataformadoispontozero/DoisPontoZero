import {useState} from 'react'
import {Track} from 'livekit-client'
import {VideoTrack,useTracks,type TrackReference} from '@livekit/components-react'
import {useOfficeVoice} from './OfficeVoiceContext'

const trackKey=(track:TrackReference)=>`${track.participant.identity}:${track.source}:${track.publication.trackSid}`
type OfficeVideoTracksProps={names?:ReadonlyMap<string,string|null>;localParticipantId?:string}

/** Presentation layout only; subscriptions and all capture remain owned by the existing room. */
export function OfficeVideoTracks({names,localParticipantId}:OfficeVideoTracksProps={}){
 const tracks=useTracks([Track.Source.Camera,Track.Source.ScreenShare])
 const voice=useOfficeVoice()
 const participantName=(id:string)=>tracks.find(track=>track.participant.identity===id)?.participant.name||names?.get(id)||(id===localParticipantId?'Você':'Membro da equipe')
 const nameOf=(track:TrackReference)=>track.participant.name||names?.get(track.participant.identity)||(track.participant.isLocal||track.participant.identity===localParticipantId?'Você':'Membro da equipe')
 const [pinned,setPinned]=useState<string|null>(null)
 const screens=tracks.filter(track=>track.source===Track.Source.ScreenShare)
 const cameras=tracks.filter(track=>track.source===Track.Source.Camera)
 const featured=screens.find(track=>trackKey(track)===pinned)||screens[0]
 const cameraIdentities=new Set(cameras.map(track=>track.participant.identity))
 const audioOnly=voice.participants.filter(person=>!cameraIdentities.has(person.id))
 const hasParticipants=cameras.length>0||audioOnly.length>0
 if(!tracks.length)return null
 const tile=(track:TrackReference,compact=false)=><figure key={trackKey(track)} className={`relative overflow-hidden rounded-xl border border-white/15 bg-black ${compact?'w-40 shrink-0 lg:w-full':'min-w-0'}`}><VideoTrack trackRef={track} className="aspect-video w-full object-cover"/><figcaption className="truncate bg-black/80 px-3 py-2 text-xs text-white">{nameOf(track)}{track.participant.isLocal&&nameOf(track)!=='Você'?' · Você':''}</figcaption></figure>
 if(!featured)return <section aria-label="Vídeos compartilhados na sala" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cameras.map(track=>tile(track))}</section>
 return <section aria-label="Apresentação da sala" className="space-y-3">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Tela compartilhada em destaque</p><p className="mt-1 text-xs text-zinc-400">{nameOf(featured)} apresenta · participantes ao lado no computador e abaixo no celular.</p></div>{screens.length>1&&<div aria-label="Selecionar compartilhamento" className="flex flex-wrap gap-2">{screens.map(track=><button key={trackKey(track)} type="button" aria-pressed={trackKey(track)===trackKey(featured)} onClick={()=>setPinned(trackKey(track))} className="min-h-11 rounded-lg border border-white/20 px-3 py-2 text-xs aria-pressed:border-orange-400 aria-pressed:text-orange-300">Ver tela de {nameOf(track)}</button>)}</div>}</header>
  <div className={`grid min-w-0 items-start gap-3 ${hasParticipants?'lg:grid-cols-[minmax(0,1fr)_13rem]':''}`}>
   <figure aria-label={`Tela compartilhada por ${nameOf(featured)}`} className="min-w-0 overflow-hidden rounded-xl border border-orange-400/30 bg-black"><VideoTrack key={trackKey(featured)} trackRef={featured} className="h-[62vh] min-h-72 max-h-[52rem] w-full object-contain"/><figcaption className="border-t border-white/10 bg-black/80 px-4 py-2 text-xs text-white">{nameOf(featured)} · Tela fixada</figcaption></figure>
   {hasParticipants&&<aside aria-label="Participantes da apresentação" className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[70vh] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0">{cameras.map(track=>tile(track,true))}{audioOnly.map(person=><div key={person.id} className="flex aspect-video w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#19191f] p-3 lg:w-full"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/15 text-lg text-orange-300">{participantName(person.id).slice(0,1).toUpperCase()}</span><p className="max-w-full truncate text-xs text-zinc-300">{participantName(person.id)}</p><p className="text-[10px] text-zinc-400">{person.speaking?'Falando':'Câmera desligada'}</p></div>)}</aside>}
  </div>
 </section>
}
