export interface Agency {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  symbolUrl?: string | null
  status: 'active' | 'suspended' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface UserAgencyMembership {
  agency: Agency
  roleId: string
  roleName: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' | string
  isOwner: boolean
  status: 'active' | 'invited' | 'suspended'
}
