export class VoiceEntryError extends Error {
 constructor(public readonly code:string){super(code);this.name='VoiceEntryError'}
}
const messages:Record<string,string>={
 invalid_session:'Sua sessão expirou. Saia da plataforma, entre novamente e tente acessar a sala. [VOICE_SESSION]',
 authentication_required:'Entre novamente na plataforma para acessar a sala. [VOICE_SESSION]',
 room_denied:'Seu usuário não tem acesso a esta sala. Confira o vínculo com a agência e as permissões. [VOICE_ACCESS]',
 livekit_not_configured:'A configuração de voz da agência está indisponível. Confira a integração LiveKit. [VOICE_CONFIG]',
 rate_limited:'Muitas tentativas de entrada. Aguarde um minuto antes de tentar novamente. [VOICE_RATE_LIMIT]',
 backend_unavailable:'O servidor não conseguiu emitir o acesso à sala. Tente novamente em instantes. [VOICE_TOKEN_SERVER]',
 token_network:'Não foi possível comunicar com o servidor de acesso. Confira a conexão e tente novamente. [VOICE_TOKEN_NETWORK]',
 token_timeout:'O servidor de acesso não respondeu no prazo. Tente novamente. [VOICE_TOKEN_TIMEOUT]',
 invalid_token_response:'O servidor retornou um acesso de voz inválido. Confira a integração LiveKit. [VOICE_TOKEN_RESPONSE]',
}
export function voiceEntryMessage(error:unknown,stage:'token'|'connection'|'media'){
 if(error instanceof VoiceEntryError&&messages[error.code])return messages[error.code]
 if(stage==='token')return messages.token_network
 const reason=(error as {reason?:unknown})?.reason
 if(stage==='media')return 'O LiveKit aceitou a entrada, mas o transporte de áudio não conectou. Confira a rede ou teste outra conexão. [VOICE_MEDIA]'
 if(reason===0)return 'O LiveKit recusou o acesso emitido. Confira se URL e chaves pertencem ao mesmo projeto. [VOICE_SIGNAL_REJECTED]'
 if(reason===5)return 'O LiveKit não respondeu à negociação no prazo. [VOICE_SIGNAL_TIMEOUT]'
 if(reason===6)return 'A conexão WebSocket com o LiveKit falhou. [VOICE_SIGNAL_WEBSOCKET]'
 if(reason===7)return 'O serviço de voz não foi encontrado no endereço configurado. [VOICE_SIGNAL_SERVICE]'
 if(reason===1)return 'Não foi possível alcançar o servidor LiveKit. Confira o endereço e a conectividade. [VOICE_SIGNAL_UNREACHABLE]'
 return 'O acesso à sala foi emitido, mas a conexão de voz não foi estabelecida. Confira a rede, VPN ou firewall e tente novamente. [VOICE_CONNECTION]'
}
export async function tokenInvocationError(error:unknown){
 const candidate=error as {context?:Response;name?:string}
 if(candidate?.context instanceof Response){
  try{const data=await candidate.context.clone().json();if(typeof data?.error==='string'&&messages[data.error])return new VoiceEntryError(data.error)}catch{/* Only predefined messages may reach the UI. */}
  if(candidate.context.status===401)return new VoiceEntryError('invalid_session')
  if(candidate.context.status===403)return new VoiceEntryError('room_denied')
  if(candidate.context.status===429)return new VoiceEntryError('rate_limited')
  return new VoiceEntryError('backend_unavailable')
 }
 return new VoiceEntryError(candidate?.name==='AbortError'?'token_timeout':'token_network')
}
