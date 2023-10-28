'use strict'

const { Operator } = require('../../src/deployment/operator')
const { generate } = require('randomstring')

it('should be', async () => {
  expect(Operator).toBeInstanceOf(Function)
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

    expect(operator.variables).toBeInstanceOf(Function)
  })

  it('should return variables', async () => {
    const variables = { [generate()]: { name: generate(), value: generate() } }

    deployment.variables =
      /** @type {typeof toa.deployment.Operator.variables} */
      jest.fn(() => variables)

    operator = new Operator(deployment, registry)

    const output = operator.variables()

    expect(output).toStrictEqual(variables)
  })
})
