'use strict'

const { join } = require('node:path')
const { generate } = require('randomstring')
const { AssertionError } = require('node:assert')

const { transpose } = require('@toa.io/libraries/generic')
const { directory } = require('@toa.io/libraries/filesystem')
const { load } = require('@toa.io/libraries/yaml')
const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../deployment')

const gherkin = mock.gherkin

let context

beforeEach(async () => {
  context = { directory: await directory.temp() }

  const path = join(context.directory, 'context')

  await directory.ensure(path)
})

afterEach(async () => {
  if (context.directory !== undefined) await directory.remove(context.directory)
})

describe('Given I have components:', () => {
  const step = gherkin.steps.Given('I have components:')

  it('should copy components', async () => {
    const table = gherkin.table([['dummies.one'], ['dummies.two']])

    await step.call(context, table)

    expect(context.directory).toBeDefined()

    const components = table.rows()[0]

    for (const component of components) {
      const path = join(context.directory, 'context/components', component)
      const exists = await directory.is(path)

      expect(exists).toStrictEqual(true)
    }
  })

  it('should throw if non existent component', async () => {
    const table = gherkin.table([['non.existent']])

    await expect(step.call(context, table)).rejects.toThrow(/ENOENT: no such file or directory/)
  })
})

describe('Given I have the context with:', () => {
  const step = gherkin.steps.Given('I have the context with:')

  let path

  beforeEach(async () => {
    path = join(context.directory, 'context/context.toa.yaml')
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

describe('When I have exported the deployment', () => {
  const step = gherkin.steps.When('I have exported the deployment')
  const components = ['dummies.one', 'dummies.two']

  let path

  beforeEach(async () => {
    path = join(context.directory, 'deployment')

    const ctx = gherkin.steps.Given('I have the context with:')
    const copy = gherkin.steps.Given('I have components:')
    const columns = transpose(components)
    const table = gherkin.table(columns)

    await copy.call(context, table)
    await ctx.call(context)
  })

  it('should create directory', async () => {
    await step.call(context)

    await expect(directory.is(path)).resolves.not.toThrow()
  })

  it('should create chart', async () => {
    await step.call(context)

    const file = join(path, 'Chart.yaml')
    const chart = await load(file)

    expect(chart).toMatchObject({ name: 'dummies', type: 'application' })
  })

  it('should create values', async () => {
    const file = join(path, 'values.yaml')
    const labels = components.map((id) => id.replace('.', '-'))

    await step.call(context)

    const values = await load(file)

    expect(values).toMatchObject({ components: labels })
  })
})

describe('Then exported {helm-artifact} should contain:', () => {
  const step = gherkin.steps.Then('exported {helm-artifact} should contain:')

  let original

  beforeEach(() => {
    original = context.directory
    context.directory = join(__dirname, 'assets')
  })

  afterEach(() => {
    context.directory = original
  })

  describe('chart', () => {
    it('should pass if contain', async () => {
      await expect(step.call(context, 'Chart', 'name: dummies')).resolves.not.toThrow()
    })

    it('should pass if contain multiline', async () => {
      const text = 'apiVersion: v1\nversion: 0.0.0'

      await expect(step.call(context, 'Chart', text)).resolves.not.toThrow()
    })

    it('should fail if not contain', async () => {
      await expect(step.call(context, 'Chart', 'name: dummies\nversion: 1.1.1')).rejects.toThrow(AssertionError)
    })
  })
})
