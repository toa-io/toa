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

describe('components', () => {
  beforeAll(async () => {
    suite = await components(paths)
  })

  it('should be', () => {
    expect(suite).toBeDefined()
  })

  it('should define suite as autonomous', async () => {
    expect(suite.autonomous).toStrictEqual(true)
  })

  it('should load component samples', async () => {
    const expected = await operations()
    const { components } = suite

    expect(Object.keys(components)).toStrictEqual([component])

    const set = components[component].operations

    expect(Object.keys(set)).toStrictEqual(['do', 'undo'])

    expect(set.do).toStrictEqual(expected.do)
    expect(set.undo).toStrictEqual(expected.undo)
  })

  it('should load message samples', async () => {
    const expected = await messages()
    const set = suite.components[component].messages

    expect(set).toStrictEqual(expected)
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
      do: [...do1, ...do2],
      undo
    }
  }

  /**
   *
   * @returns {Promise<toa.samples.messages.Set>}
   */
  const messages = async () => {
    const label = 'somewhere.something.happened'
    const file = resolve(root, 'samples/messages', label + '.yaml')
    const messages = await yaml.load.all(file)

    return { [label]: messages }
  }
})
