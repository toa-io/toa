'use strict'

const { join } = require('node:path')
const { AssertionError } = require('node:assert')

const { transpose } = require('@toa.io/generic')
const { directory } = require('@toa.io/filesystem')
const { load } = require('@toa.io/yaml')
const mock = require('@toa.io/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)

require('../deployment')
require('../workspace')

const gherkin = mock.gherkin

/** @type {toa.features.Context} */
let context

beforeEach(async () => {
  context = { cwd: await directory.temp() }
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
    await ctx.call(context, 'amqp: amqp://default')
  })

  it('should create directory', async () => {
    await step.call(context)

    await expect(directory.is(path)).resolves.not.toThrow()
  })

  it('should create chart', async () => {
    await step.call(context)

    const file = join(path, 'Chart.yaml')
    const chart = await load(file)

    expect(chart).toMatchObject({ name: 'collection', type: 'application' })
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

  beforeEach(() => {
    context.cwd = join(__dirname, './assets')
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

describe('Then exported {helm-artifact} should not contain:', () => {
  const step = gherkin.steps.Th('exported {helm-artifact} should not contain:')

  beforeEach(() => {
    context.cwd = join(__dirname, './assets')
  })

  it('should be', () => undefined)

  describe('chart', () => {
    it('should fail if contain', async () => {
      await expect(step.call(context, 'Chart', 'name: dummies')).rejects.toThrow(AssertionError)
    })

    it('should fail if contain multiline', async () => {
      const text = 'apiVersion: v1\nversion: 0.0.0'

      await expect(step.call(context, 'Chart', text)).rejects.toThrow(AssertionError)
    })

    it('should pass if not contain', async () => {
      const call = step.call(context, 'Chart', 'name: dummies\nversion: 1.1.1')

      await expect(call).resolves.not.toThrow(AssertionError)
    })
  })
})
