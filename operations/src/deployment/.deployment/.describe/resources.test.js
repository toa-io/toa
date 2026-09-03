import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { resources } from './resources.js'

const declared = { cpu: ['100m', '1'], memory: ['100Mi', '1Gi'] }

it('should take the declaration of a deployment', () => {
  const values = { compositions: [{ name: 'edge', resources: declared }] }

  resources({}, values)

  assert.deepStrictEqual(values.compositions[0].resources, declared)
})

it('should fall back to the context', () => {
  const values = { compositions: [{ name: 'edge' }] }

  resources({ resources: declared }, values)

  assert.deepStrictEqual(values.compositions[0].resources, declared)
})

it('should take `null` as an answer', () => {
  const values = { compositions: [{ name: 'edge', resources: null }] }

  assert.doesNotThrow(() => resources({ resources: declared }, values))
  assert.strictEqual(values.compositions[0].resources, null)
})

describe('refusal', () => {
  it('should refuse a composition that declares none', () => {
    const values = { compositions: [{ name: 'edge' }] }

    assert.throws(() => resources({}, values),
      (error) => /^Composition 'edge' declares no resources\./.test(error.message))
  })

  it('should refuse a service that declares none', () => {
    const values = { services: [{ name: 'exposition-gateway' }] }

    assert.throws(() => resources({}, values),
      (error) => /^Service 'exposition-gateway' declares no resources\./.test(error.message))
  })

  it('should refuse the mono deployment when it declares none', () => {
    const values = { mono: {} }

    assert.throws(() => resources({}, values),
      (error) => /^The mono deployment declares no resources\./.test(error.message))
  })

  it('should not ask a service a composition runs', () => {
    // it has no deployment of its own to size; the composition running it states the pod's
    const values = {
      compositions: [{ name: 'edge', resources: declared }],
      services: [{ name: 'exposition-gateway', workload: ['edge'] }]
    }

    assert.doesNotThrow(() => resources({}, values))
    assert.strictEqual(values.services[0].resources, undefined)
  })
})
