'use strict'

const { resolve } = require('node:path')
const yaml = require('@toa.io/libraries/yaml')

const { translate } = require('../src/.suite/.component/translate')
const { components } = require('../src/suite')

it('should be', () => {
  expect(components).toBeDefined()
})

const root = resolve(__dirname, 'context/components')
const path = resolve(root, 'ok')
const paths = [path]
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
    const expected = await actual()
    const { components } = suite

    expect(Object.keys(components)).toStrictEqual([component])

    const set = components[component].operations

    expect(Object.keys(set)).toStrictEqual(['do', 'undo'])

    expect(set.do).toStrictEqual(expected.do)
    expect(set.undo).toStrictEqual(expected.undo)
  })

  const actual = async () => {
    const samples = resolve(path, 'samples')

    const do1 = (await yaml.load.all(resolve(samples, 'do.yaml'))).map(translate)
    const do2 = (await yaml.load.all(resolve(samples, 'dummies.dummy.do.yaml'))).map(translate)
    const undo = (await yaml.load.all(resolve(samples, 'dummies.dummy.undo.yaml'))).map(translate)

    return {
      do: [...do1, ...do2],
      undo
    }
  }
})
