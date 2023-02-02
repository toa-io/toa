'use strict'

const { resolve } = require('node:path')
const yaml = require('@toa.io/libraries/yaml')

const { components } = require('../src/suite')

it('should be', () => {
  expect(components).toBeDefined()
})

const root = resolve(__dirname, 'context/components/ok')
const paths = [root]
const component = 'dummies.dummy'

/** @type {toa.samples.Suite} */
let suite

beforeAll(async () => {
  suite = await components(paths)
})

it('should return object', () => {
  expect(typeof suite).toStrictEqual('object')
})

it('should set title', async () => {
  expect(suite.title).toStrictEqual('Component samples')
})

it('should define suite as autonomous', async () => {
  expect(suite.autonomous).toStrictEqual(true)
})

it('should load component samples', async () => {
  const expected = await operations()

  expect(Object.keys(suite.operations)).toStrictEqual([component])

  const set = suite.operations[component]

  expect(Object.keys(set)).toStrictEqual(['do', 'undo'])

  expect(set.do).toStrictEqual(expected.do)
  expect(set.undo).toStrictEqual(expected.undo)
})

it('should load message samples', async () => {
  const expected = await messages()

  expect(suite.messages).toStrictEqual(expected)
})

/**
 * @returns {Promise<toa.samples.operations.Set>}
 */
const operations = async () => {
  const path = resolve(root, 'samples')

  /** @type {toa.samples.Operation[]} */
  const do1 = (await yaml.load.all(resolve(path, 'do.yaml')))

  /** @type {toa.samples.Operation[]} */
  const do2 = (await yaml.load.all(resolve(path, 'dummies.dummy.do.yaml')))

  /** @type {toa.samples.Operation[]} */
  const undo = (await yaml.load.all(resolve(path, 'dummies.dummy.undo.yaml')))

  return {
    do: [...do1, ...do2], undo
  }
}

/**
 *
 * @returns {Promise<toa.samples.messages.Set>}
 */
const messages = async () => {
  const label = 'somewhere.something.happened'
  const file = resolve(root, 'samples/messages', label + '.yaml')
  const declarations = await yaml.load.all(file)
  const messages = declarations.map((sample) => ({ component, ...sample }))

  return { [label]: messages }
}
