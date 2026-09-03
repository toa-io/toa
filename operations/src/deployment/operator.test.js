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
