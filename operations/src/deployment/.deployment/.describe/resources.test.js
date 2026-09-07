import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { resources, quantity } from './resources.js'

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

    assert.throws(
      () => resources({}, values),
      (error) => /^Composition 'edge' declares no resources\./.test(error.message)
    )
  })

  it('should refuse a service that declares none', () => {
    const values = { services: [{ name: 'exposition-gateway' }] }

    assert.throws(
      () => resources({}, values),
      (error) =>
        /^Service 'exposition-gateway' declares no resources\./.test(error.message)
    )
  })

  it('should refuse the mono deployment when it declares none', () => {
    const values = { mono: {} }

    assert.throws(
      () => resources({}, values),
      (error) => /^The mono deployment declares no resources\./.test(error.message)
    )
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

describe('heap', () => {
  it('should size the heap by the memory limit', () => {
    const values = { compositions: [{ name: 'edge', resources: declared }] }

    resources({}, values)

    assert.deepStrictEqual(values.compositions[0].variables, [
      { name: 'NODE_OPTIONS', value: '--max-old-space-size=768' }
    ])
  })

  it('should size the heap of a service and of the mono deployment', () => {
    const values = {
      services: [
        { name: 'exposition-gateway', resources: { memory: ['200Mi', '500Mi'] } }
      ],
      mono: { variables: [{ name: 'TOA_ENV', value: 'test' }] }
    }

    resources({ resources: declared }, values)

    assert.deepStrictEqual(values.services[0].variables, [
      { name: 'NODE_OPTIONS', value: '--max-old-space-size=375' }
    ])

    assert.deepStrictEqual(values.mono.variables, [
      { name: 'TOA_ENV', value: 'test' },
      { name: 'NODE_OPTIONS', value: '--max-old-space-size=768' }
    ])
  })

  it('should keep the options a deployment states', () => {
    const variables = [{ name: 'NODE_OPTIONS', value: '--max-old-space-size=100' }]
    const values = { compositions: [{ name: 'edge', resources: declared, variables }] }

    resources({}, values)

    assert.deepStrictEqual(values.compositions[0].variables, variables)
  })

  it('should not size the heap without a memory limit', () => {
    const values = { compositions: [{ name: 'edge', resources: { cpu: ['100m', '1'] } }] }

    resources({}, values)

    assert.strictEqual(values.compositions[0].variables, undefined)
  })

  it('should read a quantity', () => {
    assert.strictEqual(quantity('512Mi'), 512 * 2 ** 20)
    assert.strictEqual(quantity('1Gi'), 2 ** 30)
    assert.strictEqual(quantity('500M'), 500e6)
    assert.strictEqual(quantity('1.5Gi'), 1.5 * 2 ** 30)
    assert.strictEqual(quantity(1024), 1024)
    assert.throws(() => quantity('500m'), /not a memory quantity/)
    assert.throws(() => quantity('big'), /not a quantity/)
  })
})
