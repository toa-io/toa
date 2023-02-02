'use strict'

const { dump } = require('@toa.io/libraries/yaml')
const { gherkin } = require('@toa.io/libraries/mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../integration')
const { generate } = require('randomstring')

it('should be', () => undefined)

/** @type {toa.samples.features.Context} */
let context

const namespace = generate()
const name = generate()
const component = namespace + '.' + name
const operation = generate()
const endpoint = component + '.' + operation
const sample = { input: generate() }
const yaml = dump(sample)

beforeEach(() => {
  context = {}
})

describe('Given I have (an )integration sample(s) of {endpoint} operation:', () => {
  const step = gherkin.steps.Gi('I have (an )integration sample(s) of {endpoint} operation:')

  it('should be', () => undefined)

  beforeEach(() => {
    step.call(context, endpoint, yaml)
  })

  it('should define non-autonomous suite', async () => {
    expect(context.autonomous).toStrictEqual(false)
  })

  it('should define component', () => {
    expect(context.component).toStrictEqual(component)
  })

  it('should define operation', async () => {
    expect(context.operation).toBeDefined()
    expect(context.operation.endpoint).toStrictEqual(operation)
    expect(context.operation.samples).toStrictEqual([sample])
  })
})
