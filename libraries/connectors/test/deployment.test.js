'use strict'

const { generate } = require('randomstring')
const { random, letters: { up } } = require('@toa.io/libraries/generic')
const mock = require('@toa.io/libraries/mock')

const { deployment } = require('../')

const PREFIX = 'foo-bar'

/** @type {toa.norm.context.dependencies.Instance[]} */
let instances

/** @returns {URL} */
const gen = () => new URL('protocol://host-' + generate() + ':' + (random(1000) + 1000))

beforeEach(() => {
  instances = mock.dependencies.instances()
})

it('should be', () => {
  expect(deployment).toBeInstanceOf(Function)
})

describe('proxies', () => {
  it('should create default proxies', () => {
    const url = gen()
    const annotation = { default: url.href }

    /** @returns {toa.deployment.dependency.Proxy[]} */
    const expected = instances.map((instance) => ({
      name: instance.locator.hostname(PREFIX), target: url.hostname
    }))

    const output = deployment(instances, annotation, PREFIX)

    expect(output.proxies).toStrictEqual(expect.arrayContaining(expected))
  })

  it('should create proxies with given values', () => {
    const annotation = {}
    const expected = []

    for (const instance of instances) {
      const url = gen()
      const target = url.hostname

      annotation[instance.locator.id] = url.href
      expected.push({ name: instance.locator.hostname(PREFIX), target })
    }

    const output = deployment(instances, annotation, PREFIX)

    expect(output.proxies).toStrictEqual(expect.arrayContaining(expected))
  })
})

describe('variables', () => {
  it('should export PORT and PROTOCOL', () => {
    const { annotation, variables } = declare('amqps:', random(1000) + 1000)

    const output = deployment(instances, annotation, PREFIX)

    expect(output.variables).toStrictEqual(variables)
  })

  it('should not export PORT if it is not defined', () => {
    const { annotation } = declare('amqps:')

    const output = deployment(instances, annotation, PREFIX)

    for (const instance of instances) {
      const variables = output.variables[instance.locator.label]

      const suffix = up(PREFIX) + '_' + instance.locator.uppercase

      expect(variables.length).toStrictEqual(1)

      expect(variables[0]).toStrictEqual({
        name: `TOA_${suffix}_PROTOCOL`,
        value: 'amqps:'
      })
    }
  })

  /**
   * @param {string} protocol
   * @param {number} [port]
   * @returns {{ annotation: Object, variables: toa.deployment.dependency.Variables}}
   */
  const declare = (protocol, port) => {
    /** @type {toa.deployment.dependency.Variables} */
    const variables = {}

    const annotation = {}

    for (const instance of instances) {
      const { id, label } = instance.locator
      const url = gen()
      const suffix = up(PREFIX) + '_' + instance.locator.uppercase

      url.port = port === undefined ? '' : String(port)
      url.protocol = protocol === undefined ? '' : protocol

      /** @type {toa.deployment.dependency.Variable[]} */
      const expected = []

      if (port !== undefined) {
        expected.push({
          name: `TOA_${suffix}_PORT`,
          value: +url.port
        })
      }

      if (protocol !== undefined) {
        expected.push({
          name: `TOA_${suffix}_PROTOCOL`,
          value: url.protocol
        })
      }

      annotation[id] = url.href
      variables[label] = expect.arrayContaining(expected)
    }

    return { annotation, variables }
  }
})
