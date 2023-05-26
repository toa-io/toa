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

it('should load operation samples', async () => {
  const expected = await operations()

  expect(Object.keys(suite.operations)).toStrictEqual([component])

  const set = suite.operations[component]

  expect(Object.keys(set)).toStrictEqual(['do', 'undo'])

  expect(set.do).toStrictEqual(expected.do)
  expect(set.undo).toStrictEqual(expected.undo)
})

describe('options', () => {
  const paths = [dummy, pot]

  it('should filter samples by component id', async () => {
    /** @type {toa.samples.suite.Options} */
    const options = { component: 'dummies.dummy' }

    suite = await components(paths, options)

    expect(suite.operations['dummies.pot']).toBeUndefined()
  })

  it('should filter samples by operation name', async () => {
    /** @type {toa.samples.suite.Options} */
    const options = { operation: 'do' }

    suite = await components(paths, options)

    expect('undo' in suite.operations['dummies.dummy']).toStrictEqual(false)
  })

  it('should filter operation samples by title', async () => {
    /** @type {toa.samples.suite.Options} */
    const options = { title: 'Should not undo' }

    suite = await components(paths, options)

    expect('do' in suite.operations['dummies.dummy']).toStrictEqual(false)
    expect(suite.operations['dummies.dummy'].undo.length).toStrictEqual(1)
    expect(suite.operations['dummies.dummy'].undo[0].title).toStrictEqual(options.title)
  })

  it('should filter operation samples by title as regexp', async () => {
    /** @type {toa.samples.suite.Options} */
    const options = { title: 'Should [a-z]{2}t undo' }

    suite = await components(paths, options)

    expect(suite.operations['dummies.dummy']?.do).toBeUndefined()
    expect(suite.operations['dummies.dummy'].undo.length).toStrictEqual(1)
    expect(suite.operations['dummies.dummy'].undo[0].title).toStrictEqual('Should not undo')
  })

  it('should filter operation samples by title', async () => {
    /** @type {toa.samples.suite.Options} */
    const options = { title: 'Should not undo' }

    suite = await components(paths, options)

    expect(Object.keys(suite.operations['dummies.dummy']).length).toStrictEqual(1)
    expect(suite.operations['dummies.dummy'].undo[0].title).toStrictEqual(options.title)
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
