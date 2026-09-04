import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { fold } from './fold.js'

const service = (name, extra = {}) => ({ group: 'group', name, version: '0', ...extra })

it('should collect the ports of every service', () => {
  const workload = {}

  fold(workload, [service('one', { port: 8000 }), service('two', { port: 8002 })], {})

  assert.deepStrictEqual(workload.backends,
    [{ port: 8000, path: '/' }, { port: 8002, path: '/' }])
})

it('should take the path a service declares', () => {
  const workload = {}

  fold(workload, [service('one', { port: 8002, ingress: { path: '/explorer' } })], {})

  assert.deepStrictEqual(workload.backends, [{ port: 8002, path: '/explorer' }])
})

it('should put the more specific prefix first', () => {
  const workload = {}

  fold(workload, [
    service('one', { port: 8000, ingress: { path: '/' } }),
    service('two', { port: 8002, ingress: { path: '/explorer' } })
  ], {})

  assert.deepStrictEqual(workload.backends.map((backend) => backend.path), ['/explorer', '/'])
})

it('should leave a service without a port out of the backends', () => {
  const workload = {}

  fold(workload, [service('one')], {})

  assert.strictEqual(workload.backends, undefined)
})

describe('variables', () => {
  it('should take those of every service', () => {
    const workload = {}

    fold(workload, [
      service('one', { variables: [{ name: 'A', value: '1' }] }),
      service('two', { variables: [{ name: 'B', value: '2' }] })
    ], {})

    assert.deepStrictEqual(workload.variables, [{ name: 'A', value: '1' }, { name: 'B', value: '2' }])
  })

  it('should keep the first of a name', () => {
    const workload = { variables: [{ name: 'A', value: 'own' }] }

    fold(workload, [service('one', { variables: [{ name: 'A', value: 'theirs' }] })], {})

    assert.deepStrictEqual(workload.variables, [{ name: 'A', value: 'own' }])
  })
})

describe('probe', () => {
  const probe = { path: '/.ready', port: 8004 }
  const fallback = { path: '/.ready', port: 8001 }

  it('should take the probe of a service over the default', () => {
    const workload = {}

    fold(workload, [service('one', { port: 8000, probe })], { probe: fallback })

    assert.deepStrictEqual(workload.probe, probe)
  })

  it('should fall back to the default', () => {
    const workload = {}

    fold(workload, [service('one', { port: 8000 })], { probe: fallback })

    assert.deepStrictEqual(workload.probe, fallback)
  })

  it('should ignore a disabled probe', () => {
    const workload = {}

    fold(workload, [service('one', { port: 8000, probe: false })], { probe: false })

    assert.strictEqual(workload.probe, undefined)
  })
})
