'use strict'

const { resolve } = require('node:path')
const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../hooks')

const gherkin = mock.gherkin
const root = resolve(__dirname, '../../../../')

describe('Before', () => {
  const step = gherkin.steps.Before(0)[0]
  let context

  beforeEach(async () => {
    context = {}
  })

  it('should be', () => undefined)

  it('should set project root as working directory', () => {
    step.call(context)

    expect(context.cwd).toStrictEqual(root)
    expect(process.cwd()).toStrictEqual(root)
  })
})
