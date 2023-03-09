'use strict'

const { AssertionError } = require('node:assert')
const { gherkin } = require('@toa.io/mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)

require('../poison')

/** @type {comq.features.Context} */
let context

beforeEach(() => {
  context = /** @type {comq.features.Context} */ { events: {} }
})

describe('Then the message is discarded', () => {
  const step = gherkin.steps.Th('the message is discarded')

  it('should be', async () => undefined)

  it('should throw if not discarded', async () => {
    await expect(step.call(context)).rejects.toThrow(AssertionError)
  })

  it('should not throw if discarded', async () => {
    context.events.discard = true

    await expect(step.call(context)).resolves.not.toThrow()
  })

  it('should wait for discard event', async () => {
    setTimeout(() => {
      context.events.discard = true
    }, 10)

    await expect(step.call(context)).resolves.not.toThrow()
  })
})
