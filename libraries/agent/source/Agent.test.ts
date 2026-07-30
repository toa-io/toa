/* eslint-disable no-template-curly-in-string */

import { Agent } from './Agent'

let agent: Agent

beforeEach(() => {
  agent = new Agent()
})

it('should match lines in order with headers in between', () => {
  agent.response = '201 Created\n' +
    'server: Exposition/1.0.0\n' +
    'authorization: Token v3.local.eziy\n' +
    '\n' +
    'id: abc-123'

  const expected = '\n' +
    '      201 Created\n' +
    '      authorization: Token ${{ identity.token }} \n' +
    '\n' +
    '      id: ${{ identity.id }}\n' +
    '    '

  expect(() => agent.responseIncludes(expected)).not.toThrow()

  expect(agent.captures.get('identity.token')).toBe('v3.local.eziy')
  expect(agent.captures.get('identity.id')).toBe('abc-123')
})

it('should not match lines out of order', () => {
  agent.response = 'line 1\nline 2'

  expect(() => agent.responseIncludes('line 2\nline 1')).toThrow(/missing 'line 1'/)
})
