'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')

const fixtures = require('./deployment.fixtures')
const { deployment } = require('../')

/** @type {toa.norm.context.dependencies.Instance[]} */
let instances

/** @returns {URL} */
const gen = () => new URL('amqp://host-' + generate() + ':' + (random(1000) + 1000))

beforeEach(() => {
  instances = clone(fixtures.instances)
})

it('should exist', () => {
  expect(deployment).toBeDefined()
})

it('should create default proxies', () => {
  const url = gen()
  const annotation = { default: url.href }

  /** @returns {toa.operations.deployment.dependency.Proxy[]} */
  const proxies = instances.map((instance) => ({
    name: instance.locator.hostname(PREFIX), target: url.hostname
  }))

  const output = deployment(instances, annotation)

  expect(output.proxies).toStrictEqual(expect.arrayContaining(proxies))
})

it('should create proxies with given values', () => {
  const url = gen()
  const annotation = { system: url.href }
  const proxies = []

  for (const instance of instances) {
    const url = gen()
    const target = url.hostname
    const value = url.href
    const { name, namespace } = instance.locator

    annotation[namespace] = { [name]: value }
    proxies.push({ name: instance.locator.hostname(PREFIX), target })
  }

  const output = deployment(instances, annotation)

  expect(output.proxies).toStrictEqual(expect.arrayContaining(proxies))
})

it('should create system proxy', () => {
  const url = gen()
  const annotation = { default: url.href }
  const instances = []

  const output = deployment(instances, annotation)

  expect(output.proxies).toStrictEqual([{
    name: PREFIX + '-system',
    target: url.hostname
  }])
})

it('should throw if system is not defined', () => {
  const annotation = {}
  const instances = []

  expect(() => deployment(instances, annotation)).toThrow('not found')
})

it('should throw if annotation is not defined', () => {
  expect(() => deployment(instances, undefined)).toThrow('AMQP deployment requires either \'system\' or \'default\' URI annotation')
})

const PREFIX = 'bindings-amqp'
