'use strict'

const { directory } = require('@toa.io/libraries/filesystem')
const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../hooks')

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
  const step = gherkin.steps.Be(0)[0]

  it('should create temp directory', async () => {
    delete context.cwd

    await step.call(context)

    expect(context.cwd).toBeDefined()
    await expect(directory.is(context.cwd)).resolves.not.toThrow()
  })
})

describe('BeforeALl', () => {
  const step = gherkin.steps.BeAl(0)[0]

  it('should be', () => undefined)

  it('should set TOA_ENV to local', () => {
    step.call()

    expect(process.env.TOA_ENV).toStrictEqual('local')
  })
})
