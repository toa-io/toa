'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')
const { dependencies } = require('@toa.io/libraries/mock')

const { deployment } = require('../')

/** @returns {URL} */
const gen = () => new URL('amqp://host-' + generate() + ':' + (random(1000) + 1000))

it('should be', () => {
  expect(deployment).toBeDefined()
})

it('should throw if annotation is not defined', () => {
  const instances = []

  expect(() => deployment(instances, undefined)).toThrow('is required')
})

describe('proxies', () => {
  /** @type {toa.norm.context.dependencies.Instance[]} */
  let instances

  /** @type {toa.annotations.URIs} */
  let annotation

  /** @type {URL} */
  let url

  beforeEach(() => {
    instances = dependencies.instances()
    url = gen()
    annotation = { default: url.href }
  })

  it('should define proxies', () => {
    const output = deployment(instances, annotation)

    const proxies = instances.map((instance) => ({
      name: instance.locator.hostname(PREFIX),
      target: url.hostname
    }))

    expect(output.proxies).toStrictEqual(proxies)
  })
})

const PREFIX = 'storages-mongodb'
