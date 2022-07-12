'use strict'

const { generate } = require('randomstring')
const mock = require('@toa.io/libraries/mock')

jest.mock('@toa.io/libraries/kubernetes')
jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../kube.js')

const kube = /** @type {{ context: { set: jest.Mock } }} */ require('@toa.io/libraries/kubernetes')

const gherkin = mock.gherkin

it('should be', () => undefined)

describe('Given I have a kube context {word}', () => {
  const step = gherkin.steps.Gi('I have a kube context {word}')

  it('should be', () => undefined)

  it('should set context', async () => {
    const context = generate()

    await step.call(null, context)

    expect(kube.context.set).toHaveBeenCalledWith(context)
  })
})
