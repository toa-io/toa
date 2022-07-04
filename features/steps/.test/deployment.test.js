'use strict'

const { join } = require('node:path')
const { AssertionError } = require('node:assert')

const { transpose } = require('@toa.io/libraries/generic')
const { directory } = require('@toa.io/libraries/filesystem')
const { load } = require('@toa.io/libraries/yaml')
const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../deployment')
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

describe('When I export deployment', () => {
  const step = gherkin.steps.Wh('I export deployment')
  const components = ['dummies.one', 'dummies.two']

  let path

  beforeEach(async () => {
    path = join(context.cwd, 'deployment')

    const ctx = gherkin.steps.Gi('I have a context with:')
    const copy = gherkin.steps.Gi('I have components:')
    const rows = transpose(components)
    const table = gherkin.table(rows)

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
  const step = gherkin.steps.Th('exported {helm-artifact} should contain:')

  let original

  beforeEach(() => {
    original = context.cwd
    context.cwd = join(__dirname, 'assets')
  })

  afterEach(() => {
    context.cwd = original
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
