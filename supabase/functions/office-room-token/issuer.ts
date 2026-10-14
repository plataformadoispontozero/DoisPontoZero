import {AccessToken,TrackSource} from 'livekit-server-sdk'
import type {VoiceContext,TokenConfiguration} from './handler.ts'
export async function issueVoiceToken(context:VoiceContext,configuration:TokenConfiguration){
 const token=new AccessToken(configuration.apiKey,configuration.apiSecret,{identity:context.user_id,ttl:120})
 token.addGrant({roomJoin:true,room:context.room_name,canSubscribe:true,canPublish:true,canPublishSources:[TrackSource.MICROPHONE],canPublishData:false,canUpdateOwnMetadata:false,roomAdmin:false,roomCreate:false,roomList:false,roomRecord:false,ingressAdmin:false})
 return await token.toJwt()
}
