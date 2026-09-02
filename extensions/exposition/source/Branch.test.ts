import { it } from 'node:test'
import assert from 'node:assert/strict'

import { decide } from './Branch.js'
import type { Branch, Exposed } from './Branch.js'

function branch (version: string, timestamp: number): Branch {
  return {
    namespace: 'default',
    component: 'one',
    isolated: false,
    node: { routes: [], methods: [], directives: [] },
    version,
    timestamp
  }
}

function exposed (version: string, timestamp: number): Exposed {
  return { version, timestamp, nodes: [] }
}

it('should refresh the same version', () => {
  assert.deepStrictEqual(decide(exposed('a', 1), branch('a', 2)), 'refresh')
})

it('should refresh the same version announced by an older tenant', () => {
  assert.deepStrictEqual(decide(exposed('a', 2), branch('a', 1)), 'refresh')
})

it('should merge a newer tenant', () => {
  assert.deepStrictEqual(decide(exposed('a', 1), branch('b', 2)), 'merge')
})

it('should not merge a tenant that started earlier', () => {
  assert.deepStrictEqual(decide(exposed('b', 2), branch('a', 1)), 'superseded')
})

it('should merge when tenants started at the same time', () => {
  assert.deepStrictEqual(decide(exposed('a', 1), branch('b', 1)), 'merge')
})
