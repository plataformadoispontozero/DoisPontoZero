import {it,expect} from 'vitest'
import {VoiceEntryError,voiceEntryMessage,tokenInvocationError} from './voiceErrors'
it('distinguishes token failures from signaling and never displays raw credentials',async()=>{
 for(const [status,code] of [[401,'VOICE_SESSION'],[403,'VOICE_ACCESS'],[429,'VOICE_RATE_LIMIT'],[503,'VOICE_TOKEN_SERVER']] as const){const error=await tokenInvocationError({context:new Response(JSON.stringify({error:'PRIVATE_SECRET'}),{status})});expect(voiceEntryMessage(error,'token')).toContain(code);expect(voiceEntryMessage(error,'token')).not.toContain('PRIVATE_SECRET')}
 expect(voiceEntryMessage(new Error('PRIVATE_TOKEN'),'connection')).toContain('VOICE_CONNECTION')
 expect(voiceEntryMessage(new Error('PRIVATE_TOKEN'),'token')).toContain('VOICE_TOKEN_NETWORK')
 expect(voiceEntryMessage(await tokenInvocationError(new DOMException('PRIVATE','AbortError')),'token')).toContain('VOICE_TOKEN_TIMEOUT')
 expect(voiceEntryMessage(new VoiceEntryError('livekit_not_configured'),'token')).toContain('VOICE_CONFIG')
})
