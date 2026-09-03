import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { type Component } from '@toa.io/core'
import { generate } from 'randomstring'
import { Role } from './Role.js'
import { type Identity } from './types.js'
import type { Parameter } from '../../RTD/index.js'

const remote = {
  invoke: mock.fn()
} as unknown as Component

const discovery = Promise.resolve(remote)

beforeEach(() => {
  resetCalls()
})

it('should return false if not matched', async () => {
  const roles = ['admin', 'user']
  const directive = new Role(roles, discovery)

  const identity: Identity = {
    id: generate(),
    scheme: '',
    refresh: false
  }

  remote.invoke.mock.mockImplementationOnce(async () => ['guest'])

  const result = await directive.authorize(identity, undefined, [])

  assert.strictEqual(result, false)

  assert.ok(remote.invoke.mock.calls.some((call: any) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], 'list') && isDeepStrictEqual(call.arguments[1], {
      query: {
        criteria: `identity=="${identity.id}"`,
        limit: 1024
      }
    })))
})

it('should return true on exact match', async () => {
  const result = await match(['admin', 'user'], ['user'])

  assert.strictEqual(result, true)
})

it('should return true on scope match', async () => {
  const result = await match(['system:identity:roles'], ['system'])

  assert.strictEqual(result, true)
})

it('should return false on scope mismatch', async () => {
  const result = await match(['system:identity'], ['system:identity:roles'])

  assert.strictEqual(result, false)
})

it('should return false on non-scope substring match', async () => {
  const result = await match(['system:identity'], ['system:iden'])

  assert.strictEqual(result, false)
})

it('should return true on match with parameters', async () => {
  const result = await match(['app:{org}:reviews'],
    ['app:29e54ae1:reviews'], [{
      name: 'org',
      value: '29e54ae1'
    }])

  assert.strictEqual(result, true)
})

it('should return true on match with parameters', async () => {
  const result = await match(['app:{org}:reviews'],
    ['app:29e54ae1:reviews'], [{
      name: 'org',
      value: '29e54ae1'
    }])

  assert.strictEqual(result, true)
})

it('should return false on mismatch with parameters', async () => {
  const result = await match(['app:{org}:reviews'],
    ['app:29e54ae1:reviews'], [{
      name: 'org',
      value: '88584c9b'
    }])

  assert.strictEqual(result, false)
})

async function match (expected: string[], actual: string[], parameters: Parameter[] = []): Promise<boolean> {
  const directive = new Role(expected, discovery)

  const identity: Identity = {
    id: generate(),
    scheme: '',
    refresh: false
  }

  remote.invoke.mock.mockImplementationOnce(async () => actual)

  return await directive.authorize(identity, undefined, parameters)
}

function resetCalls (target = [remote, discovery], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
