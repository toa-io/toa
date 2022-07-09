'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')
const mock = require('@toa.io/libraries/mock')

const { deployment } = require('../')

const PREFIX = 'bindings-amqp'

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
    .toThrow('AMQP deployment requires either \'system\' or \'default\' URI annotation')
})

describe('proxies', () => {
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
})
