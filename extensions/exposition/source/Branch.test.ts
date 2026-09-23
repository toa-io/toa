import { it } from 'node:test'
import assert from 'node:assert/strict'

import { decide } from './Branch.ts'
import type { Branch, Exposed } from './Branch.ts'
import type { Node } from './RTD/index.ts'

function branch(version: string, timestamp: number, routes: string = 'r'): Branch {
  return {
    namespace: 'default',
    component: 'one',
    isolated: false,
    node: { routes: [], methods: [], directives: [] },
    version,
    routes,
    timestamp
  }
}

function exposed(
  version: string,
  timestamp: number,
  routes: string = 'r',
  expirations: number[] = []
): Exposed {
  const nodes = expirations.map((expiration) => ({ expiration }) as Node)

  return { version, routes, timestamp, nodes }
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

it('should not merge a tenant that started earlier while the exposed branch is live', () => {
  const live = Date.now() + 60_000
  const expired = Date.now() - 1

  assert.deepStrictEqual(decide(exposed('b', 2, 'r', [expired, live]), branch('a', 1)), 'superseded')
})

it('should merge a tenant that started earlier once the exposed branch has expired', () => {
  const expired = Date.now() - 1

  assert.deepStrictEqual(decide(exposed('b', 2, 'r', [expired, expired]), branch('a', 1)), 'merge')
})

it('should merge when tenants started at the same time', () => {
  assert.deepStrictEqual(decide(exposed('a', 1), branch('b', 1)), 'merge')
})

it('should merge a version whose routes are the same', () => {
  assert.deepStrictEqual(decide(exposed('a', 1), branch('b', 2)), 'merge')
})

it('should merge the same version whose routes are not', () => {
  assert.deepStrictEqual(decide(exposed('a', 1), branch('a', 2, 'other')), 'merge')
})
