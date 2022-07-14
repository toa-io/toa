'use strict'

const { generate } = require('randomstring')
const { random, letters: { up, down }, encode } = require('@toa.io/libraries/generic')
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
  it('should export POINTER variable', () => {
    const annotation = { default: 'amqps://host0' }
    const json = JSON.stringify(annotation)
    const value = encode(json)
    const output = deployment(PREFIX, instances, annotation)

    expect(output.variables.global).toStrictEqual(expect.arrayContaining([{
      name: `TOA_${up(PREFIX)}_POINTER`,
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

    const env = `TOA_${up(PREFIX)}_`
    const sec = `toa-${down(PREFIX)}-`

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

    const output = deployment(PREFIX, instances, annotation)

    expect(output.variables.global).toStrictEqual(expect.arrayContaining(expected))
  })
})
