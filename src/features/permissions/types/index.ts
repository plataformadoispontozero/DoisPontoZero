export interface Permission {
  id: string
  permissionKey: string
  module: string
  description: string
}

export interface Role {
  id: string
  agencyId: string
  name: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' | string
  description: string | null
  isSystem: boolean
  createdAt: string
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  allowed: boolean
}

export interface ModulePermissionsGroup {
  module: string
  moduleLabel: string
  permissions: {
    id: string
    key: string
    description: string
    allowed: boolean
    isLockedBySystem?: boolean
  }[]
}
