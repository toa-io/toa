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

describe('Given I have (a )sample(s) for {token} operation of {component}:', () => {
  const step = gherkin.steps.Gi('I have (a )sample(s) for {token} operation of {component}:')

  it('should be', () => undefined)

  it('should define context', () => {
    const endpoint = generate()
    const component = generate()
    const input = generate()
    const output = generate()
    const sample = { input, output }
    const samples = [sample]
    const operation = { endpoint, samples }
    const yaml = dump(sample)

    step.call(context, endpoint, component, yaml)

    expect(context).toMatchObject({ component, operation })
  })
})

describe('Given I have (a )message {label} sample(s) for {component}:', () => {
  const step = gherkin.steps.Gi('I have (a )message {label} sample(s) for {component}:')

  it('should be', () => undefined)

  it('should define context', () => {
    const label = generate()
    const component = generate()
    const input = generate()
    const payload = generate()
    const sample = { input, payload }
    const samples = [sample]
    const receiver = { label, samples }
    const yaml = dump(sample)

    step.call(context, label, component, yaml)

    expect(context).toMatchObject({ component, receiver })
  })
})
