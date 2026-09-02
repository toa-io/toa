import { decide } from './Branch'
import type { Branch, Exposed } from './Branch'

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
  expect(decide(exposed('a', 1), branch('a', 2))).toStrictEqual('refresh')
})

it('should refresh the same version announced by an older tenant', () => {
  expect(decide(exposed('a', 2), branch('a', 1))).toStrictEqual('refresh')
})

it('should merge a newer tenant', () => {
  expect(decide(exposed('a', 1), branch('b', 2))).toStrictEqual('merge')
})

it('should not merge a tenant that started earlier', () => {
  expect(decide(exposed('b', 2), branch('a', 1))).toStrictEqual('superseded')
})

it('should merge when tenants started at the same time', () => {
  expect(decide(exposed('a', 1), branch('b', 1))).toStrictEqual('merge')
})
