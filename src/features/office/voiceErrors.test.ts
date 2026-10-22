import {it,expect} from 'vitest'
import {VoiceEntryError,voiceEntryMessage,tokenInvocationError} from './voiceErrors'
it('distinguishes token failures from signaling and never displays raw credentials',async()=>{
 for(const [status,code] of [[401,'VOICE_SESSION'],[403,'VOICE_ACCESS'],[429,'VOICE_RATE_LIMIT'],[503,'VOICE_TOKEN_SERVER']] as const){const error=await tokenInvocationError({context:new Response(JSON.stringify({error:'PRIVATE_SECRET'}),{status})});expect(voiceEntryMessage(error,'token')).toContain(code);expect(voiceEntryMessage(error,'token')).not.toContain('PRIVATE_SECRET')}
 expect(voiceEntryMessage({reason:0,message:'PRIVATE_TOKEN'},'connection')).toContain('VOICE_SIGNAL_REJECTED')
 expect(voiceEntryMessage({reason:5},'connection')).toContain('VOICE_SIGNAL_TIMEOUT')
 expect(voiceEntryMessage({reason:6},'connection')).toContain('VOICE_SIGNAL_WEBSOCKET')
 expect(voiceEntryMessage({},'media')).toContain('VOICE_MEDIA')
 expect(voiceEntryMessage(new Error('PRIVATE_TOKEN'),'connection')).toContain('VOICE_CONNECTION')
 expect(voiceEntryMessage(new Error('PRIVATE_TOKEN'),'token')).toContain('VOICE_TOKEN_NETWORK')
 expect(voiceEntryMessage(await tokenInvocationError(new DOMException('PRIVATE','AbortError')),'token')).toContain('VOICE_TOKEN_TIMEOUT')
 expect(voiceEntryMessage(new VoiceEntryError('livekit_not_configured'),'token')).toContain('VOICE_CONFIG')
})

import {DisconnectReason} from 'livekit-client'
import {voiceDisconnectMessage} from './voiceErrors'
it('maps terminal SDK disconnect reasons to safe, actionable diagnostics',()=>{
 for(const [reason,code]of [[DisconnectReason.DUPLICATE_IDENTITY,'VOICE_DUPLICATE_IDENTITY'],[DisconnectReason.PARTICIPANT_REMOVED,'VOICE_PARTICIPANT_REMOVED'],[DisconnectReason.ROOM_DELETED,'VOICE_ROOM_DELETED'],[DisconnectReason.ROOM_CLOSED,'VOICE_ROOM_CLOSED'],[DisconnectReason.SERVER_SHUTDOWN,'VOICE_SERVER_SHUTDOWN'],[DisconnectReason.MIGRATION,'VOICE_SERVER_MIGRATION'],[DisconnectReason.STATE_MISMATCH,'VOICE_STATE_MISMATCH'],[DisconnectReason.JOIN_FAILURE,'VOICE_JOIN_FAILURE'],[DisconnectReason.SIGNAL_CLOSE,'VOICE_SIGNAL_CLOSED'],[DisconnectReason.CONNECTION_TIMEOUT,'VOICE_CONNECTION_TIMEOUT'],[DisconnectReason.MEDIA_FAILURE,'VOICE_MEDIA_FAILURE']]as const)expect(voiceDisconnectMessage(reason)).toContain(code)
 expect(voiceDisconnectMessage(DisconnectReason.DUPLICATE_IDENTITY)).toContain('contas diferentes')
 expect(voiceDisconnectMessage({message:'PRIVATE_TOKEN'})).toContain('VOICE_DISCONNECTED')
 expect(voiceDisconnectMessage({message:'PRIVATE_TOKEN'})).not.toContain('PRIVATE_TOKEN')
})
