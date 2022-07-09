'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')
const mock = require('@toa.io/libraries/mock')

const { deployment } = require('../')

const PREFIX = 'FOO-BAR'

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
