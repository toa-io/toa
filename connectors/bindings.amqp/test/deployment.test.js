'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')
const mock = require('@toa.io/libraries/mock')

const { deployment } = require('../')

/** @type {toa.norm.context.dependencies.Instance[]} */
let instances

/** @returns {URL} */
const gen = () => new URL('amqp://host-' + generate() + ':' + (random(1000) + 1000))

beforeEach(() => {
  instances = mock.dependencies.instances()
})

it('should exist', () => {
  expect(deployment).toBeDefined()
})

it('should throw if annotation is not defined', () => {
  expect(() => deployment(instances, undefined))
    .toThrow('AMQP deployment requires either \'system\' or \'default\' pointer annotation')
})

it('should throw if \'system\' is not defined', () => {
  const url = gen()
  const annotation = {}

  for (const instance of instances) annotation[instance.locator.id] = url.href

  expect(() => deployment(instances, annotation))
    .toThrow('AMQP deployment requires either \'system\' or \'default\' pointer annotation')
})
