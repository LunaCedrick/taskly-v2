import { describe, expect, it } from 'vitest'
import { authReturnDestination } from '../../src/lib/auth-redirect'

describe('internal auth return destinations', () => {
  it.each([undefined, null, '', 42])('defaults %j to Dashboard', (value) => {
    expect(authReturnDestination(value)).toBe('/')
  })
  it.each(['/', '/tasks', '/projects/project-1?sort=due&query=hello%20world#task-2'])('keeps %s', (value) => {
    expect(authReturnDestination(value)).toBe(value)
  })
  it.each([
    'https://example.com/tasks', '//example.com/tasks', 'javascript:alert(1)',
    '/\\example.com', '/%2f%2fexample.com', '/%5cexample.com', '/tasks\n', '/%00tasks',
    '/sign-in', '/sign-in?returnTo=/tasks#again', '/sign-in/', '/tasks/../sign-in', '/%73ign-in',
    '/SIGN-IN', '/Sign-In/', '/%53IGN-IN', '/%zz',
  ])('rejects external, malformed, or looping destination %j', (value) => {
    expect(authReturnDestination(value)).toBe('/')
  })
})
