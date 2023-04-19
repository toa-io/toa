'use strict'

const { resolve } = require('node:path')
const yaml = require('@toa.io/yaml')

const { components } = require('../src/suite')

it('should be', () => {
  expect(components).toBeDefined()
})

const dummy = resolve(__dirname, 'context/components/dummy')
const pot = resolve(__dirname, 'context/components/pot')
const component = 'dummies.dummy'

/** @type {toa.samples.Suite} */
let suite

beforeAll(async () => {
  const paths = [dummy]

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

describe('options', () => {
  const paths = [dummy, pot]

  it('should filter samples by component id', async () => {
    /** @type {toa.samples.suite.Options} */
    const options = { component: 'dummies.dummy' }

    suite = await components(paths, options)

    expect(suite.operations['dummies.pot']).toBeUndefined()

    const messages = suite.messages['somewhere.something.happened']

    expect(messages.length).toStrictEqual(1)
    expect(messages[0].component).toStrictEqual('dummies.dummy')
  })

  it('should filter samples by operation name', async () => {
    /** @type {toa.samples.suite.Options} */
    const options = { operation: 'do' }

    suite = await components(paths, options)

    expect('undo' in suite.operations['dummies.dummy']).toStrictEqual(false)
  })
})

/**
 * @returns {Promise<toa.samples.operations.Set>}
 */
const operations = async () => {
  const path = resolve(dummy, 'samples')

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
  const file = resolve(dummy, 'samples/messages', label + '.yaml')
  const declarations = await yaml.load.all(file)
  const messages = declarations.map((sample) => ({ component, ...sample }))

  return { [label]: messages }
}
