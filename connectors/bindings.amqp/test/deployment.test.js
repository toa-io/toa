'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./deployment.fixtures')
const { deployment } = require('../')

/** @type {toa.norm.context.dependencies.Instance[]} */
let instances

beforeEach(() => {
  instances = clone(fixtures.instances)
})

it('should exist', () => {
  expect(deployment).toBeDefined()
})

it('should create default proxies', () => {
  const annotation = { default: generate() }

  /** @returns {toa.operations.deployment.dependency.Proxy[]} */
  const proxies = instances.map((instance) => ({
    name: PREFIX + instance.locator.label, target: annotation.default
  }))

  const output = deployment(instances, annotation)

  expect(output.proxies).toStrictEqual(expect.arrayContaining(proxies))
})

it('should create proxies with given values', () => {
  const annotation = {}
  const proxies = []

  for (const instance of instances) {
    const target = generate()

    annotation[instance.locator.id] = target
    proxies.push({ name: PREFIX + instance.locator.label, target })
  }

  const output = deployment(instances, annotation)

  expect(output.proxies).toMatchObject(proxies)
})

const PREFIX = 'bindings-amqp-'
