'use strict'

const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../component')
const { resolve } = require('node:path')
const { directory } = require('../../../../libraries/filesystem')
const { generate } = require('randomstring')

const gherkin = mock.gherkin
const ROOT = resolve(__dirname, '../../../../')
const component = 'dummies.one'

let context

beforeEach(() => {
  process.chdir(ROOT)

  context = { cwd: ROOT }
})

describe('Given I have a component {component}', () => {
  const step = gherkin.steps.Given('I have a component {component}')

  it('should be', () => undefined)

  it('should create temp dir and set it as cwd', async () => {
    await step.call(context, component)

    expect(process.cwd()).not.toStrictEqual(ROOT)
    expect(context.cwd).not.toStrictEqual(ROOT)
  })

  it('should add component to cwd', async () => {
    await step.call(context, component)

    const path = resolve(context.cwd, component)

    await expect(directory.is(path)).resolves.not.toThrow()
  })

  it('should throw if component doesn\'t exists', async () => {
    const component = generate()

    await expect(step.call(context, component)).rejects.toThrow()
  })
})
