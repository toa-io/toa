'use strict'

const { directory } = require('@toa.io/filesystem')
const mock = require('@toa.io/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('./hooks')

const gherkin = mock.gherkin

/** @type {toa.features.Context} */
let context

beforeEach(async () => {
  context = { cwd: await directory.temp() }
})

afterEach(async () => {
  if (context.cwd !== undefined) await directory.remove(context.cwd)
})

describe('Before', () => {
  const step = gherkin.steps.Be()

  it('should create temp directory', async () => {
    delete context.cwd

    await step.call(context)

    expect(context.cwd).toBeDefined()
    await expect(directory.is(context.cwd)).resolves.not.toThrow()
  })
})

describe('BeforeALl', () => {
  const step = gherkin.steps.BeAl()

  it('should be', () => undefined)

  it('should set TOA_DEV', () => {
    step.call(context)

    expect(process.env.TOA_DEV).toStrictEqual('1')
  })
})
