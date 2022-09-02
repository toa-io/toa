'use strict'

const { generate } = require('randomstring')
const { dump } = require('@toa.io/libraries/yaml')
const { gherkin } = require('@toa.io/libraries/mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../sample')

it('should be', () => undefined)

/** @type {toa.samples.features.Context} */
let context

beforeEach(() => {
  context = {}
})

describe('Given I have (a )sample(s) of {operation} for {component}:', () => {
  const step = gherkin.steps.Gi('I have (a )sample(s) of {operation} for {component}:')

  it('should be', () => undefined)

  it('should define context', () => {
    const operation = generate()
    const component = generate()
    const input = generate()
    const output = generate()
    const sample = { input, output }
    const samples = [sample]
    const yaml = dump(sample)

    step.call(context, operation, component, yaml)

    expect(context).toMatchObject({ operation, component, samples })
  })
})
