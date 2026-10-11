import { describe, expect, it } from 'vitest'
import { localDemoAllowed, routePermission, safeReturnPath } from './access'

describe('agency access boundaries', () => {
  it('never enables demo on a public host or with a configured backend', () => {
    expect(localDemoAllowed('true', 'doispontozero.renatodesigner.com.br', false)).toBe(false)
    expect(localDemoAllowed('true', '127.0.0.1', true)).toBe(false)
    expect(localDemoAllowed(undefined, 'localhost', false)).toBe(false)
    expect(localDemoAllowed('true', 'localhost', false)).toBe(true)
  })
  it('rejects external or recursive post-login redirects', () => {
    for (const path of ['https://example.com', '//example.com', '/\\example.com', '/login', '/reset-password?x=1']) expect(safeReturnPath(path)).toBe('/dashboard')
    expect(safeReturnPath('/projects/123?tab=board')).toBe('/projects/123?tab=board')
  })
  it('requires action-specific permissions for critical pages', () => {
    expect(routePermission('/projects/new')).toBe('projects.create')
    expect(routePermission('/settings/permissions')).toBe('permissions.manage')
    expect(routePermission('/settings/team')).toBe('members.view')
    expect(routePermission('/chat')).toBe('chat.access')
  })
})
