'use strict'

const { resolve } = require('node:path')
const yaml = require('@toa.io/libraries/yaml')

const { translate } = require('../src/.suite/translate')
const { load } = require('../src/suite')

it('should be', () => {
  expect(load).toBeDefined()
})

const root = resolve(__dirname, 'context/components')
const path = resolve(root, 'ok')
const component = 'dummies.dummy'

/** @type {toa.samples.Suite} */
let suite

it('should define context-level suite as non-autonomous', async () => {
  suite = await load(path)

  expect(suite.autonomous).toStrictEqual(false)
})

it('should define component-level suite as autonomous', async () => {
  suite = await load(path, component)

  expect(suite.autonomous).toStrictEqual(true)
})

describe('component samples', () => {
  beforeAll(async () => {
    suite = await load(path, component)
  })

  it('should be', () => {
    expect(suite).toBeDefined()
  })

  it('should load component samples', async () => {
    const expected = await actual()
    const { autonomous, ...operations } = suite

    expect(Object.keys(operations)).toStrictEqual([component])

    const set = suite[component]

    expect(Object.keys(set)).toStrictEqual(['do', 'undo'])

    expect(set.do).toStrictEqual(expected.do)
    expect(set.undo).toStrictEqual(expected.undo)
  })

  it('should throw on component id mismatch', async () => {
    await expect(() => load(path, 'not.correct')).rejects.toThrow('Component id mismatch')
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
