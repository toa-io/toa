import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

/* eslint-disable no-template-curly-in-string */

import { Agent } from './Agent.ts'

let agent: Agent

beforeEach(() => {
  agent = new Agent()
})

it('should match lines in order with headers in between', () => {
  agent.response =
    '201 Created\n' +
    'server: Exposition/1.0.0\n' +
    'authorization: Token v3.local.eziy\n' +
    '\n' +
    'id: abc-123'

  const expected =
    '\n' +
    '      201 Created\n' +
    '      authorization: Token ${{ identity.token }} \n' +
    '\n' +
    '      id: ${{ identity.id }}\n' +
    '    '

  assert.doesNotThrow(() => agent.responseIncludes(expected))

  assert.strictEqual(agent.captures.get('identity.token'), 'v3.local.eziy')
  assert.strictEqual(agent.captures.get('identity.id'), 'abc-123')
})

// what a reply holds is what it is asserted on; where a line stands in it is the encoder's,
// and an entity's properties are in the order its record holds them
it('should match lines wherever they are', () => {
  agent.response = 'line 1\nline 2'

  assert.doesNotThrow(() => agent.responseIncludes('line 2\nline 1'))
})

// where a suite asserts the order too, which a userspace one may
it('should not match lines out of order where the order is asserted', () => {
  agent.response = 'line 1\nline 2'

  assert.doesNotThrow(() => agent.responseIncludesInOrder('line 1\nline 2'))

  assert.throws(
    () => agent.responseIncludesInOrder('line 2\nline 1'),
    (error: any) => /missing 'line 1'/.test(error.message)
  )
})

it('should not match a line the reply does not hold', () => {
  agent.response = 'line 1\nline 2'

  assert.throws(
    () => agent.responseIncludes('line 1\nline 3'),
    (error: any) => /missing 'line 3'/.test(error.message)
  )
})
