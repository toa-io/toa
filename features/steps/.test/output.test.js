'use strict'

const { AssertionError } = require('node:assert')
const { generate } = require('randomstring')
const { sample } = require('@toa.io/generic')

const mock = require('@toa.io/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../output')

const gherkin = mock.gherkin

/** @type {toa.features.Context} */
let context

beforeEach(async () => {
  context = { stdoutLines: [] }
})

describe('Then {word} should contain line(s):', () => {
  const step = gherkin.steps.Th('{word} should contain line(s):')

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

describe('Then {word} should contain line(s) once:', () => {
  const step = gherkin.steps.Th('{word} should contain line(s) once:')

  it('should be', () => undefined)

  it('should throw if not contains', () => {
    context.stdoutLines = []

    expect(() => step.call(context, 'stdout', 'second')).toThrow(AssertionError)
  })

  it('should throw if contains more than once', () => {
    context.stderrLines = ['one', 'one']

    expect(() => step.call(context, 'stderr', 'one')).toThrow(AssertionError)
  })
})

describe('Then {word} should be: {string}', () => {
  const step = gherkin.steps.Th('{word} should be: {string}')

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

describe('Then {word} should not contain line(s):', () => {
  const step = gherkin.steps.Th('{word} should not contain line(s):')

  it('should be', async () => undefined)

  describe.each(/** @type {string[]} */['stdout', 'stderr'])('%s',
    (channel) => {
      const channelLines = channel + 'Lines'

      beforeEach(() => {
        context[channelLines] = [generate(), generate()]
      })

      it('should pass if not contains', async () => {
        const line = generate()

        expect(() => step.call(context, channel, line)).not.toThrow()
      })

      it('should throw if contains', async () => {
        const line = sample(context[channelLines])

        expect(() => step.call(context, channel, line)).toThrow(AssertionError)
      })
    })
})
