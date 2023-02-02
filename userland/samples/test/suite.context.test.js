'use strict'

const { join } = require('node:path')
const yaml = require('@toa.io/libraries/yaml')

const { context } = require('../src/suite')

it('should be', async () => {
  expect(context).toBeDefined()
})

const root = join(__dirname, 'context')

/** @type {toa.samples.Suite} */
let suite

beforeAll(async () => {
  suite = await context(root)
})

it('should return object', async () => {
  expect(typeof suite).toStrictEqual('object')
})

it('should set title', async () => {
  expect(suite.title).toStrictEqual('Integration samples')
})

it('should define suite as non-autonomous', async () => {
  expect(suite.autonomous).toStrictEqual(false)
})

it('should load operation samples', async () => {
  const expected = await operations()

  expect(suite.operations).toStrictEqual(expected)
})

it('should load message samples', async () => {
  const expected = await messages()

  expect(suite.messages).toStrictEqual(expected)
})

/**
 * @returns {Promise<toa.samples.suite.Operations>}
 */
const operations = async () => {
  const path = join(root, 'samples')
  const component = 'dummies.dummy'
  const endpoints = ['transit', 'observe']

  /** @type {toa.samples.suite.Operations} */
  const operations = {}

  /** @type {toa.samples.operations.Set} */
  const set = operations[component] = {}

  for (const endpoint of endpoints) {
    const filename = component + '.' + endpoint + '.yaml'
    const filepath = join(path, filename)

    set[endpoint] = /** @type {toa.samples.Operation[]} */ await yaml.load.all(filepath)
  }

  return operations
}

/**
 * @returns {Promise<toa.samples.messages.Set>}
 */
const messages = async () => {
  const label = 'somewhere.something.happened'
  const file = label + '.yaml'
  const path = join(root, 'samples/messages', file)
  const samples = /** @type {toa.samples.Message[]} */ await yaml.load.all(path)

  return { [label]: samples }
}
