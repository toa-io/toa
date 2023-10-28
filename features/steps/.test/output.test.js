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

  it('should pass if contains', async () => {
    context.stdoutLines = ['first', 'second', 'third']

    await expect(step.call(context, 'stdout', 'second')).resolves.not.toThrow()
  })

  it('should pass if has a whitespace', async () => {
    context.stdoutLines = ['  first', '  second', '  third']

    await expect(step.call(context, 'stdout', 'second')).resolves.not.toThrow()
    await expect(step.call(context, 'stdout', ' second ')).resolves.not.toThrow()
  })

  it('should throw if not contains', async () => {
    context.stdoutLines = []

    await expect(step.call(context, 'stdout', 'second')).rejects.toThrow(AssertionError)
  })

  it('should pass if starts with', async () => {
    context.stdoutLines = ['first second third']

    await expect(step.call(context, 'stdout', 'first second')).resolves.not.toThrow()
  })

  it('should pass with wildcards', async () => {
    context.stdoutLines = ['hello world example']

    await expect(step.call(context, 'stdout', '<...> world')).resolves.not.toThrow()
  })
})

describe('Then {word} should contain line(s) once:', () => {
  const step = gherkin.steps.Th('{word} should contain line(s) once:')

  it('should be', () => undefined)

  it('should throw if not contains', async () => {
    context.stdoutLines = []

    await expect(step.call(context, 'stdout', 'second')).rejects.toThrow(AssertionError)
  })

  it('should throw if contains more than once', async () => {
    context.stderrLines = ['one', 'one']

    await expect(step.call(context, 'stderr', 'one')).rejects.toThrow(AssertionError)
  })
})

describe('Then {word} should be: {string}', () => {
  const step = gherkin.steps.Th('{word} should be: {string}')

  it('should be', () => undefined)

  it('should pass if equals', async () => {
    context.stdout = 'a message'

    await expect(step.call(context, 'stdout', 'a message')).resolves.not.toThrow()
    await expect(step.call(context, 'stdout', 'wrong')).rejects.toThrow(AssertionError)
  })

  it('should pass if starts with', async () => {
    context.stdout = 'a message'

    await expect(step.call(context, 'stdout', 'a mess')).resolves.not.toThrow()
  })

  it('should trim', async () => {
    context.stdout = '  a message'

    await expect(step.call(context, 'stdout', 'a message')).resolves.not.toThrow()
    await expect(step.call(context, 'stdout', 'a message  ')).resolves.not.toThrow()
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

        await expect(step.call(context, channel, line)).resolves.not.toThrow()
      })

      it('should throw if contains', async () => {
        const line = sample(context[channelLines])

        await expect(step.call(context, channel, line)).rejects.toThrow(AssertionError)
      })
    })
})
