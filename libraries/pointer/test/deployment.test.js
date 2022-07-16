'use strict'

const { generate } = require('randomstring')
const { random, letters: { up, down }, encode } = require('@toa.io/libraries/generic')
const mock = require('@toa.io/libraries/mock')

const { deployment } = require('../')

const prefix = 'foo-bar'

/** @type {toa.norm.context.dependencies.Instance[]} */
let instances

/** @type {toa.pointer.deployment.Options} */
let options

/** @returns {URL} */
const gen = () => new URL('protocol://host-' + generate() + ':' + (random(1000) + 1000))

beforeEach(() => {
  instances = mock.dependencies.instances()
  options = { prefix }
})

it('should be', () => {
  expect(deployment).toBeInstanceOf(Function)
})

it('should throw if protocol is omitted', () => {
  const annotation = { default: 'no-protocol' }

  expect(() => deployment(instances, annotation, options)).toThrow('Invalid URL')
})

it('should throw if hostname is omitted', () => {
  const annotation = { default: 'amqps:///' }

  expect(() => deployment(instances, annotation, options)).toThrow('must contain hostname')
})

describe('proxies', () => {
  it('should create default proxies', () => {
    const url = gen()
    const annotation = { default: url.href }

    /** @returns {toa.deployment.dependency.Proxy[]} */
    const expected = instances.map((instance) => ({
      name: instance.locator.hostname(prefix), target: url.hostname
    }))

    const output = deployment(instances, annotation, options)

    expect(output.proxies).toStrictEqual(expect.arrayContaining(expected))
  })

  it('should create proxies with given values', () => {
    const annotation = {}
    const expected = []

    for (const instance of instances) {
      const url = gen()
      const target = url.hostname

      annotation[instance.locator.id] = url.href
      expected.push({ name: instance.locator.hostname(prefix), target })
    }

    const output = deployment(instances, annotation, options)

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
        name: `${prefix}-${extension}`,
        target
      })
    }

    options.extensions = extensions

    const output = deployment(instances, annotation, options)

    expect(output.proxies).toStrictEqual(expected)
  })
})

describe('variables', () => {
  it('should export POINTER variable', () => {
    const annotation = { default: 'amqps://host0' }
    const json = JSON.stringify(annotation)
    const value = encode(json)
    const output = deployment(instances, annotation, options)

    expect(output.variables.global).toStrictEqual(expect.arrayContaining([{
      name: `TOA_${up(prefix)}_POINTER`,
      value
    }]))
  })

  it('should export USERNAME and PASSWORD for each entry of URI Set', () => {
    const annotation = {
      default: 'amqps://host0',
      system: 'amqps://host2',
      dummies: 'amqps://host3',
      'dummies.one': 'amqps://host4'
    }

    const expected = []

    const env = `TOA_${up(prefix)}_`
    const sec = `toa-${down(prefix)}-`

    for (const key of Object.keys(annotation)) {
      const label = key.replaceAll('.', '-').toLowerCase()

      for (const property of ['username', 'password']) {
        expected.push({
          name: `${env}${up(label)}_${up(property)}`,
          secret: {
            name: `${sec}${down(label)}`,
            key: property
          }
        })
      }
    }

    const output = deployment(instances, annotation, options)

    expect(output.variables.global).toStrictEqual(expect.arrayContaining(expected))
  })
})
