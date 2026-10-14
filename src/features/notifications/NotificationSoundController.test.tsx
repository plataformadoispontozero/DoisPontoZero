import {render} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {NotificationSoundController} from './NotificationSoundController';
const state=vi.hoisted(()=>({data:[] as Array<{id:string;agency_id:string;recipient_id:string;type:string;title:string;read_at:null}>,play:vi.fn(()=>true)}));
vi.mock('@/features/auth/AuthProvider',()=>({useAuth:()=>({user:{id:'member'},activeAgency:{agencyId:'agency'}})}));
vi.mock('./hooks/useNotifications',()=>({useNotifications:()=>({data:state.data})}));
vi.mock('./useSoundPreference',()=>({useSoundPreference:()=>({preference:{enabled:true,volume:.5}})}));
vi.mock('./notificationSounds',async()=>{const actual=await vi.importActual<typeof import('./notificationSounds')>('./notificationSounds');return {...actual,playNotificationSound:state.play,unlockNotificationAudio:async()=>{}};});
vi.mock('@/components/ui/Toast',()=>({toast:{info:vi.fn()}}));
it('uses persisted recipient events once, ignores history and other tenants without secondary source polling',()=>{
 const event=(id:string,agency_id='agency')=>({id,agency_id,recipient_id:'member',type:'calendar_approved',title:'Calendário aprovado',read_at:null});
 state.data=[event('old')];state.play.mockClear();const view=render(<NotificationSoundController/>);expect(state.play).not.toHaveBeenCalled();state.data=[...state.data,event('new')];view.rerender(<NotificationSoundController/>);expect(state.play).toHaveBeenCalledExactlyOnceWith('approval',.5);view.rerender(<NotificationSoundController/>);expect(state.play).toHaveBeenCalledTimes(1);state.data=[...state.data,event('foreign','other-agency')];view.rerender(<NotificationSoundController/>);expect(state.play).toHaveBeenCalledTimes(1);
});
