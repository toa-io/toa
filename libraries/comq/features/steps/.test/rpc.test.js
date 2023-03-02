'use strict'

const { AssertionError } = require('node:assert')
const { generate } = require('randomstring')
const { promex } = require('@toa.io/libraries/generic')
const { dump } = require('@toa.io/libraries/yaml')
const { gherkin } = require('@toa.io/libraries/mock')
const { io } = require('./io.mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)

require('../rpc')

/** @type {comq.features.Context} */
let context

const queue = generate()

beforeEach(() => {
  jest.clearAllMocks()

  context = /** @type {comq.features.Context} */ { io }
})

describe('Given function replying {token} queue:', () => {
  const step = gherkin.steps.Gi('function replying {token} queue:')

  it('should be', () => undefined)

  it('should assign given function as producer', async () => {
    const javascript = '({ a, b }) => a + b'

    await step.call(context, queue, javascript)

    expect(io.reply).toHaveBeenCalledWith(queue, expect.any(Function))

    const producer = io.reply.mock.calls[0][1]
    const sum = producer({ a: 1, b: 2 })

    expect(sum).toStrictEqual(3)
  })
})

describe('Given function replying {token} queue is expected:', () => {
  gherkin.steps.Gi('function replying {token} queue is expected:')

  it('should be', () => undefined)
})

describe('When the consumer sends the following request to the {token} queue:', () => {
  const step = gherkin.steps.Wh('the consumer sends the following request to the {token} queue:')

  it('should be', async () => undefined)

  const payload = { [generate()]: generate() }
  const yaml = dump(payload)

  beforeEach(async () => {
    await step.call(context, queue, yaml)
  })

  it('should send request', async () => {
    expect(io.request).toHaveBeenCalledWith(queue, payload)
  })

  it('should store reply promise', async () => {
    const reply = await io.request.mock.results[0].value

    expect(await context.reply).toStrictEqual(reply)
  })

  it('should wait for context.expected', async () => {
    context.expected = promex()

    let completed = false

    setImmediate(() => {
      expect(completed).toStrictEqual(false)

      completed = true

      context.expected.resolve()
    })

    await step.call(context, queue, yaml)

    expect(completed).toStrictEqual(true)
  })
})

describe('Then the consumer receives the reply:', (type, value) => {
  const step = gherkin.steps.Th('the consumer receives the reply:')

  it('should be', async () => undefined)

  const replies = [
    ['primitive', generate()],
    ['object', { ok: 1 }],
    ['array', [1, 'foo']]
  ]

  describe.each(replies)('%s reply comparison', (type, value) => {
    let yaml

    beforeEach(() => {
      yaml = dump(value)
    })

    it('should throw if differ', async () => {
      const promise = promex()

      context.reply = promise
      promise.resolve(generate())

      await expect(step.call(context, yaml)).rejects.toThrow(AssertionError)
    })

    it('should pass if equals', async () => {
      const promise = promex()

      context.reply = promise

      promise.resolve(value)

      await expect(step.call(context, yaml)).resolves.not.toThrow()
    })
  })
})
