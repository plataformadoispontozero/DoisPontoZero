const labels: Record<string, string> = { ADMIN: 'Administrador', MANAGER: 'Gestor', MEMBER: 'Colaborador', VIEWER: 'Visualizador' }
export function memberRoleOptions(roles: {id: string; name: string; description?: string | null}[]) {
  return roles.filter(role => role.name !== 'OWNER').map(role => ({
    value: role.id,
    label: `${labels[role.name] ?? role.name}${role.description ? ` — ${role.description}` : ''}`,
  }))
}
