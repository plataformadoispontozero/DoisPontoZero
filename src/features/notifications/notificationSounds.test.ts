import {describe,it,expect} from 'vitest'
import {soundKinds,soundNotes,notificationSoundKind} from './notificationSounds'
describe('distinct notification signals',()=>{
 it('provides five different motifs and maps action categories',()=>{
  expect(new Set(soundKinds.map(k=>soundNotes[k].join(','))).size).toBe(5)
  expect(notificationSoundKind('calendar_approved')).toBe('approval')
  expect(notificationSoundKind('task_production')).toBe('production')
  expect(notificationSoundKind('client_created')).toBe('client')
  expect(notificationSoundKind('chat_mention')).toBe('message')
  expect(notificationSoundKind('meeting_invitation')).toBe('meeting')
 })
})
