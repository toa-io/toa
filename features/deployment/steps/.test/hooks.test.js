'use strict'

const { join } = require('node:path')
const { directory } = require('@toa.io/libraries/filesystem')
const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../hooks')

const gherkin = mock.gherkin

let context

beforeEach(async () => {
  context = { directory: await directory.temp() }
})

afterEach(async () => {
  if (context.directory !== undefined) await directory.remove(context.directory)
})

describe('Before', () => {
  const step = gherkin.steps.Before(0)[0]

  it('should create directory', async () => {
    delete context.directory

    await step.call(context)

    expect(context.directory).toBeDefined()
    await expect(directory.is(context.directory)).resolves.not.toThrow()
  })

  it('should create context directory', async () => {
    await step.call(context)

    const path = join(context.directory, 'context')

    await expect(directory.is(path)).resolves.not.toThrow()
  })
})

describe('After', () => {
  const step = gherkin.steps.After(0)[0]

  it('should remove directory', async () => {
    const before = context.directory

    await step.call(context)

    expect(context.directory).toBeUndefined()

    await expect(directory.is(before)).rejects.toThrow(/ENOENT: no such file or directory/)
  })
})
