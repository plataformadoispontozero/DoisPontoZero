import {Navigate} from 'react-router-dom'
import {useAuth} from '@/features/auth/AuthProvider'
import {isManagementRole} from '@/features/auth/access'
export function LegacyProjectRedirect(){const auth=useAuth();return <Navigate replace to={isManagementRole(auth.activeAgency?.roleName)?'/projects':'/tasks'}/>}
