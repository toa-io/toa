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

    const output = deployment(PREFIX, instances, annotation)

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

    const output = deployment(PREFIX, instances, annotation)

    expect(output.proxies).toStrictEqual(expect.arrayContaining(expected))
  })

  it('should define proxies for extensions', () => {
    const instances = []
    const annotation = {}
    const extensions = ['system', 'else']
    const expected = []

    for (const extension of extensions) {
      const url = gen()
      const target = url.hostname

      annotation[extension] = url.href

      expected.push({
        name: `${PREFIX}-${extension}`,
        target
      })
    }

    const output = deployment(PREFIX, instances, annotation, extensions)

    expect(output.proxies).toStrictEqual(expected)
  })
})

describe('variables', () => {
  it('should export PORT and PROTOCOL', () => {
    const { annotation, variables } = declare('amqps:', random(1000) + 1000)

    const output = deployment(PREFIX, instances, annotation)

    expect(output.variables).toStrictEqual(variables)
  })

  it('should not export PORT if it is not defined', () => {
    const { annotation } = declare('amqps:')

    const output = deployment(PREFIX, instances, annotation)

    for (const instance of instances) {
      const variables = output.variables[instance.locator.label]

      const suffix = up(PREFIX) + '_' + instance.locator.uppercase
      const name = `TOA_${suffix}_PORT`

      const found = variables.find((variable) => variable.name === name)

      expect(found).toStrictEqual(undefined)
    }
  })

  it('should export USERNAME and PASSWORD', () => {
    const { annotation, variables } = declare('amqps:', random(1000) + 1000, true)

    const output = deployment(PREFIX, instances, annotation)

    expect(output.variables).toStrictEqual(variables)
  })

  it('should declare system variables for extensions', () => {
    const instances = []
    const annotation = {}

    const extensions = ['system', 'else']
    const expected = []

    for (const extension of extensions) {
      const url = gen()

      annotation[extension] = url.href

      for (const [property, coercion] of [['protocol', String], ['port', Number]]) {
        expected.push({
          name: up(`TOA_${PREFIX}_${extension}_${property}`),
          value: coercion(url[property])
        })
      }

      for (const secret of ['username', 'password']) {
        expected.push({
          name: up(`TOA_${PREFIX}_${extension}_${secret}`),
          secret: {
            name: `toa-${PREFIX}-${extension}`,
            key: secret
          }
        })
      }
    }

    const output = deployment(PREFIX, instances, annotation, extensions)

    expect(output.variables.system).toStrictEqual(expected)
  })

  /**
   * @param {string} protocol
   * @param {number} [port]
   * @param {boolean} [secrets]
   * @returns {{ annotation: Object, variables: toa.deployment.dependency.Variables }}
   */
  const declare = (protocol, port = undefined, secrets = false) => {
    /** @type {toa.deployment.dependency.Variables} */
    const variables = {}

    const annotation = {}

    for (const instance of instances) {
      const { id, label } = instance.locator
      const url = gen()
      const suffix = up(PREFIX) + '_' + instance.locator.uppercase
      const sfx = PREFIX + '-' + instance.locator.label

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

      if (secrets) {
        expected.push({
          name: `TOA_${suffix}_USERNAME`,
          secret: {
            name: `toa-${sfx}`,
            key: 'username'
          }
        })

        expected.push({
          name: `TOA_${suffix}_PASSWORD`,
          secret: {
            name: `toa-${sfx}`,
            key: 'password'
          }
        })
      }

      annotation[id] = url.href
      variables[label] = expect.arrayContaining(expected)
    }

    return { annotation, variables }
  }
})
