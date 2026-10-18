import {Navigate} from 'react-router-dom'
import {officeEnabled} from './officeFeature'
import {ChatPage} from '@/features/chat/ChatPage'
export function OfficePage(){return officeEnabled?<ChatPage officeMode/>:<Navigate to="/chat" replace/>}

export function ChatEntryPage(){return officeEnabled?<Navigate to="/office" replace/>:<ChatPage/>}
