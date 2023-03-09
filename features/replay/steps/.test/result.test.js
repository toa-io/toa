'use strict'

const { AssertionError } = require('node:assert')
const { gherkin } = require('@toa.io/mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../result')

it('should be', () => undefined)

/** @type {toa.samples.features.Context} */
let context

beforeEach(() => {
  context = {}
})

describe('Then it passes', () => {
  const step = gherkin.steps.Th('it passes')

  it('should be', () => undefined)

  it('should not throw if ok', () => {
    context.ok = true

    expect(() => step.call(context)).not.toThrow()
  })

  it('should throw if not ok', () => {
    context.ok = false

    expect(() => step.call(context)).toThrow(AssertionError)
  })
})

describe('Then it fails', () => {
  const step = gherkin.steps.Th('it fails')

  it('should be', () => undefined)

  it('should not throw if not ok', () => {
    context.ok = false

    expect(() => step.call(context)).not.toThrow()
  })

  it('should throw if ok', () => {
    context.ok = true

    expect(() => step.call(context)).toThrow(AssertionError)
  })
})
