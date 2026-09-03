import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

/* eslint-disable no-template-curly-in-string */

import { Agent } from './Agent.js'

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

  assert.doesNotThrow(() => agent.responseIncludes(expected))

  assert.strictEqual(agent.captures.get('identity.token'), 'v3.local.eziy')
  assert.strictEqual(agent.captures.get('identity.id'), 'abc-123')
})

it('should not match lines out of order', () => {
  agent.response = 'line 1\nline 2'

  assert.throws(() => agent.responseIncludes('line 2\nline 1'), (error: any) => /missing 'line 1'/.test(error.message))
})
