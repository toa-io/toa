import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Operator } from '../../src/deployment/operator.js'
import { generate } from 'randomstring'

it('should be', async () => {
  assert.ok(Operator instanceof Function)
})

/** @type {toa.deployment.Operator} */
let operator

describe('env', () => {
  /** @type {toa.deployment.Deployment} */
  let deployment

  /** @type {toa.deployment.Registry} */
  let registry

  beforeEach(() => {
    deployment = /** @type {toa.deployment.Deployment} */ {}
    registry = /** @type {toa.deployment.Registry} */ {}
  })

  it('should be', async () => {
    operator = new Operator(deployment, registry)

    assert.ok(operator.variables instanceof Function)
  })

  it('should return variables', async () => {
    const variables = { [generate()]: { name: generate(), value: generate() } }

    deployment.variables =
      /** @type {typeof toa.deployment.Operator.variables} */
      mock.fn(() => variables)

    operator = new Operator(deployment, registry)

    const output = operator.variables()

    assert.deepStrictEqual(output, variables)
  })
})

describe('install', () => {
  /** @type {toa.deployment.Deployment} */
  let deployment

  /** @type {toa.deployment.Registry} */
  let registry

  beforeEach(() => {
    deployment = /** @type {toa.deployment.Deployment} */ {
      export: mock.fn(async () => {}),
      install: mock.fn(async () => {})
    }
    registry = /** @type {toa.deployment.Registry} */ {
      push: mock.fn(async () => {}),
      alias: mock.fn(async () => {})
    }
  })

  it('should tag the environment after a push', async () => {
    const order = []

    registry.push = mock.fn(async () => {
      order.push('push')
    })
    registry.alias = mock.fn(async () => {
      order.push('alias')
    })
    deployment.install = mock.fn(async () => {
      order.push('install')
    })

    operator = new Operator(deployment, registry, 'production')

    await operator.install()

    assert.deepStrictEqual(order, ['push', 'alias', 'install'])
    assert.deepStrictEqual(registry.alias.mock.calls[0].arguments, ['production'])
  })

  it('should not tag the environment on push', async () => {
    operator = new Operator(deployment, registry, 'production')

    await operator.push()

    assert.strictEqual(registry.push.mock.callCount(), 1)
    assert.strictEqual(registry.alias.mock.callCount(), 0)
  })
})
