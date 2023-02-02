'use strict'

const { join } = require('node:path')
const { generate } = require('randomstring')
const { load } = require('@toa.io/libraries/yaml')
const { directory } = require('@toa.io/libraries/filesystem')
const { sample } = require('@toa.io/libraries/generic')
const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../workspace')

const gherkin = mock.gherkin

/** @type {toa.features.Context} */
let context

beforeEach(async () => {
  context = { cwd: await directory.temp() }
})

afterEach(async () => {
  if (context.cwd !== undefined) await directory.remove(context.cwd)
})

describe('Given I have a component {component}', () => {
  const step = gherkin.steps.Gi('I have a component {component}')

  it('should be', () => undefined)

  it('should copy component', async () => {
    const component = sample(['dummies.one', 'dummies.two'])

    await step.call(context, component)

    const path = join(context.cwd, 'components', component)
    const exists = await directory.is(path)

    expect(exists).toStrictEqual(true)
  })
})

describe('Given I have components:', () => {
  const step = gherkin.steps.Gi('I have components:')

  it('should copy components', async () => {
    const table = gherkin.table([['dummies.one'], ['dummies.two']])

    await step.call(context, table)

    const components = table.transpose().raw()[0]

    for (const component of components) {
      const path = join(context.cwd, 'components', component)
      const exists = await directory.is(path)

      expect(exists).toStrictEqual(true)
    }
  })

  it('should throw if non existent component', async () => {
    const table = gherkin.table([['non.existent']])

    await expect(step.call(context, table)).rejects.toThrow('does not exists')
  })
})

describe('Given I have a context with:', () => {
  const step = gherkin.steps.Gi('I have a context with:')

  let path

  beforeEach(async () => {
    path = join(context.cwd, 'context.toa.yaml')
  })

  it('should create context yaml file', async () => {
    await step.call(context)

    await expect(load(path)).resolves.not.toThrow()
  })

  it('should add additions', async () => {
    const key = generate()
    const value = generate()
    const additions = key + ': ' + value

    await step.call(context, additions)

    const contents = await load(path)

    expect(contents[key]).toStrictEqual(value)
  })
})

describe('Given I have a context', () => {
  const step = gherkin.steps.Gi('I have a context')

  let path

  beforeEach(async () => {
    path = join(context.cwd, 'context.toa.yaml')
  })

  it('should create context yaml file', async () => {
    await step.call(context)

    await expect(load(path)).resolves.not.toThrow()
  })
})

describe('Given I have integration samples', () => {
  const step = gherkin.steps.Gi('I have integration samples')

  it('should be', async () => undefined)

  it('should create samples directory', async () => {
    await step.call(context)

    const path = join(context.cwd, 'samples')

    expect(await directory.is(path)).toStrictEqual(true)
  })
})
