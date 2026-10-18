import {createContext,useContext} from 'react'
import type {PresenceSnapshot} from './presenceSession'
export interface OfficePresenceValue extends PresenceSnapshot{enabled:boolean;roomId:string|null;setRoom:(id:string)=>void;setAvailability:(status:'available'|'away'|'busy')=>void;leave:()=>void;retry:()=>void}
export const initialPresence:PresenceSnapshot={connection:'connecting',people:[]}
export const OfficePresenceContext=createContext<OfficePresenceValue>({...initialPresence,enabled:false,roomId:null,setRoom:()=>{},setAvailability:()=>{},leave:()=>{},retry:()=>{}})
export function useOfficePresence(){return useContext(OfficePresenceContext)}
