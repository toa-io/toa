'use strict'

const { AssertionError } = require('node:assert')

const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../output')

const gherkin = mock.gherkin

/** @type {toa.features.cli.Context} */
let context

beforeEach(async () => {
  context = { stdoutLines: [] }
})

describe('{word} should contain lines:', () => {
  const step = gherkin.steps.Then('{word} should contain lines:')

  it('should be', () => undefined)

  it('should pass if contains', () => {
    context.stdoutLines = ['first', 'second', 'third']

    expect(() => step.call(context, 'stdout', 'second')).not.toThrow()
  })

  it('should pass if has a whitespace', () => {
    context.stdoutLines = ['  first', '  second', '  third']

    expect(() => step.call(context, 'stdout', 'second')).not.toThrow()
    expect(() => step.call(context, 'stdout', ' second ')).not.toThrow()
  })

  it('should throw if not contains', () => {
    context.stdoutLines = []

    expect(() => step.call(context, 'stdout', 'second')).toThrow(AssertionError)
  })

  it('should pass if starts with', () => {
    context.stdoutLines = ['first second third']

    expect(() => step.call(context, 'stdout', 'first second')).not.toThrow()
  })
})

describe('{word} should be: {string}', () => {
  const step = gherkin.steps.Then('{word} should be: {string}')

  it('should be', () => undefined)

  it('should pass if equals', () => {
    context.stdout = 'a message'

    expect(() => step.call(context, 'stdout', 'a message')).not.toThrow()
    expect(() => step.call(context, 'stdout', 'wrong')).toThrow(AssertionError)
  })

  it('should pass if starts with', () => {
    context.stdout = 'a message'

    expect(() => step.call(context, 'stdout', 'a mess')).not.toThrow()
  })

  it('should trim', () => {
    context.stdout = '  a message'

    expect(() => step.call(context, 'stdout', 'a message')).not.toThrow()
    expect(() => step.call(context, 'stdout', 'a message  ')).not.toThrow()
  })
})
